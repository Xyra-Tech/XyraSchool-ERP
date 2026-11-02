import express, { Express } from 'express';
import cors from 'cors';
import { securityHeaders } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { schoolRouter } from './routes';

export const app: Express = express();

app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount School API at /api/v1/school
app.use('/api/v1/school', schoolRouter);

// Global Error Handler
app.use(errorHandler);
