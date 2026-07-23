import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser = require('cookie-parser');
import { Response } from 'express';
import request = require('supertest');
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', roles: ['ADMIN'], permissions: [] },
      }),
      setRefreshCookie: jest.fn((response: Response) =>
        response.cookie('refresh_token', 'refresh-token'),
      ),
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'rotated-access-token',
        refreshToken: 'rotated-refresh-token',
        user: { id: 'user-1', roles: ['ADMIN'], permissions: [] },
      }),
      logout: jest.fn().mockResolvedValue({ ok: true }),
      requestPasswordReset: jest.fn().mockResolvedValue({ ok: true }),
      confirmPasswordReset: jest.fn().mockResolvedValue({ ok: true }),
      changePassword: jest.fn().mockResolvedValue({ ok: true }),
    };
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => app.close());

  it('sets a refresh cookie without returning it in the login body', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.test', password: 'Password123!' })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({ accessToken: 'access-token', user: expect.any(Object) }),
    );
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain('refresh_token=refresh-token');
  });
});
