import { MarketplaceAdapter } from './marketplace-adapter.interface';
/**
 * Factory that resolves the correct marketplace adapter from a product URL.
 * Follows the Factory Pattern for clean adapter selection.
 *
 * To add a new marketplace (e.g., TikTok Shop):
 * 1. Create TiktokAdapter implementing MarketplaceAdapter
 * 2. Register it in the adapters array below
 * That's it — no other code changes needed.
 */
export declare class AdapterFactory {
    private readonly adapters;
    constructor(adapters?: MarketplaceAdapter[]);
    /**
     * Returns the appropriate adapter for the given URL.
     * @throws Error if no adapter can handle the URL.
     */
    getAdapter(url: string): MarketplaceAdapter;
    /**
     * Returns all registered adapters.
     */
    getAll(): MarketplaceAdapter[];
}
