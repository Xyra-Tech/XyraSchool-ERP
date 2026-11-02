// ==============================================================================
// XyraTech Control Center — Platform API Test Suite
// ==============================================================================

import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

// Ensure fallback environment variables for test execution
process.env.PLATFORM_DATABASE_URL =
  process.env.PLATFORM_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/xyratech_platform?schema=public';
process.env.DEFAULT_SCHOOL_DATABASE_URL =
  process.env.DEFAULT_SCHOOL_DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/xyratech_school_dev?schema=public';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { billingService } from '../src/services/billing.service';
import crypto from 'node:crypto';

describe('Platform API Tests', () => {
  describe('System Health & Documentation', () => {
    it('GET /api/v1/platform/docs returns OpenAPI spec', async () => {
      const res = await request(app).get('/api/v1/platform/docs');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toContain('Control Center');
    });
  });

  describe('Security & Authentication Protection', () => {
    it('rejects protected routes without Authorization header', async () => {
      const res = await request(app).get('/api/v1/platform/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects protected routes with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/platform/dashboard')
        .set('Authorization', 'Bearer invalid-token-12345');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('validates login input schema and rejects malformed email', async () => {
      const res = await request(app)
        .post('/api/v1/platform/auth/login')
        .send({ email: 'not-an-email', password: '' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('validates onboarding application schema and rejects empty payload', async () => {
      const res = await request(app)
        .post('/api/v1/platform/onboarding/apply')
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Billing & Razorpay Webhook Verification', () => {
    it('verifies valid HMAC SHA256 webhook signatures', () => {
      const secret = 'webhook_secret_test_xyz';
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = billingService.verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered webhook payloads', () => {
      const secret = 'webhook_secret_test_xyz';
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
      const tamperedPayload = JSON.stringify({ event: 'payment.captured', id: 'pay_999' });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const isValid = billingService.verifyWebhookSignature(tamperedPayload, signature, secret);
      expect(isValid).toBe(false);
    });

    it('generates standard invoice number format INV-YYYYMM-XXXX', () => {
      const invNum = billingService.generateInvoiceNumber();
      expect(invNum).toMatch(/^INV-\d{6}-\d{4}$/);
    });
  });
});
