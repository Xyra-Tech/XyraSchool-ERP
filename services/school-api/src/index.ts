import { app } from './app';
import { config } from '@xyratech/config';

const port = config.schoolPort;

const server = app.listen(port, () => {
  console.log(`🏫 XyraTech School ERP Core API listening on port ${port} [${config.env}]`);
  console.log(`📖 OpenAPI documentation available at http://localhost:${port}/api/v1/school/docs`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
