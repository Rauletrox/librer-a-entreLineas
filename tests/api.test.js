import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { handlers } from '../src/mocks/handlers.js';
const server = setupServer(...handlers);
before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());
const get = path => fetch(`http://localhost/api/${path}`);
test('la API entrega categorías para la navegación', async () => {
  const response = await get('categories');
  assert.equal(response.status, 200);
  const categories = await response.json();
  assert.ok(categories.some(category => category.id === 'ciencia-ficcion'));
  assert.equal(new Set(categories.map(category => category.id)).size, categories.length);
});
test('filtra libros por categoría y permite consultar su detalle', async () => {
  const response = await get('books?genre=ciencia-ficcion');
  assert.equal(response.status, 200);
  const books = await response.json();
  assert.ok(books.length > 0);
  assert.ok(books.every(book => book.categoryId === 'ciencia-ficcion'));
  const detail = await get(`books/${books[0].id}`);
  assert.equal(detail.status, 200);
  assert.deepEqual(await detail.json(), books[0]);
});
test('Drama tiene una respuesta vacía válida', async () => {
  const response = await get('books?genre=drama');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
test('categorías y libros inexistentes responden 404 con mensaje', async () => {
  for (const path of ['books?genre=inexistente', 'books/inexistente']) {
    const response = await get(path);
    assert.equal(response.status, 404);
    assert.equal(typeof (await response.json()).message, 'string');
  }
});
test('el catálogo completo contiene los libros de las categorías', async () => {
  const response = await get('books');
  assert.equal(response.status, 200);
  const books = await response.json();
  assert.equal(books.length, 8);
  assert.ok(books.every(book => book.title && book.author && book.price > 0));
});
