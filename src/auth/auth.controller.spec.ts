import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/refresh-token (POST)', () => {
    it('should return 401 if refreshToken is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh-token')
        .expect(401);
    });

    it('should return 401 if refreshToken is invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalidtoken')
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user info with valid accessToken', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'accessToken=validtoken');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email');
    });
  });
});
