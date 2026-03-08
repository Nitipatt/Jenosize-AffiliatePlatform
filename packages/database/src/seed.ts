import { PrismaClient, Marketplace } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create products
  const matchaPowder = await prisma.product.create({
    data: {
      title: 'Matcha Powder Premium Grade 100g',
      imageUrl: 'https://placehold.co/400x400/4ade80/ffffff?text=Matcha+Powder',
      offers: {
        create: [
          {
            marketplace: Marketplace.SHOPEE,
            storeName: 'Matcha House Official',
            price: 299.0,
            externalUrl: 'https://shopee.co.th/product/123/456',
          },
          {
            marketplace: Marketplace.LAZADA,
            storeName: 'Green Tea Paradise',
            price: 349.0,
            externalUrl: 'https://www.lazada.co.th/products/matcha-i123456.html',
          },
        ],
      },
    },
  });

  const wirelessEarbuds = await prisma.product.create({
    data: {
      title: 'Wireless Earbuds Pro ANC',
      imageUrl: 'https://placehold.co/400x400/3b82f6/ffffff?text=Earbuds+Pro',
      offers: {
        create: [
          {
            marketplace: Marketplace.SHOPEE,
            storeName: 'Audio Zone Official',
            price: 1290.0,
            externalUrl: 'https://shopee.co.th/product/789/012',
          },
          {
            marketplace: Marketplace.LAZADA,
            storeName: 'Sound Masters',
            price: 1190.0,
            externalUrl: 'https://www.lazada.co.th/products/earbuds-i789012.html',
          },
        ],
      },
    },
  });

  const skinCareSunscreen = await prisma.product.create({
    data: {
      title: 'UV Protection Sunscreen SPF50+ PA++++',
      imageUrl: 'https://placehold.co/400x400/f472b6/ffffff?text=Sunscreen+SPF50',
      offers: {
        create: [
          {
            marketplace: Marketplace.SHOPEE,
            storeName: 'Beauty Glow Store',
            price: 450.0,
            externalUrl: 'https://shopee.co.th/product/345/678',
          },
          {
            marketplace: Marketplace.LAZADA,
            storeName: 'Skin Lab Official',
            price: 420.0,
            externalUrl: 'https://www.lazada.co.th/products/sunscreen-i345678.html',
          },
        ],
      },
    },
  });

  // Create campaign
  const summerDeal = await prisma.campaign.create({
    data: {
      name: 'Summer Deal 2025',
      utmCampaign: 'summer-deal-2025',
      startAt: new Date('2025-06-01'),
      endAt: new Date('2025-08-31'),
    },
  });

  // Create links
  const products = [matchaPowder, wirelessEarbuds, skinCareSunscreen];
  for (const product of products) {
    const offers = await prisma.offer.findMany({
      where: { productId: product.id },
    });
    const bestOffer = offers.reduce((min, o) =>
      Number(o.price) < Number(min.price) ? o : min,
    );

    const shortCode = product.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6) + Math.random().toString(36).slice(2, 6);

    await prisma.link.create({
      data: {
        productId: product.id,
        campaignId: summerDeal.id,
        shortCode,
        targetUrl: `${bestOffer.externalUrl}?utm_campaign=${summerDeal.utmCampaign}&utm_source=affiliate`,
      },
    });
  }

  console.log('✅ Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
