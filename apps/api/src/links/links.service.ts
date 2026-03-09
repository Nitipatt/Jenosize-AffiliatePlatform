import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { customAlphabet } from 'nanoid';

const generateShortCode = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  8,
);

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateLinkDto) {
    // Verify product and campaign exist
    const product = await this.prisma.product.findUnique({
      where: { id: dto.product_id },
      include: { offers: { orderBy: { price: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Product not found');

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaign_id },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Use best-price offer as target
    const bestOffer = product.offers[0];
    if (!bestOffer) throw new NotFoundException('No offers found for product');

    const shortCode = generateShortCode();
    const targetUrlObj = new URL(bestOffer.externalUrl);
    targetUrlObj.searchParams.set('utm_campaign', campaign.utmCampaign);
    targetUrlObj.searchParams.set('utm_source', 'affiliate');
    targetUrlObj.searchParams.set('utm_medium', 'link');
    const targetUrl = targetUrlObj.toString();

    const link = await this.prisma.link.create({
      data: {
        productId: dto.product_id,
        campaignId: dto.campaign_id,
        shortCode,
        targetUrl,
      },
      include: { product: true, campaign: true },
    });

    // Pre-warm Redis cache
    await this.redis.set(
      `shortlink:${shortCode}`,
      targetUrl,
      'EX',
      86400, // 24h TTL
    );

    return link;
  }

  async findAll() {
    return this.prisma.link.findMany({
      include: {
        product: true,
        campaign: true,
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
