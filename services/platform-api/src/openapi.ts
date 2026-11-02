export const platformOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'XyraTech School ERP — Platform Control Center API',
    version: '1.0.0',
    description: 'Platform Control Plane API for Super Admins, school provisioning, subscriptions, deployments, and audit logs.',
  },
  servers: [
    {
      url: '/api/v1/platform',
      description: 'Platform API v1',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/system/health': {
      get: {
        summary: 'Check Platform Health & Database Connectivity',
        responses: {
          200: { description: 'Platform is healthy' },
          503: { description: 'Platform service is degraded' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Platform Super Admin Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  mfaCode: { type: 'string', minLength: 6, maxLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully or MFA required' },
          401: { description: 'Invalid credentials or MFA code' },
          403: { description: 'Account locked' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Authenticated Platform User Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile, roles, and permissions' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/schools': {
      post: {
        summary: 'Onboard and Provision a New School Tenant',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'School provisioned and Principal invitation created' },
          409: { description: 'School code or email conflict' },
        },
      },
      get: {
        summary: 'List Registered Schools',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Paginated list of schools' },
        },
      },
    },
    '/schools/{id}': {
      get: {
        summary: 'Get School Details and Deployment Metadata',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'School details' },
          404: { description: 'School not found' },
        },
      },
    },
    '/audit-logs': {
      get: {
        summary: 'List Platform Audit Logs',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Paginated audit log entries' },
        },
      },
    },
  },
};
