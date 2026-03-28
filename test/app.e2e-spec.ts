import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Drive Style API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1', {
      exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok when database is reachable', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('POST /api/v1/auth/register and POST /api/v1/listings (requires DB + seed)', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      email,
      password: 'password123',
      displayName: 'E2E User',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.accessToken).toBeDefined();
    expect(reg.body.refreshToken).toBeDefined();

    const token = reg.body.accessToken as string;
    const listing = await request(app.getHttpServer())
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        kind: 'USED',
        sellerType: 'PRIVATE',
        title: 'E2E test vehicle',
        priceAmount: '19999.00',
        status: 'PUBLISHED',
      });
    expect(listing.status).toBe(201);
    expect(listing.body.slug).toBeDefined();
  });
});
