// ==============================================================================
// XyraTech Control Center — Billing & Razorpay Integration Service
// ==============================================================================

import crypto from 'node:crypto';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';

export class BillingService {
  private static instance: BillingService;

  private constructor() {}

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  /**
   * Generates a unique invoice number: INV-YYYYMM-XXXX
   */
  public generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-${dateStr}-${rand}`;
  }

  /**
   * Verifies Razorpay Webhook Signature using HMAC SHA256
   */
  public verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!payload || !signature || !secret) return false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Processes a verified Razorpay payment capture event
   */
  public async processPaymentSuccess(params: {
    externalPaymentId: string;
    externalOrderId?: string;
    invoiceId: string;
    amountInCents: number;
    rawPayload?: any;
    idempotencyKey?: string;
  }): Promise<{ transactionId: string; invoiceStatus: string }> {
    const platformDb = getPlatformPrisma();

    // 1. Idempotency Check: Prevent duplicate payment processing
    if (params.idempotencyKey) {
      const existingTx = await platformDb.paymentTransaction.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingTx) {
        return { transactionId: existingTx.id, invoiceStatus: 'PAID' };
      }
    }

    if (params.externalPaymentId) {
      const existingPay = await platformDb.paymentTransaction.findUnique({
        where: { externalPaymentId: params.externalPaymentId },
      });
      if (existingPay) {
        return { transactionId: existingPay.id, invoiceStatus: 'PAID' };
      }
    }

    // 2. Fetch Invoice
    const invoice = await platformDb.subscriptionInvoice.findUnique({
      where: { id: params.invoiceId },
      include: { subscription: true },
    });

    if (!invoice) {
      throw new Error(`Invoice ${params.invoiceId} not found`);
    }

    // 3. Record Payment Transaction
    const tx = await platformDb.paymentTransaction.create({
      data: {
        invoiceId: invoice.id,
        externalPaymentId: params.externalPaymentId,
        externalOrderId: params.externalOrderId,
        method: 'RAZORPAY',
        status: 'CAPTURED',
        amountInCents: params.amountInCents,
        currency: invoice.currency,
        gatewayResponse: params.rawPayload,
        verifiedAt: new Date(),
        idempotencyKey: params.idempotencyKey || `rzp_${params.externalPaymentId}`,
      },
    });

    // 4. Update Invoice status to PAID
    await platformDb.subscriptionInvoice.update({
      where: { id: invoice.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // 5. Update Subscription status to ACTIVE if it was payment pending / past due
    if (invoice.subscription && (invoice.subscription.status === 'PAYMENT_PENDING' || invoice.subscription.status === 'OVERDUE')) {
      await platformDb.schoolSubscription.update({
        where: { id: invoice.subscription.id },
        data: { status: 'ACTIVE' },
      });
    }

    return { transactionId: tx.id, invoiceStatus: 'PAID' };
  }
}

export const billingService = BillingService.getInstance();
