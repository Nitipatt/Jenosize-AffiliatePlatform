import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClicksProcessor } from './clicks.processor';
import { PriceRefreshService } from './price-refresh.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'clicks' }),
  ],
  providers: [ClicksProcessor, PriceRefreshService],
})
export class WorkerModule {}
