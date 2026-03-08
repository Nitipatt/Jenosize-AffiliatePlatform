import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        name: dto.name,
        utmCampaign: dto.utm_campaign,
        startAt: new Date(dto.start_at),
        endAt: new Date(dto.end_at),
      },
    });
  }

  async findAll() {
    return this.prisma.campaign.findMany({
      include: {
        links: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        links: {
          include: {
            product: { include: { offers: true } },
          },
        },
      },
    });
  }
}
