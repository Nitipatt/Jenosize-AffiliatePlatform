import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrisma = {
    offer: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
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
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product from a Shopee URL', async () => {
    mockPrisma.offer.findFirst.mockResolvedValue(null);
    mockPrisma.product.create.mockResolvedValue({
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
    });

    const dto = {
      source_url: 'https://shopee.co.th/product/123/456',
    };
    const result = await service.create(dto);

    expect(result).toBeDefined();
    expect(result!.title).toContain('Shopee');
    expect(mockPrisma.product.create).toHaveBeenCalled();
  });

  it('should update existing offer if product URL already tracked', async () => {
    mockPrisma.offer.findFirst.mockResolvedValue({
      id: 'offer-uuid',
      product: { id: 'prod-uuid', title: 'Existing Product' },
    });
    mockPrisma.offer.update.mockResolvedValue({});

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
    ).rejects.toThrow('No marketplace adapter found');
  });

  it('should find all products with offers', async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
    expect(mockPrisma.product.findMany).toHaveBeenCalled();
  });
});
