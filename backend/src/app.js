import Fastify from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db.js';
import requisitionRoutes from './routes/requisition-routes.js';
import purchaseOrderRoutes from './routes/purchase-order-routes.js';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
  });

  // OpenAPI / Swagger setup
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Procurement MVP API',
        description: 'API docs for the procurement workshop backend',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
  });

  app.register(dbPlugin);
  app.register(requisitionRoutes);
  app.register(purchaseOrderRoutes);

  // Serve Swagger UI at /api-docs
  app.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
    },
    // If `swagger` is not provided, the UI will fetch the generated spec automatically.
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    if (reply.sent) {
      return;
    }

    reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}
