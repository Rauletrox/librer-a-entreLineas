export async function getResource(path, signal, { timeoutMs = 10000 } = {}) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), timeoutMs);
  try {
    const response = await fetch(`/api/${path}`, {
      signal: signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal,
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('No encontramos la categoría o el libro solicitado. Puedes explorar el catálogo para elegir otra lectura.');
      if (response.status >= 500) throw new Error('El servidor tiene un problema temporal. Intenta nuevamente en unos momentos o explora otra sección.');
      throw new Error('No pudimos completar la consulta. Intenta nuevamente.');
    }
    const data = await response.json();
    const validBook = book => book && typeof book.id === 'string' && typeof book.title === 'string' && typeof book.author === 'string' && typeof book.price === 'number' && typeof book.categoryId === 'string';
    const valid = path === 'categories'
      ? Array.isArray(data) && data.every(item => item && typeof item.id === 'string' && typeof item.name === 'string')
      : path.startsWith('books/') ? validBook(data) : Array.isArray(data) && data.every(validBook);
    if (!valid) throw new Error('El servidor entregó información incompleta. Intenta cargarla nuevamente.');
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.signal.aborted) throw new Error('La consulta está tardando demasiado. Comprueba tu conexión y vuelve a intentar.');
    if (error instanceof TypeError) throw new Error('No pudimos conectarnos. Comprueba tu conexión a internet y vuelve a intentar.');
    if (error instanceof SyntaxError) throw new Error('El servidor entregó una respuesta que no podemos leer. Vuelve a intentar.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
