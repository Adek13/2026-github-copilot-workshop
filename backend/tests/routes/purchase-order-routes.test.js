import { jest, describe, test, expect } from '@jest/globals';

async function buildMockFastifyWithRoutes() {
  jest.resetModules();
  await jest.unstable_mockModule('../../src/services/purchase-order-service.js', () => ({
    listPurchaseOrders: jest.fn(),
    createPurchaseOrder: jest.fn(),
    getPurchaseOrderById: jest.fn(),
    getOpenPoLines: jest.fn(),
    submitPurchaseOrder: jest.fn(),
  }));

  const purchaseOrderRoutes = (await import('../../src/routes/purchase-order-routes.js')).default;
  const service = await import('../../src/services/purchase-order-service.js');

  const routes = [];
  const fastify = {
    get: (path, handler) => routes.push({ method: 'GET', path, handler }),
    post: (path, handler) => routes.push({ method: 'POST', path, handler }),
    routes,
    db: {},
  };

  await purchaseOrderRoutes(fastify);
  return { fastify, service };
}

function makeReqReply() {
  const reply = { code: jest.fn().mockReturnThis(), sent: false };
  return { request: { params: {}, body: {} }, reply };
}

describe('purchase-order-routes', () => {
  test('GET /api/purchase-orders returns items', async () => {
    const { fastify, service } = await buildMockFastifyWithRoutes();
    const sample = [{ id: 'po-1', poNumber: 'PO-1' }];
    service.listPurchaseOrders.mockResolvedValue(sample);

    const entry = fastify.routes.find(r => r.method === 'GET' && r.path === '/api/purchase-orders');
    const { request, reply } = makeReqReply();
    const result = await entry.handler(request, reply);

    expect(service.listPurchaseOrders).toHaveBeenCalledWith(fastify.db);
    expect(result).toEqual({ items: sample });
  });

  test('GET /api/purchase-orders/:id/open-lines returns 404 when missing', async () => {
    const { fastify, service } = await buildMockFastifyWithRoutes();
    service.getOpenPoLines.mockResolvedValue(null);

    const entry = fastify.routes.find(r => r.method === 'GET' && r.path === '/api/purchase-orders/:id/open-lines');
    const { request, reply } = makeReqReply();
    request.params.id = 'missing';

    const result = await entry.handler(request, reply);

    expect(service.getOpenPoLines).toHaveBeenCalledWith(fastify.db, 'missing');
    expect(reply.code).toHaveBeenCalledWith(404);
    expect(result).toEqual({ message: 'Purchase order not found' });
  });
});
