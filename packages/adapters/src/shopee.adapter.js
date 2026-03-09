"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopeeAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
/**
 * Real Shopee adapter using simple HTTP fetch and Cheerio to parse metadata.
 */
class ShopeeAdapter {
    marketplace = 'SHOPEE';
    canHandle(url) {
        return url.includes('shopee.co.th') || url.includes('shopee.com');
    }
    async fetchProduct(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
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
                                }
                                else if (offer.lowPrice) {
                                    price = Number(offer.lowPrice);
                                }
                                if (offer.seller?.name) {
                                    storeName = offer.seller.name;
                                }
                            }
                        }
                    }
                    catch (e) {
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
                if (priceMeta)
                    price = parseFloat(priceMeta);
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
        }
        catch (e) {
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
exports.ShopeeAdapter = ShopeeAdapter;
//# sourceMappingURL=shopee.adapter.js.map