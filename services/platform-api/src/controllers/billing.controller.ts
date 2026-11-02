// ==============================================================================
// XyraTech Control Center — Billing & Invoices Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreateInvoiceSchema, RecordManualPaymentSchema, RefundRequestSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';
import { billingService } from '../services/billing.service';

export async function listInvoices(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const status = req.query.status as string;

  const where: any = {};
  if (status) where.status = status;

  const [totalRecords, invoices] = await Promise.all([
    platformDb.subscriptionInvoice.count({ where }),
    platformDb.subscriptionInvoice.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            school: { select: { id: true, name: true, code: true, officialEmail: true } },
            plan: { select: { name: true, code: true } },
          },
        },
        payments: true,
      },
    }),
  ]);

  sendSuccess(res, invoices, 'Invoices retrieved', 200, {
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize),
      hasNextPage: page * pageSize < totalRecords,
      hasPreviousPage: page > 1,
    },
  });
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  const parseResult = CreateInvoiceSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const invoiceNumber = billingService.generateInvoiceNumber();
  const invoice = await platformDb.subscriptionInvoice.create({
    data: {
      invoiceNumber,
      subscriptionId: data.subscriptionId,
      status: 'ISSUED',
      subtotalInCents: data.subtotalInCents,
      discountInCents: data.discountInCents,
      taxInCents: data.taxInCents,
      totalInCents: data.totalInCents,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      dueDate: new Date(data.dueDate),
      issuedAt: new Date(),
      notes: data.notes,
      lineItems: data.lineItems as any,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SUBSCRIPTION_INVOICE_CREATED',
    resourceType: 'INVOICE',
    resourceId: invoice.id,
    outcome: 'SUCCESS',
    details: { invoiceNumber, totalInCents: invoice.totalInCents },
  });

  sendSuccess(res, invoice, 'Invoice created', 201);
}

export async function recordManualPayment(req: Request, res: Response): Promise<void> {
  const parseResult = RecordManualPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const invoice = await platformDb.subscriptionInvoice.findUnique({
    where: { id: data.invoiceId },
  });

  if (!invoice) {
    sendError(res, 'Invoice not found', 404, 'NOT_FOUND');
    return;
  }

  const tx = await platformDb.paymentTransaction.create({
    data: {
      invoiceId: invoice.id,
      method: data.method,
      status: 'CAPTURED',
      amountInCents: data.amountInCents,
      currency: invoice.currency,
      externalPaymentId: data.referenceNumber || `manual_${Date.now()}`,
      verifiedAt: new Date(),
      manualVerifiedById: req.user?.id,
      manualVerificationNotes: data.notes || 'Verified by authorized platform finance user',
    },
  });

  await platformDb.subscriptionInvoice.update({
    where: { id: invoice.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'MANUAL_PAYMENT_RECORDED',
    resourceType: 'PAYMENT_TRANSACTION',
    resourceId: tx.id,
    outcome: 'SUCCESS',
    details: { invoiceNumber: invoice.invoiceNumber, amountInCents: data.amountInCents },
  });

  sendSuccess(res, tx, 'Manual payment verified and recorded');
}

export async function handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_key';

  const rawBody = JSON.stringify(req.body);
  const isValid = billingService.verifyWebhookSignature(rawBody, signature, webhookSecret);

  if (!isValid && process.env.NODE_ENV === 'production') {
    sendError(res, 'Invalid webhook signature', 400, 'INVALID_SIGNATURE');
    return;
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured' && payload?.payment?.entity) {
    const payment = payload.payment.entity;
    const invoiceId = payment.notes?.invoiceId;

    if (invoiceId) {
      await billingService.processPaymentSuccess({
        externalPaymentId: payment.id,
        externalOrderId: payment.order_id,
        invoiceId,
        amountInCents: payment.amount,
        rawPayload: payment,
        idempotencyKey: `webhook_${payment.id}`,
      });
    }
  }

  sendSuccess(res, { received: true }, 'Webhook processed');
}

