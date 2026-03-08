import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdapterFactory } from '@affiliate/adapters';
import { Marketplace } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly adapterFactory: AdapterFactory;

  constructor(private readonly prisma: PrismaService) {
    this.adapterFactory = new AdapterFactory();
  }

  async create(dto: CreateProductDto) {
    const urlsToFetch: string[] = [];
    
    // Support new dual-URL structure
    if (dto.shopee_url) urlsToFetch.push(decodeURIComponent(dto.shopee_url));
    if (dto.lazada_url) urlsToFetch.push(decodeURIComponent(dto.lazada_url));
    
    // Fallback to legacy structure
    if (urlsToFetch.length === 0 && dto.source_url) {
      urlsToFetch.push(decodeURIComponent(dto.source_url));
    }

    if (urlsToFetch.length === 0) {
      throw new Error('At least one valid product URL must be provided');
    }

    // Fetch data concurrently from all provided URLs
    const fetchPromises = urlsToFetch.map(async (url) => {
      const adapter = this.adapterFactory.getAdapter(url);
      const productData = await adapter.fetchProduct(url);
      return productData;
    });

    const results = await Promise.allSettled(fetchPromises);
    const successfulFetches = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    if (successfulFetches.length === 0) {
      throw new Error('Failed to fetch data from all provided URLs');
    }

    // Extract the primary product details from the first successful fetch to act as the parent wrapper
    const primaryProduct = successfulFetches[0];

    this.logger.log(`Fetched ${successfulFetches.length} offers for: ${primaryProduct.title}`);
    
    // For simplicity, check if the first URL already exists in our system. If it does, we append offers. 
    // Ideally we should check if ANY of the offers exist, but let's check the primary.
    let targetProduct = null;
    for (const fetchedOffer of successfulFetches) {
      const existingOffer = await this.prisma.offer.findFirst({
        where: { externalUrl: fetchedOffer.externalUrl },
        include: { product: true },
      });
      if (existingOffer) {
        targetProduct = existingOffer.product;
        break; // Found an existing product linkage
      }
    }

    if (!targetProduct) {
      // Create a brand new unified product
      targetProduct = await this.prisma.product.create({
        data: {
          title: primaryProduct.title,
          imageUrl: primaryProduct.imageUrl,
        }
      });
    }

    // Upsert the offers into the target product
    for (const fetchedOffer of successfulFetches) {
      const existingOffer = await this.prisma.offer.findFirst({
        where: { externalUrl: fetchedOffer.externalUrl },
      });

      if (existingOffer) {
        await this.prisma.offer.update({
          where: { id: existingOffer.id },
          data: {
            price: fetchedOffer.price,
            lastCheckedAt: new Date(),
            productId: targetProduct.id // ensure it links correctly
          },
        });
      } else {
        await this.prisma.offer.create({
          data: {
            productId: targetProduct.id,
            marketplace: fetchedOffer.marketplace as Marketplace,
            storeName: fetchedOffer.storeName,
            price: fetchedOffer.price,
            externalUrl: fetchedOffer.externalUrl,
          }
        });
      }
    }

    return this.prisma.product.findUnique({
      where: { id: targetProduct.id },
      include: { offers: true }
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        offers: {
          orderBy: { price: 'asc' },
        },
        links: {
          include: { campaign: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOffers(productId: string) {
    return this.prisma.offer.findMany({
      where: { productId },
      orderBy: { price: 'asc' },
    });
  }

  async update(id: string, dto: { title?: string }) {
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
