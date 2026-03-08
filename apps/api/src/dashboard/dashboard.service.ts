import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const totalClicks = await this.prisma.click.count();

    // Clicks per campaign
    const topCampaigns = await this.prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        utmCampaign: true,
        startAt: true,
        endAt: true,
        links: {
          select: {
            _count: { select: { clicks: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const campaignsWithClicks = topCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      utm_campaign: c.utmCampaign,
      start_at: c.startAt,
      end_at: c.endAt,
      clicks: c.links.reduce((sum, l) => sum + l._count.clicks, 0),
    }));

    // Top products by clicks
    const topProducts = await this.prisma.product.findMany({
      select: {
        id: true,
        title: true,
        imageUrl: true,
        links: {
          select: {
            _count: { select: { clicks: true } },
          },
        },
        offers: {
          select: {
            marketplace: true,
            price: true,
            storeName: true,
          },
          orderBy: { price: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsWithClicks = topProducts.map((p) => ({
      id: p.id,
      title: p.title,
      image_url: p.imageUrl,
      clicks: p.links.reduce((sum, l) => sum + l._count.clicks, 0),
      offers: p.offers,
    }));


    // Clicks over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clicksOverTime = await this.prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT DATE(timestamp) as date, COUNT(*)::int as count
      FROM clicks
      WHERE timestamp >= ${thirtyDaysAgo}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    return {
      total_clicks: totalClicks,
      top_campaigns: campaignsWithClicks
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
      top_products: productsWithClicks
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
      clicks_over_time: clicksOverTime,
    };
  }
}
