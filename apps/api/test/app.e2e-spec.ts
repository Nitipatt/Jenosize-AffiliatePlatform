import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('Affiliate Platform (e2e)', () => {
  let app: INestApplication;
  let cookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('POST /api/auth/register → 201', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'e2e_admin', password: 'test123456' })
        .expect(201)
        .expect((res) => {
          expect(res.body.username).toBe('e2e_admin');
        });
    });

    it('POST /api/auth/login → 200 with cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'e2e_admin', password: 'test123456' })
        .expect(200);

      expect(res.body.message).toBe('Login successful');
      cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });

  describe('Product & Link Flow', () => {
    let productId: string;
    let campaignId: string;
    let shortCode: string;

    it('POST /api/products → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .send({ source_url: 'https://shopee.co.th/product/100/200' })
        .expect(201);

      productId = res.body.id;
      expect(productId).toBeDefined();
      expect(res.body.title).toContain('Shopee');
    });

    it('GET /api/products/:id/offers → 200', () => {
      return request(app.getHttpServer())
        .get(`/api/products/${productId}/offers`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].marketplace).toBe('SHOPEE');
        });
    });

    it('POST /api/campaigns → 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/campaigns')
        .set('Cookie', cookies)
        .send({
          name: 'E2E Test Campaign',
          utm_campaign: 'e2e-test',
          start_at: '2025-01-01T00:00:00.000Z',
          end_at: '2025-12-31T23:59:59.000Z',
        })
        .expect(201);

      campaignId = res.body.id;
      expect(campaignId).toBeDefined();
    });

    it('POST /api/links → 201 with auth cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/links')
        .set('Cookie', cookies)
        .send({ product_id: productId, campaign_id: campaignId })
        .expect(201);

      shortCode = res.body.shortCode;
      expect(shortCode).toBeDefined();
      expect(res.body.targetUrl).toContain('utm_campaign=e2e-test');
    });

    it('GET /go/:short_code → 302 redirect', () => {
      return request(app.getHttpServer())
        .get(`/go/${shortCode}`)
        .expect(302)
        .expect((res) => {
          expect(res.headers.location).toContain('shopee.co.th');
        });
    });
  });

  describe('Dashboard', () => {
    it('GET /api/dashboard → 200 with auth', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          expect(res.body.total_clicks).toBeDefined();
          expect(res.body.top_campaigns).toBeInstanceOf(Array);
          expect(res.body.top_products).toBeInstanceOf(Array);
        });
    });

    it('GET /api/dashboard → 401 without auth', () => {
      return request(app.getHttpServer())
        .get('/api/dashboard')
        .expect(401);
    });
  });
});
