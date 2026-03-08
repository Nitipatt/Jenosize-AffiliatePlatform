import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid',
        username: 'testuser',
      });

      const result = await service.register({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.username).toBe('testuser');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({ username: 'admin', password: 'password123' }),
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for wrong username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ username: 'nonexistent', password: 'password123' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return tokens on successful login', async () => {
      // Create a user first
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto
        .pbkdf2Sync('password123', salt, 10000, 64, 'sha512')
        .toString('hex');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        username: 'admin',
        passwordHash: `${salt}:${hash}`,
      });
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.login({
        username: 'admin',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', async () => {
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto
        .pbkdf2Sync('password123', salt, 10000, 64, 'sha512')
        .toString('hex');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        username: 'admin',
        passwordHash: `${salt}:${hash}`,
      });
      mockRedis.set.mockResolvedValue('OK');

      const { accessToken } = await service.login({
        username: 'admin',
        password: 'password123',
      });

      const payload = service.verifyAccessToken(accessToken);
      expect(payload).toBeDefined();
      expect(payload?.sub).toBe('user-uuid');
      expect(payload?.username).toBe('admin');
    });

    it('should return null for invalid token', () => {
      const result = service.verifyAccessToken('invalid.token.here');
      expect(result).toBeNull();
    });
  });

  describe('getCookieOptions', () => {
    it('should return httpOnly and sameSite strict options', () => {
      const opts = service.getCookieOptions(900);
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe('strict');
      expect(opts.maxAge).toBe(900000);
    });
  });
});
