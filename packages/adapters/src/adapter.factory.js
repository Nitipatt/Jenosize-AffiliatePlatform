"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterFactory = void 0;
const shopee_adapter_1 = require("./shopee.adapter");
const lazada_adapter_1 = require("./lazada.adapter");
/**
 * Factory that resolves the correct marketplace adapter from a product URL.
 * Follows the Factory Pattern for clean adapter selection.
 *
 * To add a new marketplace (e.g., TikTok Shop):
 * 1. Create TiktokAdapter implementing MarketplaceAdapter
 * 2. Register it in the adapters array below
 * That's it — no other code changes needed.
 */
class AdapterFactory {
    adapters;
    constructor(adapters) {
        this.adapters = adapters ?? [new shopee_adapter_1.ShopeeAdapter(), new lazada_adapter_1.LazadaAdapter()];
    }
    /**
     * Returns the appropriate adapter for the given URL.
     * @throws Error if no adapter can handle the URL.
     */
    getAdapter(url) {
        const adapter = this.adapters.find((a) => a.canHandle(url));
        if (!adapter) {
            throw new Error(`No marketplace adapter found for URL: ${url}. Supported: Shopee, Lazada.`);
        }
        return adapter;
    }
    /**
     * Returns all registered adapters.
     */
    getAll() {
        return [...this.adapters];
    }
}
exports.AdapterFactory = AdapterFactory;
//# sourceMappingURL=adapter.factory.js.map