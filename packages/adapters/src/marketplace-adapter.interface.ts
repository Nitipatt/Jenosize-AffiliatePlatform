/**
 * Marketplace Adapter Interface
 *
 * Defines the contract for fetching product data from different marketplaces.
 * Implements the Adapter Pattern to allow easy addition of new marketplaces
 * (e.g., TikTok Shop) without modifying core business logic.
 */

export interface ProductData {
  title: string;
  imageUrl: string;
  storeName: string;
  price: number;
  externalUrl: string;
  marketplace: 'SHOPEE' | 'LAZADA';
}

export interface MarketplaceAdapter {
  /**
   * The marketplace identifier this adapter handles.
   */
  readonly marketplace: 'SHOPEE' | 'LAZADA';

  /**
   * Checks if this adapter can handle the given URL.
   */
  canHandle(url: string): boolean;

  /**
   * Fetches product data from the marketplace URL.
   * In production, this would call the marketplace API.
   * For this assignment, mock adapters return fixture data.
   */
  fetchProduct(url: string): Promise<ProductData>;
}
