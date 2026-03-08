import { MarketplaceAdapter } from './marketplace-adapter.interface';
import { ShopeeAdapter } from './shopee.adapter';
import { LazadaAdapter } from './lazada.adapter';

/**
 * Factory that resolves the correct marketplace adapter from a product URL.
 * Follows the Factory Pattern for clean adapter selection.
 *
 * To add a new marketplace (e.g., TikTok Shop):
 * 1. Create TiktokAdapter implementing MarketplaceAdapter
 * 2. Register it in the adapters array below
 * That's it — no other code changes needed.
 */
export class AdapterFactory {
  private readonly adapters: MarketplaceAdapter[];

  constructor(adapters?: MarketplaceAdapter[]) {
    this.adapters = adapters ?? [new ShopeeAdapter(), new LazadaAdapter()];
  }

  /**
   * Returns the appropriate adapter for the given URL.
   * @throws Error if no adapter can handle the URL.
   */
  getAdapter(url: string): MarketplaceAdapter {
    const adapter = this.adapters.find((a) => a.canHandle(url));
    if (!adapter) {
      throw new Error(
        `No marketplace adapter found for URL: ${url}. Supported: Shopee, Lazada.`,
      );
    }
    return adapter;
  }

  /**
   * Returns all registered adapters.
   */
  getAll(): MarketplaceAdapter[] {
    return [...this.adapters];
  }
}
