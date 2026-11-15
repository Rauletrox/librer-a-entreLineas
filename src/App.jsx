import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useResource } from './hooks/useResource.js';

const price = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

function ResourceState({ resource, children }) {
  const hasData = resource.data !== null;
  if (resource.loading && !hasData) return <div className="state" role="status" aria-live="polite"><span className="spinner" />Buscando tu próxima lectura…</div>;
  return <div aria-busy={resource.loading}>
    {resource.loading && <p className="update-notice" role="status">Actualizando la información… Puedes seguir explorando.</p>}
    {resource.error && <div className="state error" role="alert"><h2>No pudimos completar la búsqueda</h2><p>{resource.error}</p>
      {hasData && <p>Conservamos la última información disponible para que puedas seguir explorando.</p>}
      <div className="recovery-actions"><button onClick={resource.retry}>Volver a intentar</button><Link className="text-link" to="/catalogo">Explorar el catálogo ↗</Link><Link className="text-link" to="/">Ir al inicio</Link></div>
    </div>}
    {hasData && children}
  </div>;
}
function Cover({ book, large = false }) {
  if (book.cover) return <img className={`book-cover ${large ? 'large' : ''}`} src={book.cover} alt={`Portada de ${book.title}`} width={book.coverWidth} height={book.coverHeight} loading={large ? 'eager' : 'lazy'} decoding="async" />;
  return <div className={`cover ${large ? 'large' : ''}`} style={{ '--cover': book.color }} aria-hidden="true"><span className="edition">BIBLIOTECA ENTRE LÍNEAS</span><strong>{book.title}</strong><span className="motif">{book.motif}</span><span className="cover-author">{book.author}</span></div>;
}
function BookCard({ book }) {
  return <Link className="book-card" to={`/libros/${book.id}`}><div className="cover-stage"><Cover book={book} /><span className="book-arrow">↗</span></div><p className="book-author">{book.author}</p><h3>{book.title}</h3><p className="price">{price(book.price)}</p></Link>;
}
function Home({ categories }) {
  return <><section className="hero"><div><p className="eyebrow">PARA QUIENES LEEN Y SUEÑAN</p><h1>Tu próxima historia<br />empieza <em>aquí.</em></h1><p className="hero-copy">Un lugar para descubrir nuevos mundos, reencontrarte con tus autores favoritos y dejarte llevar por una buena historia.</p><Link className="button" to="/catalogo">Explorar libros <span>↗</span></Link><p className="hero-note">Grandes historias. Infinitas posibilidades.</p></div><div className="hero-art" aria-hidden="true"><span className="orbit"/><span className="art-star">✧</span><img className="hero-book back" src="/images/books/la-casa-de-los-espiritus.png" alt="" width="636" height="962" decoding="async" /><img className="hero-book front" src="/images/books/cien-anos-de-soledad.png" alt="" width="724" height="1200" decoding="async" /><span className="art-caption">ENTRE PÁGINAS, OTROS MUNDOS.</span></div></section><section className="section"><div className="section-heading"><div><p className="eyebrow">SIGUE TU CURIOSIDAD</p><h2>¿Qué quieres leer hoy?</h2></div><Link className="text-link" to="/catalogo">Ver todo el catálogo ↗</Link></div><ResourceState resource={categories}><div className="categories">{categories.data?.map((category, index) => <Link className="category-card" key={category.id} to={`/categorias/${category.id}`} style={{ '--accent': category.color }}><div><span className="category-symbol">{category.symbol}</span><span className="category-number">0{index + 1}</span></div><h3>{category.name}</h3><p>{category.description}</p><span className="category-arrow">↗</span></Link>)}</div></ResourceState></section><section className="reading-note"><span>“</span><div><h2>Hay un libro para cada momento.</h2><p>Encuentra el tuyo, una página a la vez.</p></div><Link to="/catalogo" className="text-link">Descubre el catálogo ↗</Link></section></>;
}
function Catalog({ categories }) {
  const { genre } = useParams();
  const resource = useResource(genre ? `books?genre=${encodeURIComponent(genre)}` : 'books');
  const [search, setSearch] = useState('');
  const category = categories.data?.find(item => item.id === genre);
  const filtered = resource.data?.filter(book => `${book.title} ${book.author}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
  return <section className="section catalog"><p className="eyebrow">UN MUNDO EN CADA PÁGINA</p><h1>{category?.name || (genre ? 'Explorar categoría' : 'Nuestro catálogo')}</h1><p className="intro">{category?.description || 'Encuentra una historia que te acompañe.'}</p><ResourceState resource={categories}><nav className="filters" aria-label="Categorías de libros"><NavLink to="/catalogo">Todos los libros</NavLink>{categories.data?.map(item => <NavLink key={item.id} to={`/categorias/${item.id}`}>{item.name}</NavLink>)}</nav></ResourceState><label className="search">Buscar por título o autor<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="¿Qué historia estás buscando?" /></label><ResourceState resource={resource}>{filtered?.length ? <><p className="result-count">{filtered.length} {filtered.length === 1 ? 'libro disponible' : 'libros disponibles'}</p><div className="books">{filtered.map(book => <BookCard key={book.id} book={book} />)}</div></> : <div className="state"><h2>{search ? 'No encontramos coincidencias' : 'Nuevas historias en camino'}</h2><p>{search ? 'Prueba con otro título o autor.' : 'Todavía no hay libros disponibles en esta categoría. Explora las demás para encontrar tu próxima lectura.'}</p>{search ? <button onClick={() => setSearch('')}>Limpiar búsqueda</button> : <Link className="button" to="/catalogo">Ver todos los libros ↗</Link>}</div>}</ResourceState></section>;
}
function BookDetail() {
  const { id } = useParams();
  const resource = useResource(`books/${encodeURIComponent(id)}`);
  const book = resource.data;
  return <section className="section"><Link className="text-link" to={book ? `/categorias/${book.categoryId}` : '/catalogo'}>← Volver al catálogo</Link><ResourceState resource={resource}>{book && <div className="book-detail"><div className="detail-stage"><Cover book={book} large /></div><div><p className="eyebrow">UNA NUEVA HISTORIA TE ESPERA</p><h1>{book.title}</h1><p className="detail-author">{book.author}</p><p className="description">{book.description}</p><p className="detail-price">{price(book.price)}</p><p className="demo-note">Precio de referencia del catálogo de demostración.</p><Link className="button" to={`/categorias/${book.categoryId}`}>Explorar esta categoría ↗</Link></div></div>}</ResourceState></section>;
}
function NotFound() {
  return <section className="state"><p className="eyebrow">404 · PÁGINA NO ENCONTRADA</p><h1>Esta página aún no está escrita.</h1><Link className="button" to="/">Volver al inicio ↗</Link></section>;
}
export default function App() {
  const categories = useResource('categories');
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <><a className="skip-link" href="#contenido">Saltar al contenido</a><div className="topbar">Historias que inspiran. Libros que se quedan contigo.</div><header><Link to="/" className="brand"><span className="brand-icon">▤</span><span>entre líneas<small>LIBRERÍA & DESCUBRIMIENTOS</small></span></Link><nav aria-label="Navegación principal"><NavLink to="/">Inicio</NavLink><NavLink to="/catalogo" className={({ isActive }) => isActive || location.pathname.startsWith('/categorias/') ? 'active' : ''}>Catálogo</NavLink></nav><span className="header-note">Tu próxima lectura te espera <span>✦</span></span></header><main id="contenido"><Routes><Route path="/" element={<Home categories={categories} />} /><Route path="/catalogo" element={<Catalog categories={categories} />} /><Route path="/categorias/:genre" element={<Catalog key={location.pathname} categories={categories} />} /><Route path="/libros/:id" element={<BookDetail />} /><Route path="*" element={<NotFound />} /></Routes></main><footer><Link className="footer-brand" to="/">entre líneas <span>✦</span></Link><p>Un buen libro es siempre un buen comienzo.</p><small>Protecto Academico de Zuniga-Indusries.cl</small></footer></>;
}
