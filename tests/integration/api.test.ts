import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app as platformApp } from '../../services/platform-api/src/app';
import { app as schoolApp } from '../../services/school-api/src/app';

describe('API Foundation & Endpoints Integration Tests', () => {
  it('GET /api/v1/platform/docs should return valid OpenAPI 3.0 specification', async () => {
    const res = await request(platformApp).get('/api/v1/platform/docs');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('Platform Control Center');
  });

  it('GET /api/v1/school/docs should return valid OpenAPI 3.0 specification', async () => {
    const res = await request(schoolApp).get('/api/v1/school/docs');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('School Core');
  });

  it('POST /api/v1/platform/auth/login should reject empty payload with validation error (422)', async () => {
    const res = await request(platformApp)
      .post('/api/v1/platform/auth/login')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/school/auth/activate-invitation should reject invalid payload with validation error', async () => {
    const res = await request(schoolApp)
      .post('/api/v1/school/auth/activate-invitation')
      .send({
        token: 'test-token',
        password: 'weak', // Does not satisfy password complexity
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Protected platform routes should reject requests without Authorization Bearer token (401)', async () => {
    const res = await request(platformApp).get('/api/v1/platform/schools');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Protected school routes should reject requests without Authorization Bearer token (401)', async () => {
    const res = await request(schoolApp).get('/api/v1/school/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
