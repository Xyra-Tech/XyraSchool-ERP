import express, { Express } from 'express';
import cors from 'cors';
import { securityHeaders } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { platformRouter } from './routes';

export const app: Express = express();

// Trust reverse proxy for correct IP evaluation in containerized environments
app.set('trust proxy', 1);

// Standard Middlewares
app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      // In dev allow localhost origins or reflect
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount platform routes at /api/v1/platform
app.use('/api/v1/platform', platformRouter);

// Global error handling
app.use(errorHandler);
