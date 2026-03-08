import { ShopeeAdapter } from './shopee.adapter';
import { LazadaAdapter } from './lazada.adapter';
import { AdapterFactory } from './adapter.factory';

describe('ShopeeAdapter', () => {
  const adapter = new ShopeeAdapter();

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`<html><head><meta property="og:title" content="Mocked Cheerio Shopee Product" /><meta property="og:image" content="https://mock.image/shopee.png" /><meta property="product:price:amount" content="150.00" /></head></html>`),
      } as Response)
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should handle Shopee URLs', () => {
    expect(adapter.canHandle('https://shopee.co.th/product/123/456')).toBe(true);
    expect(adapter.canHandle('https://shopee.com/product/123/456')).toBe(true);
    expect(adapter.canHandle('https://lazada.co.th/products/test')).toBe(false);
  });

  it('should return product data with correct marketplace', async () => {
    const product = await adapter.fetchProduct('https://shopee.co.th/product/100/200');
    expect(product).toMatchObject({
      marketplace: 'SHOPEE',
      externalUrl: 'https://shopee.co.th/product/100/200',
      title: 'Mocked Cheerio Shopee Product',
      price: 150.0,
      imageUrl: 'https://mock.image/shopee.png',
      storeName: 'Shopee Store'
    });
  });
});

describe('LazadaAdapter', () => {
  const adapter = new LazadaAdapter();

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`<html><head><script type="application/ld+json">{"@type": "Product", "name": "Mocked Product", "image": "https://mock.image/lazada.png", "offers": {"price": "120.00"}}</script><meta property="og:title" content="Mocked Product" /><meta property="og:image" content="https://mock.image/lazada.png" /></head></html>`),
      } as Response)
    );
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should handle Lazada URLs', () => {
    expect(adapter.canHandle('https://www.lazada.co.th/products/test-i123456.html')).toBe(true);
    expect(adapter.canHandle('https://lazada.com/products/test-i789.html')).toBe(true);
    expect(adapter.canHandle('https://shopee.co.th/product/123/456')).toBe(false);
  });

  it('should return product data with correct marketplace', async () => {
    const product = await adapter.fetchProduct(
      'https://www.lazada.co.th/products/test-i123456.html',
    );
    expect(product).toMatchObject({
      marketplace: 'LAZADA',
      externalUrl: 'https://www.lazada.co.th/products/test-i123456.html',
      title: 'Mocked Product',
      price: 120.0,
      imageUrl: 'https://mock.image/lazada.png',
      storeName: 'Lazada Store'
    });
  });
});

describe('AdapterFactory', () => {
  const factory = new AdapterFactory();

  it('should return ShopeeAdapter for Shopee URLs', () => {
    const adapter = factory.getAdapter('https://shopee.co.th/product/100/200');
    expect(adapter.marketplace).toBe('SHOPEE');
  });

  it('should return LazadaAdapter for Lazada URLs', () => {
    const adapter = factory.getAdapter('https://www.lazada.co.th/products/test-i999.html');
    expect(adapter.marketplace).toBe('LAZADA');
  });

  it('should throw for unsupported URLs', () => {
    expect(() => factory.getAdapter('https://amazon.com/dp/B123')).toThrow(
      'No marketplace adapter found',
    );
  });

  it('should list all adapters', () => {
    const all = factory.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((a) => a.marketplace)).toEqual(
      expect.arrayContaining(['SHOPEE', 'LAZADA']),
    );
  });
});
