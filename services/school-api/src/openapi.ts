export const schoolOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'XyraTech School ERP — School Core & Operations API',
    version: '1.0.0',
    description: 'School Business Plane API for Principals, Admins, Staff, Teachers, Parents, and Students.',
  },
  servers: [
    {
      url: '/api/v1/school',
      description: 'School API v1',
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
        summary: 'Check School API Health and Database Connectivity',
        responses: {
          200: { description: 'Healthy' },
        },
      },
    },
    '/auth/activate-invitation': {
      post: {
        summary: 'Activate School Account via Invitation Token (Principal / Staff)',
        description: 'Principal sets their own password using Argon2id. XyraTech never knows or sets Principal passwords.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password', 'confirmPassword', 'firstName', 'lastName'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 10 },
                  confirmPassword: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account activated and recovery codes returned' },
          400: { description: 'Invalid or expired invitation token' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'School User Login (Principal, Admins, Teachers, Staff)',
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
                  mfaCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated or MFA required' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated School User Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User context and permissions' },
        },
      },
    },
    '/profile': {
      get: {
        summary: 'Get School Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'School profile details' },
        },
      },
      patch: {
        summary: 'Update School Profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Updated profile' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List School Users & Staff',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Paginated user list' },
        },
      },
      post: {
        summary: 'Invite / Create New Staff Account',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Staff invitation generated' },
        },
      },
    },
    '/audit-logs': {
      get: {
        summary: 'Query School Audit Logs',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Paginated audit logs' },
        },
      },
    },
  },
};
