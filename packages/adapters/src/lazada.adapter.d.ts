import { MarketplaceAdapter, ProductData } from './marketplace-adapter.interface';
/**
 * Real Lazada adapter using simple HTTP fetch and Cheerio to parse JSON-LD/metadata.
 */
export declare class LazadaAdapter implements MarketplaceAdapter {
    readonly marketplace: "LAZADA";
    canHandle(url: string): boolean;
    fetchProduct(url: string): Promise<ProductData>;
}
