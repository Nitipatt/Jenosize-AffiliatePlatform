import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedirectService {
  private readonly logger = new Logger(RedirectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('clicks') private readonly clicksQueue: Queue,
  ) {}

  async resolve(
    shortCode: string,
    referrer?: string,
    userAgent?: string,
  ): Promise<string> {
    // 1. Try Redis cache first (fast path)
    let targetUrl = await this.redis.get(`shortlink:${shortCode}`);

    if (!targetUrl) {
      // 2. Cache miss — fetch from DB
      const link = await this.prisma.link.findUnique({
        where: { shortCode },
      });
      if (!link) throw new NotFoundException('Short link not found');

      targetUrl = link.targetUrl;

      // Re-populate cache
      await this.redis.set(
        `shortlink:${shortCode}`,
        targetUrl,
        'EX',
        86400,
      );
    }

    // 3. Fire-and-forget: push click event to BullMQ queue
    await this.clicksQueue.add('track-click', {
      shortCode,
      referrer: referrer ?? null,
      userAgent: userAgent ?? null,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Redirect: /go/${shortCode} → ${targetUrl}`);
    return targetUrl;
  }
}
