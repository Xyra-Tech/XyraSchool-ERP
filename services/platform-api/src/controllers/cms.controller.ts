// ==============================================================================
// XyraTech Control Center — CMS & Content Management Controller
// ==============================================================================

import { Request, Response } from 'express';
import { CreateCMSPageSchema } from '@xyratech/validation';
import { getPlatformPrisma, recordPlatformAudit } from '@xyratech/database';
import { sendSuccess, sendError } from '../utils/response';

export async function listPages(req: Request, res: Response): Promise<void> {
  const platformDb = getPlatformPrisma();
  const pageType = req.query.pageType as string;
  const status = req.query.status as string;

  const where: any = {};
  if (pageType) where.pageType = pageType;
  if (status) where.status = status;

  const pages = await platformDb.cMSPage.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      blocks: { orderBy: { sortOrder: 'asc' } },
    },
  });

  sendSuccess(res, pages, 'CMS pages retrieved');
}

export async function getPageById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const page = await platformDb.cMSPage.findUnique({
    where: { id },
    include: {
      blocks: { orderBy: { sortOrder: 'asc' } },
      revisions: { orderBy: { version: 'desc' }, take: 10 },
    },
  });

  if (!page) {
    sendError(res, 'CMS page not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, page, 'Page details retrieved');
}

export async function createPage(req: Request, res: Response): Promise<void> {
  const parseResult = CreateCMSPageSchema.safeParse(req.body);
  if (!parseResult.success) {
    sendError(res, 'Validation error', 422, 'VALIDATION_ERROR', parseResult.error.format());
    return;
  }

  const data = parseResult.data;
  const platformDb = getPlatformPrisma();

  const existing = await platformDb.cMSPage.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    sendError(res, `CMS page with slug '${data.slug}' already exists`, 409, 'DUPLICATE_SLUG');
    return;
  }

  const page = await platformDb.cMSPage.create({
    data: {
      slug: data.slug,
      title: data.title,
      pageType: data.pageType,
      content: data.content as any,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      status: data.status,
      authorId: req.user?.id,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'CMS_PAGE_CREATED',
    resourceType: 'CMS_PAGE',
    resourceId: page.id,
    outcome: 'SUCCESS',
    details: { slug: page.slug, title: page.title },
  });

  sendSuccess(res, page, 'CMS page created', 201);
}

export async function updatePage(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const existing = await platformDb.cMSPage.findUnique({ where: { id } });
  if (!existing) {
    sendError(res, 'CMS page not found', 404, 'NOT_FOUND');
    return;
  }

  const { title, content, metaTitle, metaDescription, status } = req.body;

  // Create revision before updating
  const revisionCount = await platformDb.cMSRevision.count({ where: { pageId: id } });
  await platformDb.cMSRevision.create({
    data: {
      pageId: id,
      version: revisionCount + 1,
      title: existing.title,
      content: (existing.content as any) || {},
      changedById: req.user?.id,
      changeNote: 'Auto-saved revision prior to modification',
    },
  });

  const updated = await platformDb.cMSPage.update({
    where: { id },
    data: {
      title: title || existing.title,
      content: content ? (content as any) : existing.content,
      metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
      status: status || existing.status,
      publishedAt: status === 'PUBLISHED' && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });

  sendSuccess(res, updated, 'CMS page updated');
}

export async function publishPage(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const platformDb = getPlatformPrisma();

  const updated = await platformDb.cMSPage.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      approvedById: req.user?.id,
    },
  });

  await recordPlatformAudit({
    actorId: req.user?.id,
    actorEmail: req.user?.email,
    action: 'CMS_PAGE_PUBLISHED',
    resourceType: 'CMS_PAGE',
    resourceId: id,
    outcome: 'SUCCESS',
    details: { title: updated.title, slug: updated.slug },
  });

  sendSuccess(res, updated, 'Page published');
}
