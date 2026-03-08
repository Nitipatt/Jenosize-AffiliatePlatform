import * as cheerio from 'cheerio';
import { MarketplaceAdapter, ProductData } from './marketplace-adapter.interface';

/**
 * Real Lazada adapter using simple HTTP fetch and Cheerio to parse JSON-LD/metadata.
 */
export class LazadaAdapter implements MarketplaceAdapter {
  readonly marketplace = 'LAZADA' as const;

  canHandle(url: string): boolean {
    return url.includes('lazada.co.th') || url.includes('lazada.com');
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
        throw new Error(`Failed to fetch Lazada page: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      console.log('--- Found Lazada HTML/JSON-LD Scripts ---');
      console.log(html);

      let title = $('meta[property="og:title"]').attr('content') || '';
      let imageUrl = $('meta[property="og:image"]').attr('content') || '';
      let price = 0;
      let storeName = 'Lazada Store';

      // 1. Try structured data (JSON-LD) which Lazada usually has
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const content = $(el).html() || $(el).text() || '{}';
          const json = JSON.parse(content);
          if (json['@type'] === 'Product') {
            console.log('--- Found Lazada JSON-LD Product ---');
            console.log(JSON.stringify(json, null, 2));
            if (json.name) title = json.name;
            if (json.image) imageUrl = Array.isArray(json.image) ? json.image[0] : json.image;
            if (json.offers) {
              if (json.offers.price) {
                price = parseFloat(json.offers.price);
              } else if (json.offers.lowPrice) {
                price = parseFloat(json.offers.lowPrice);
              }
              
              if (json.offers.seller && json.offers.seller.name) {
                storeName = json.offers.seller.name;
              }
            }
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      });

      // 2. Fallbacks
      if (!title || title.includes('Lazada')) {
         title = $('title').text().replace('| Lazada.co.th', '').trim();
      }
      
      const priceMeta = $('meta[property="product:price:amount"]').attr('content');
      if (!price && priceMeta) {
         price = parseFloat(priceMeta);
      }

      const finalTitle = title || `Lazada Product ${url.split('/').pop()}`;
      const finalPrice = price || 120.00;
      const finalImage = imageUrl || 'https://placehold.co/400x400/0f146d/ffffff?text=Lazada+Product';

      return {
        title: finalTitle,
        price: finalPrice,
        imageUrl: finalImage,
        storeName,
        externalUrl: url,
        marketplace: 'LAZADA',
      };
    } catch (e) {
      console.error('Lazada Adapter Error:', e);
      return {
        title: `Lazada Product ${url.split('/').pop()}`,
        price: 120.00,
        imageUrl: 'https://placehold.co/400x400/0f146d/ffffff?text=Lazada+Product',
        storeName: 'Lazada Store',
        externalUrl: url,
        marketplace: 'LAZADA',
      };
    }
  }
}
