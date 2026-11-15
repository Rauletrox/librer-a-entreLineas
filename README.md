# Protecto de la Experiencia 02 Semana 04 
## Tienda de Libros · Tienda de libros

Actividad formativa Exp02_S04: aplicación React que consume una API REST mock para explorar categorías y libros. Se desarrolla el alcance REST solicitado; GraphQL no forma parte de esta entrega.

## Para poder ejecutar

Requiere Node.js 20.19+ o 22.12+ y npm.

```bash
npm install
npm start
```

Debemos abrir la dirección que indica Vite (habitualmente http://127.0.0.1:5173). El mock se inicia automáticamente antes de renderizar React. No se necesita un backend separado ni una cuenta externa. Se requiere localhost o HTTPS para usar Service Workers.

```bash
npm test       # Pruebas de integración REST con MSW en Node
npm run build # Compilación de producción en dist/
npm run preview # Vista previa del build
```

## Rutas React Router

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio y categorías obtenidas desde la API |
| `/catalogo` | Todos los libros y búsqueda por título/autor |
| `/categorias/:genre` | Libros de una categoría |
| `/libros/:id` | Ficha del libro |
| Cualquier otra | Página no encontrada |

Para la navegación usa BrowserRouter, Routes, Route, Link, NavLink y useParams. El servidor que aloje dist debe redirigir las rutas de la aplicación a index.html. Vite ya hace esto en desarrollo y preview.

## API REST simulada

| Método y endpoint | Respuesta |
| --- | --- |
| `GET /api/categories` | Categorías en JSON |
| `GET /api/books` | Todos los libros |
| `GET /api/books?genre=ciencia-ficcion` | Libros de una categoría |
| `GET /api/books/:id` | Detalle de un libro |

- `src/mocks/data.js`: datos ficticios de categorías y libros.
- `src/mocks/handlers.js`: endpoints, retraso simulado y respuestas 404.
- `src/mocks/browser.js`: configuración del Service Worker de MSW.
- `src/services/api.js`: peticiones fetch y validación de respuestas HTTP.
- `src/hooks/useResource.js`: carga, error, reintento y cancelación de solicitudes al navegar.
- `src/App.jsx`: pantallas y navegación.
- `src/styles.css`: diseño adaptable a móvil y escritorio.

## Comprobación manual

1. Abre Inicio: comprueba el indicador de carga y las cinco categorías.
2. Selecciona Ciencia ficción: aparecen Dune y Fundación; la URL cambia sin recargar la página.
3. Abre un libro y vuelve a su categoría. Prueba también atrás/adelante del navegador y recargar una ruta directa.
4. En Drama se muestra el estado sin libros.
5. Visita `/categorias/inexistente`: la API responde 404 y la pantalla ofrece reintentar.
6. Visita `/libros/inexistente` y `/ruta-inexistente` para revisar errores de recurso y navegación.
7. Busca un título inexistente y limpia la búsqueda.
8. En Herramientas de desarrollo → Red, filtra `api` para observar GET, JSON y códigos HTTP. Las respuestas son interceptadas por el Service Worker.

MSW permanece habilitado también al compilar, para que la demostración funcione con `npm run preview`. Para conectar una API real, implementar los endpoints y definir `VITE_ENABLE_MOCKS=false` al iniciar o compilar. No hay compras ni pagos: los precios son ficticios y están expresados en pesos chilenos. Las ocho portadas se almacenan en `public/images/books/`, con nombres descriptivos en minúsculas y separados por guiones. La API entrega sus rutas en el campo `cover` de cada libro. Se conserva su proporción y se cargan de forma diferida en el catálogo. Las fuentes de Google son opcionales y tienen alternativas locales.

Referencias técnicas: [MSW](https://mswjs.io/api/setup-worker/start), [React Router](https://reactrouter.com/start/declarative/routing).

## Evidencias solicitadas para la pauta de evaluación

| Criterio | Implementación y comprobación |
| --- | --- |
| Integración REST | Endpoints MSW, fetch, categorías, filtros y detalle. `tests/api.test.js` comprueba datos, categorías vacías y recursos inexistentes. |
| Errores y recuperación | Mensajes específicos para 404, 500, conexión, JSON inválido, datos incompletos y espera de más de 10 segundos. Reintento, acceso al catálogo e inicio. `tests/errors.test.js` verifica las respuestas del cliente. |
| Carga y estados | Indicador inicial por recurso, aviso de actualización sin ocultar datos anteriores, estados vacíos, `role=status`, `role=alert` y `aria-busy`. Se cancela una petición cuando ya no tiene consumidores. |
| Eficiencia | Caché en memoria por URL durante 60 segundos, una petición compartida por recurso y reutilización al volver a una categoría. La búsqueda local no hace peticiones. `tests/resourceStore.test.js` comprueba caché, deduplicación, StrictMode, caducidad, recuperación y cancelación. |

### Verificar la caché en el navegador

1. Abre Red en las herramientas de desarrollo y filtra `api`.
2. Visita Ficción, luego Ciencia ficción y vuelve a Ficción antes de 60 segundos: no aparece otro GET para Ficción.
3. Después de 60 segundos, sal de Ficción y vuelve: se actualiza, manteniendo los libros anteriores mientras responde la consulta.
4. La caché se pierde al recargar la página; esto es intencional. Los errores no se consideran respuestas válidas de caché. El botón de reintento fuerza una nueva consulta.

### Prueba para simular fallos para la evaluación

En el navegador, establece temporalmente un breakpoint en `src/mocks/handlers.js` o modifica el handler que quieras probar (restaura el código al terminar):

```js
// Dentro de http.get de /api/books, antes de la respuesta normal:
return HttpResponse.json({ message: 'Error simulado' }, { status: 500 });
// Alternativa para simular un fallo de conexión:
return HttpResponse.error();
// Alternativa para probar el tiempo de espera:
await delay(12000);
```

Para verificar recuperación, restaura el handler normal y pulsa «Volver a intentar». Para probar conservación de datos, carga primero una categoría, cambia su handler para devolver 500, espera a que caduque la caché y vuelve a esa categoría desde otra sección: deben permanecer visibles los libros anteriores junto con el aviso de error.

La revisión visual en escritorio y móvil debe comprobarse manualmente si no hay acceso al navegador desde la sesión de desarrollo. Las pruebas automatizadas verifican integración y lógica de datos, pero no sustituyen esa revisión.

### Imágenes de libros

Los archivos de `public/images/books/` se sirven como `/images/books/nombre.png` y se copian automáticamente al compilar. No deben guardarse en la raíz ni en `dist/`, que es una carpeta generada. Para cambiar una portada, actualiza su archivo y los campos `cover`, `coverWidth` y `coverHeight` en `src/mocks/data.js`.
