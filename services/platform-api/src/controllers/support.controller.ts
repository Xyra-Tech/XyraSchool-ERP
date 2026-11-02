// ==============================================================================
// XyraTech Control Center — Support Tickets & Controlled Access Controller
// ==============================================================================

import { Request, Response } from 'express';
import {
  CreateSupportTicketSchema,
  SupportReplySchema,
  SupportAssignSchema,
  SupportStatusSchema,
  SupportAccessRequestSchema,
} from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listTickets(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  const category = req.query.category as string;
  const search = req.query.search as string;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { ticketNumber: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { requesterEmail: { contains: search, mode: 'insensitive' } },
      { requesterName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [totalRecords, tickets] = await Promise.all([
    platformDb.supportTicket.count({ where }),
    platformDb.supportTicket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, code: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true, attachments: true } },
      },
    }),
  ]);

  sendSuccess(res, tickets, 'Support tickets retrieved', 200, {
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

export async function getTicketById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const ticket = await platformDb.supportTicket.findUnique({
    where: { id },
    include: {
      school: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' } },
      attachments: true,
      accessRequests: { orderBy: { createdAt: 'desc' }, include: { sessions: true } },
    },
  });

  if (!ticket) {
    sendError(res, 'Ticket not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, ticket, 'Ticket retrieved');
}

export async function createTicket(req: Request, res: Response): Promise<void> {
  const parseResult = CreateSupportTicketSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  // Ticket Number: TICK-YYYY-XXXX
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `TICK-${new Date().getFullYear()}-${rand}`;

  // Calculate SLA due dates based on priority
  const now = new Date();
  let slaHours = 24;
  if (data.priority === 'CRITICAL') slaHours = 1;
  else if (data.priority === 'HIGH') slaHours = 4;
  else if (data.priority === 'LOW') slaHours = 72;

  const slaResolutionDue = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
  const slaResponseDue = new Date(now.getTime() + Math.max(1, Math.round(slaHours / 4)) * 60 * 60 * 1000);

  const ticket = await platformDb.supportTicket.create({
    data: {
      ticketNumber,
      schoolId: data.schoolId,
      requesterName: data.requesterName,
      requesterEmail: data.requesterEmail,
      category: data.category,
      priority: data.priority,
      status: 'OPEN',
      subject: data.subject,
      description: data.description,
      slaResponseDue,
      slaResolutionDue,
    },
  });

  sendSuccess(res, ticket, 'Support ticket created', 201);
}

export async function replyToTicket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SupportReplySchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { content, isInternal } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const ticket = await platformDb.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    sendError(res, 'Ticket not found', 404, 'NOT_FOUND');
    return;
  }

  const message = await platformDb.supportMessage.create({
    data: {
      ticketId: id,
      senderType: 'AGENT',
      senderId: req.user?.id,
      senderName: `${req.user?.email || 'Platform Agent'}`,
      senderEmail: req.user?.email,
      content,
      isInternal: !!isInternal,
    },
  });

  // If public reply and first response, record respondedAt
  if (!isInternal && !ticket.respondedAt) {
    await platformDb.supportTicket.update({
      where: { id },
      data: { respondedAt: new Date(), status: 'IN_PROGRESS' },
    });
  }

  sendSuccess(res, message, 'Reply posted successfully');
}

export async function assignTicket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SupportAssignSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { assignedToId, assignedTeam } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const updated = await platformDb.supportTicket.update({
    where: { id },
    data: {
      assignedToId,
      assignedTeam,
      status: assignedToId ? 'ASSIGNED' : 'OPEN',
    },
  });

  sendSuccess(res, updated, 'Ticket assignment updated');
}

export async function updateTicketStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const parseResult = SupportStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const { status, resolutionNotes } = parseResult.data;
  const platformDb = getPlatformPrisma();

  const data: any = { status };
  if (status === 'RESOLVED') {
    data.resolvedAt = new Date();
  } else if (status === 'CLOSED') {
    data.closedAt = new Date();
  }

  const updated = await platformDb.supportTicket.update({
    where: { id },
    data,
  });

  if (resolutionNotes) {
    await platformDb.supportMessage.create({
      data: {
        ticketId: id,
        senderType: 'AGENT',
        senderId: req.user?.id,
        senderName: 'Platform Agent',
        content: `Status updated to ${status}. Notes: ${resolutionNotes}`,
        isInternal: true,
      },
    });
  }

  sendSuccess(res, updated, `Ticket status updated to ${status}`);
}

// ------------------------------------------------------------------------------
// Controlled Support Access to School Environments (Requirement Section 15)
// ------------------------------------------------------------------------------

export async function requestSupportAccess(req: Request, res: Response): Promise<void> {
  const parseResult = SupportAccessRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const accessRequest = await platformDb.supportAccessRequest.create({
    data: {
      schoolId: data.schoolId,
      ticketId: data.ticketId,
      requestedById: req.user!.id,
      purpose: data.purpose,
      scopeDescription: data.scopeDescription,
      accessLevel: data.accessLevel,
      status: 'REQUESTED',
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SUPPORT_ACCESS_REQUESTED',
    resourceType: 'SUPPORT_ACCESS_REQUEST',
    resourceId: accessRequest.id,
    outcome: 'SUCCESS',
    details: { schoolId: data.schoolId, purpose: data.purpose },
  });

  sendSuccess(res, accessRequest, 'Controlled support access request submitted for approval', 201);
}

export async function approveSupportAccess(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const durationMinutes = parseInt(req.body.durationMinutes as string) || 60;
  const platformDb = getPlatformPrisma();

  const request = await platformDb.supportAccessRequest.findUnique({ where: { id } });
  if (!request) {
    sendError(res, 'Support access request not found', 404, 'NOT_FOUND');
    return;
  }

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const updated = await platformDb.supportAccessRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: req.user?.id,
      approvedAt: new Date(),
      expiresAt,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'SUPPORT_ACCESS_APPROVED',
    resourceType: 'SUPPORT_ACCESS_REQUEST',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { schoolId: request.schoolId, expiresAt: expiresAt.toISOString() },
  });

  sendSuccess(res, updated, `Support access approved for ${durationMinutes} minutes`);
}
