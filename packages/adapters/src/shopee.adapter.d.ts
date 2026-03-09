import { MarketplaceAdapter, ProductData } from './marketplace-adapter.interface';
/**
 * Real Shopee adapter using simple HTTP fetch and Cheerio to parse metadata.
 */
export declare class ShopeeAdapter implements MarketplaceAdapter {
    readonly marketplace: "SHOPEE";
    canHandle(url: string): boolean;
    fetchProduct(url: string): Promise<ProductData>;
}
