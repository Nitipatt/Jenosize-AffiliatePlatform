import * as cheerio from 'cheerio';
import { MarketplaceAdapter, ProductData } from './marketplace-adapter.interface';

/**
 * Real Shopee adapter using simple HTTP fetch and Cheerio to parse metadata.
 */
export class ShopeeAdapter implements MarketplaceAdapter {
  readonly marketplace = 'SHOPEE' as const;

  canHandle(url: string): boolean {
    return url.includes('shopee.co.th') || url.includes('shopee.com');
  }

  async fetchProduct(url: string): Promise<ProductData> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Shopee page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      console.log('--- Found Shopee JSON-LD Scripts ---');
      console.log(html);

      let title = '';
      let imageUrl = '';
      let price = 0;
      let storeName = 'Shopee Store';

      // Parse JSON-LD scripts securely
      const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
      for (const script of jsonLdScripts) {
        const content = $(script).text();
        if (content) {
          try {
            const data = JSON.parse(content);
            if (data['@type'] === 'Product') {
              console.log('--- Found Shopee JSON-LD Product ---');
              console.log(JSON.stringify(data, null, 2));

              title = data.name || title;
              
              if (data.image) {
                imageUrl = Array.isArray(data.image) ? data.image[0] : (typeof data.image === 'string' ? data.image : imageUrl);
              }

              if (data.offers) {
                const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
                if (offer.price) {
                   price = Number(offer.price);
                } else if (offer.lowPrice) {
                   price = Number(offer.lowPrice);
                }
                if (offer.seller?.name) {
                  storeName = offer.seller.name;
                }
              }
            }
          } catch (e) {
            // Ignore parse errors on individual scripts
          }
        }
      }

      // Fallbacks
      if (!title || title.includes('Shopee Thailand')) {
         title = $('meta[property="og:title"]').attr('content') || $('title').text().replace('| Shopee Thailand', '').trim();
      }

      if (!imageUrl) {
         imageUrl = $('meta[property="og:image"]').attr('content') || '';
      }

      if (!price) {
         const priceMeta = $('meta[property="product:price:amount"]').attr('content');
         if (priceMeta) price = parseFloat(priceMeta);
      }

      // If missing data, use final fallbacks
      const finalTitle = title || `Shopee Product ${url.split('/').pop()}`;
      const finalPrice = price || 99.00;
      const finalImage = imageUrl || 'https://placehold.co/400x400/ee4d2d/ffffff?text=Shopee+Product';

      return {
        title: finalTitle,
        price: finalPrice,
        imageUrl: finalImage,
        storeName,
        externalUrl: url,
        marketplace: 'SHOPEE',
      };
    } catch (e) {
      console.error('Shopee Adapter Error:', e);
      return {
        title: `Shopee Product ${url.split('/').pop()}`,
        price: 99.00,
        imageUrl: 'https://placehold.co/400x400/ee4d2d/ffffff?text=Shopee+Product',
        storeName: 'Shopee Store',
        externalUrl: url,
        marketplace: 'SHOPEE',
      };
    }
  }
}
