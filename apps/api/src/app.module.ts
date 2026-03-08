import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ProductsModule } from './products/products.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { LinksModule } from './links/links.module';
import { RedirectModule } from './redirect/redirect.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkerModule } from './worker/worker.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    RedisModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),

    // Feature modules
    ProductsModule,
    CampaignsModule,
    LinksModule,
    RedirectModule,
    DashboardModule,
    WorkerModule,
    AuthModule,
  ],
})
export class AppModule {}
