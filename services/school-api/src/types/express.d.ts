import { AuthenticatedUserContext } from '@xyratech/shared-types';
import { SchoolPrismaClient } from '@xyratech/database';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
      schoolDb: SchoolPrismaClient;
      schoolTenant?: {
        id: string;
        code: string;
      };
    }
  }
}

export {};
