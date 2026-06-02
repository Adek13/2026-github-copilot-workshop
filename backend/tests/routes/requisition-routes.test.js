import { jest, describe, test, expect, beforeEach } from '@jest/globals';

async function buildMockFastifyWithRoutes() {
  // create a fresh mock module for services
  jest.resetModules();
  await jest.unstable_mockModule('../../src/services/requisition-service.js', () => ({
    listRequisitions: jest.fn(),
    createRequisition: jest.fn(),
    submitRequisition: jest.fn(),
    approveRequisition: jest.fn(),
    getRequisitionById: jest.fn(),
    getRequisitionOpenLines: jest.fn(),
  }));

  const requisitionRoutes = (await import('../../src/routes/requisition-routes.js')).default;
  const service = await import('../../src/services/requisition-service.js');

  const routes = [];
  const fastify = {
    get: (path, handler) => routes.push({ method: 'GET', path, handler }),
    post: (path, handler) => routes.push({ method: 'POST', path, handler }),
    routes,
    db: {},
  };

  // register routes
  await requisitionRoutes(fastify);
  return { fastify, service };
}

function makeReqReply() {
  const routes = [];
  return {
    get: (path, handler) => routes.push({ method: 'GET', path, handler }),
    post: (path, handler) => routes.push({ method: 'POST', path, handler }),
    routes,
    db: {},
  };
}

function createReqReply() {
  const reply = { code: jest.fn().mockReturnThis(), sent: false };
  return { request: { params: {}, body: {} }, reply };
}

describe('requisition-routes', () => {
  test('GET /api/requisitions returns items from service', async () => {
    const { fastify, service } = await buildMockFastifyWithRoutes();
    const sample = [{ id: 'pr-1', prNumber: 'PR-1' }];
    service.listRequisitions.mockResolvedValue(sample);

    const entry = fastify.routes.find(r => r.method === 'GET' && r.path === '/api/requisitions');
    const { request, reply } = createReqReply();
    const result = await entry.handler(request, reply);

    expect(service.listRequisitions).toHaveBeenCalledWith(fastify.db);
    expect(result).toEqual({ items: sample });
  });

  test('GET /api/requisitions/:id/open-lines returns 404 when not found', async () => {
    const { fastify, service } = await buildMockFastifyWithRoutes();
    service.getRequisitionOpenLines.mockResolvedValue(null);

    const entry = fastify.routes.find(r => r.method === 'GET' && r.path === '/api/requisitions/:id/open-lines');
    const { request, reply } = createReqReply();
    request.params.id = 'missing';

    const result = await entry.handler(request, reply);

    expect(service.getRequisitionOpenLines).toHaveBeenCalledWith(fastify.db, 'missing');
    expect(reply.code).toHaveBeenCalledWith(404);
    expect(result).toEqual({ message: 'Requisition not found' });
  });
});
