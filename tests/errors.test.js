import { after, afterEach, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { getResource } from '../src/services/api.js';
const server = setupServer();
const nativeFetch = globalThis.fetch;
before(() => {
  server.listen({ onUnhandledRequest: 'error' });
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = (path, options) => interceptedFetch(new URL(path, 'http://localhost'), options);
});
afterEach(() => server.resetHandlers());
after(() => { server.close(); globalThis.fetch = nativeFetch; });
test('un 500 ofrece un mensaje comprensible sin detalles internos', async () => {
  server.use(http.get('http://localhost/api/books', () => HttpResponse.json({ message: 'SQL stack trace' }, { status: 500 })));
  await assert.rejects(getResource('books'), /servidor tiene un problema temporal/);
});
test('un fallo de red explica cómo recuperarse', async () => {
  server.use(http.get('http://localhost/api/books', () => HttpResponse.error()));
  await assert.rejects(getResource('books'), /Comprueba tu conexión/);
});
test('un 404 invita a explorar el catálogo', async () => {
  server.use(http.get('http://localhost/api/books', () => new HttpResponse(null, { status: 404 })));
  await assert.rejects(getResource('books'), /explorar el catálogo/);
});
test('controla JSON inválido y datos incompletos', async () => {
  server.use(http.get('http://localhost/api/books', () => new HttpResponse('no es JSON')));
  await assert.rejects(getResource('books'), /respuesta que no podemos leer/);
  server.use(http.get('http://localhost/api/books', () => HttpResponse.json({ invalid: true })));
  await assert.rejects(getResource('books'), /información incompleta/);
});

test('el tiempo de espera finaliza la consulta con una solución para el usuario', async () => {
  server.use(http.get('http://localhost/api/books', async () => { await delay(100); return HttpResponse.json([]); }));
  await assert.rejects(getResource('books', undefined, { timeoutMs: 20 }), /tardando demasiado/);
});
