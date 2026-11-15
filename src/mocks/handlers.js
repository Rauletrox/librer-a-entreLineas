import { http, HttpResponse, delay } from 'msw';
import { books, categories } from './data.js';

const origin = globalThis.location?.origin || 'http://localhost';

// Peticiones REST interceptadas por MSW: el frontend siempre utiliza fetch.
export const handlers = [
  http.get(`${origin}/api/categories`, async () => {
    await delay(450);
    return HttpResponse.json(categories);
  }),
  http.get(`${origin}/api/books`, async ({ request }) => {
    await delay(650);
    const genre = new URL(request.url).searchParams.get('genre');
    if (genre && !categories.some(category => category.id === genre)) {
      return HttpResponse.json({ message: 'La categoría solicitada no existe.' }, { status: 404 });
    }
    return HttpResponse.json(genre ? books.filter(book => book.categoryId === genre) : books);
  }),
  http.get(`${origin}/api/books/:id`, async ({ params }) => {
    await delay(450);
    const book = books.find(item => item.id === params.id);
    return book ? HttpResponse.json(book) : HttpResponse.json({ message: 'No encontramos este libro.' }, { status: 404 });
  }),
];
