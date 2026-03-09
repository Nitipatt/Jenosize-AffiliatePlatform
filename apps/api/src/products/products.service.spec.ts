import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrisma = {
    offer: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);

    // Mock the adapter factory
    (service as any).adapterFactory = {
      getAdapter: jest.fn().mockImplementation((url) => {
        if (url.includes('amazon')) {
          throw new Error('No marketplace adapter found');
        }
        return {
          fetchProduct: jest.fn().mockResolvedValue({
            title: url.includes('shopee') ? 'Shopee Product 456' : 'Mock Product',
            price: 299.0,
            imageUrl: 'mock-image.png',
            marketplace: url.includes('shopee') ? 'SHOPEE' : 'LAZADA',
            storeName: 'Mock Store',
            externalUrl: url,
          }),
        };
      }),
    };
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product from a Shopee URL', async () => {
    mockPrisma.offer.findFirst.mockResolvedValue(null);
    const mockProduct = {
      id: 'test-uuid',
      title: 'Shopee Product 456',
      imageUrl: 'https://placehold.co/400x400/ee4d2d/ffffff?text=Shopee+456',
      offers: [
        {
          marketplace: 'SHOPEE',
          storeName: 'Shopee Store 123',
          price: 299.0,
        },
      ],
    };
    mockPrisma.product.create.mockResolvedValue(mockProduct);
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

    const dto = {
      source_url: 'https://shopee.co.th/product/123/456',
    };
    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(result!.title).toContain('Shopee');
    expect(mockPrisma.product.create).toHaveBeenCalled();
  });

  it('should update existing offer if product URL already tracked', async () => {
    const existingProduct = { id: 'prod-uuid', title: 'Existing Product' };
    mockPrisma.offer.findFirst.mockResolvedValue({
      id: 'offer-uuid',
      product: existingProduct,
    });
    mockPrisma.offer.update.mockResolvedValue({});
    mockPrisma.product.findUnique.mockResolvedValue(existingProduct);

    const dto = {
      source_url: 'https://shopee.co.th/product/123/456',
    };
    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(result!.title).toBe('Existing Product');
    expect(mockPrisma.offer.update).toHaveBeenCalled();
    expect(mockPrisma.product.create).not.toHaveBeenCalled();
  });

  it('should throw for unsupported URL', async () => {
    await expect(
      service.create({ source_url: 'https://amazon.com/dp/B123' }),
    ).rejects.toThrow('Failed to fetch data from all provided URLs');
  });

  it('should find all products with offers', async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
  });
});
