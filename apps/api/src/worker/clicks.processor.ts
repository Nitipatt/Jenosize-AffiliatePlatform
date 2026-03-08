import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

interface ClickJobData {
  shortCode: string;
  referrer: string | null;
  userAgent: string | null;
  timestamp: string;
}

@Processor('clicks')
export class ClicksProcessor extends WorkerHost {
  private readonly logger = new Logger(ClicksProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ClickJobData>): Promise<void> {
    const { shortCode, referrer, userAgent, timestamp } = job.data;

    try {
      // Find the link by short code
      const link = await this.prisma.link.findUnique({
        where: { shortCode },
      });

      if (!link) {
        this.logger.warn(`Link not found for short_code: ${shortCode}`);
        return;
      }

      // Insert click record
      await this.prisma.click.create({
        data: {
          linkId: link.id,
          timestamp: new Date(timestamp),
          referrer,
          userAgent,
        },
      });

      this.logger.log(`Click recorded for /go/${shortCode}`);
    } catch (error) {
      this.logger.error(`Failed to process click for ${shortCode}`, error);
      throw error; // BullMQ will retry
    }
  }
}
