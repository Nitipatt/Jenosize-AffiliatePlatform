import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AdapterFactory } from '@affiliate/adapters';

@Injectable()
export class PriceRefreshService {
  private readonly logger = new Logger(PriceRefreshService.name);
  private readonly adapterFactory = new AdapterFactory();

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshPrices() {
    this.logger.log('Starting price refresh job...');

    const offers = await this.prisma.offer.findMany({
      include: { product: true },
    });

    let updated = 0;
    for (const offer of offers) {
      try {
        const adapter = this.adapterFactory.getAdapter(offer.externalUrl);
        const data = await adapter.fetchProduct(offer.externalUrl);

        await this.prisma.offer.update({
          where: { id: offer.id },
          data: {
            price: data.price,
            lastCheckedAt: new Date(),
          },
        });
        updated++;
      } catch (error) {
        this.logger.warn(
          `Failed to refresh price for offer ${offer.id}: ${error}`,
        );
      }
    }

    this.logger.log(`Price refresh complete. Updated ${updated}/${offers.length} offers.`);
  }
}
