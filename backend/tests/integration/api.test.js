import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Estas pruebas no tocan la base de datos; solo verifican rutas y middlewares.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ??= 'secreto-de-prueba';
process.env.NODE_ENV = 'test';

const { app } = await import('../../src/app.js');

test('GET /api/v1/health responde ok', async () => {
  const res = await request(app).get('/api/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
});

test('las rutas protegidas exigen token', async () => {
  const res = await request(app).get('/api/v1/ventas');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('login valida el cuerpo de la petición', async () => {
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'no-es-correo' });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
});

test('ruta inexistente devuelve 404', async () => {
  const res = await request(app).get('/api/v1/no-existe');
  assert.equal(res.status, 404);
});
