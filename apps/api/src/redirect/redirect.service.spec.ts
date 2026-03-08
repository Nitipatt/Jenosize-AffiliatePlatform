import { Test, TestingModule } from '@nestjs/testing';
import { RedirectService } from './redirect.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('RedirectService', () => {
  let service: RedirectService;

  const mockPrisma = {
    link: {
      findUnique: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedirectService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: getQueueToken('clicks'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<RedirectService>(RedirectService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should resolve from Redis cache (fast path)', async () => {
    mockRedis.get.mockResolvedValue('https://shopee.co.th/product?utm=test');

    const url = await service.resolve('abc123', 'https://google.com', 'Mozilla');

    expect(url).toBe('https://shopee.co.th/product?utm=test');
    expect(mockRedis.get).toHaveBeenCalledWith('shortlink:abc123');
    expect(mockPrisma.link.findUnique).not.toHaveBeenCalled();
    expect(mockQueue.add).toHaveBeenCalledWith(
      'track-click',
      expect.objectContaining({ shortCode: 'abc123' }),
    );
  });

  it('should fall back to DB on cache miss and repopulate cache', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.link.findUnique.mockResolvedValue({
      shortCode: 'abc123',
      targetUrl: 'https://lazada.co.th/product?utm=test',
    });

    const url = await service.resolve('abc123');

    expect(url).toBe('https://lazada.co.th/product?utm=test');
    expect(mockRedis.set).toHaveBeenCalledWith(
      'shortlink:abc123',
      'https://lazada.co.th/product?utm=test',
      'EX',
      86400,
    );
  });

  it('should throw NotFoundException for unknown short code', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.link.findUnique.mockResolvedValue(null);

    await expect(service.resolve('unknown')).rejects.toThrow('Short link not found');
  });
});
