export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Primetrade Assignment API',
    version: '1.0.0',
    description: 'Versioned REST API for authentication and task management.'
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'pt_access'
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                },
                required: ['name', 'email', 'password']
              }
            }
          }
        },
        responses: {
          201: { description: 'User created' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in and receive an HttpOnly cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Logged in' }
        }
      }
    },
    '/auth/me': {
      get: {
        security: [{ cookieAuth: [] }],
        summary: 'Read the current session',
        responses: {
          200: { description: 'Current user' }
        }
      }
    },
    '/tasks': {
      get: {
        security: [{ cookieAuth: [] }],
        summary: 'List tasks',
        responses: {
          200: { description: 'Task list' }
        }
      },
      post: {
        security: [{ cookieAuth: [] }],
        summary: 'Create task',
        responses: {
          201: { description: 'Task created' }
        }
      }
    },
    '/tasks/{id}': {
      get: {
        security: [{ cookieAuth: [] }],
        summary: 'Get a task by id',
        responses: {
          200: { description: 'Task found' }
        }
      },
      patch: {
        security: [{ cookieAuth: [] }],
        summary: 'Update a task',
        responses: {
          200: { description: 'Task updated' }
        }
      },
      delete: {
        security: [{ cookieAuth: [] }],
        summary: 'Delete a task',
        responses: {
          204: { description: 'Task deleted' }
        }
      }
    }
  }
} as const;