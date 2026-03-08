import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedirectController } from './redirect.controller';
import { RedirectService } from './redirect.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'clicks' }),
  ],
  controllers: [RedirectController],
  providers: [RedirectService],
})
export class RedirectModule {}
