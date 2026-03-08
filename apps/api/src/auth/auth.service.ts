import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as crypto from 'crypto';

interface TokenPayload {
  sub: string;
  username: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: number; // seconds
  private readonly refreshExpiresIn: number; // seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.accessSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessExpiresIn = 3 * 60; // 3 minutes
    this.refreshExpiresIn = 30 * 60; // 30 minutes
  }

  async register(dto: RegisterDto) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(dto.password, salt, 10000, 64, 'sha512')
      .toString('hex');

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash: `${salt}:${hash}`,
      },
    });

    this.logger.log(`User registered: ${user.username}`);
    return { id: user.id, username: user.username };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const [salt, storedHash] = user.passwordHash.split(':');
    const hash = crypto
      .pbkdf2Sync(dto.password, salt, 10000, 64, 'sha512')
      .toString('hex');
    if (hash !== storedHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload: TokenPayload = { sub: user.id, username: user.username };
    const accessToken = this.generateToken(
      payload,
      this.accessSecret,
      this.accessExpiresIn,
    );
    const refreshToken = this.generateToken(
      payload,
      this.refreshSecret,
      this.refreshExpiresIn,
    );

    // Store refresh token in Redis
    await this.redis.set(
      `refresh:${user.id}`,
      refreshToken,
      'EX',
      this.refreshExpiresIn,
    );

    this.logger.log(`User logged in: ${user.username}`);
    return { accessToken, refreshToken, user: { id: user.id, username: user.username } };
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyToken(refreshToken, this.refreshSecret);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Validate against Redis
    const storedToken = await this.redis.get(`refresh:${payload.sub}`);
    if (storedToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Generate new access token
    const newPayload: TokenPayload = {
      sub: payload.sub,
      username: payload.username,
    };
    const accessToken = this.generateToken(
      newPayload,
      this.accessSecret,
      this.accessExpiresIn,
    );

    // Rotate refresh token
    const newRefreshToken = this.generateToken(
      newPayload,
      this.refreshSecret,
      this.refreshExpiresIn,
    );
    await this.redis.set(
      `refresh:${payload.sub}`,
      newRefreshToken,
      'EX',
      this.refreshExpiresIn,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
    this.logger.log(`User logged out: ${userId}`);
  }

  verifyAccessToken(token: string): TokenPayload | null {
    return this.verifyToken(token, this.accessSecret);
  }

  getCookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: maxAge * 1000, // convert to ms
    };
  }

  get accessMaxAge() {
    return this.accessExpiresIn;
  }

  get refreshMaxAge() {
    return this.refreshExpiresIn;
  }

  // --- Simple JWT-like token implementation using HMAC ---

  private generateToken(
    payload: TokenPayload,
    secret: string,
    expiresIn: number,
  ): string {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');

    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      }),
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  private verifyToken(token: string, secret: string): TokenPayload | null {
    try {
      const [header, body, signature] = token.split('.');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;

      return { sub: payload.sub, username: payload.username };
    } catch {
      return null;
    }
  }
}
