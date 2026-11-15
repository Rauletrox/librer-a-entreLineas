import { getResource } from './api.js';

// Caché en memoria: no conserva errores ni almacena datos personales en disco.
// Una sola petición por recurso, incluso con varios componentes o StrictMode.
export function createResourceStore(load = getResource, { ttl = 60000, now = Date.now } = {}) {
  const entries = new Map();
  function entryFor(path) {
    if (!entries.has(path)) entries.set(path, {
      state: { data: null, loading: true, error: null },
      listeners: new Set(), updatedAt: null, request: null, cleanup: null,
    });
    return entries.get(path);
  }
  function publish(entry, state) {
    entry.state = state;
    entry.listeners.forEach(listener => listener());
  }
  function refresh(path, force = false) {
    const entry = entryFor(path);
    if (entry.request || (!force && entry.updatedAt !== null && now() - entry.updatedAt < ttl)) return;
    const controller = new AbortController();
    entry.request = controller;
    publish(entry, { data: entry.state.data, loading: true, error: null });
    Promise.resolve().then(() => load(path, controller.signal)).then(data => {
      if (controller.signal.aborted) return;
      entry.updatedAt = now();
      publish(entry, { data, loading: false, error: null });
    }).catch(error => {
      if (controller.signal.aborted) return;
      entry.updatedAt = null;
      publish(entry, { data: entry.state.data, loading: false, error: error.message });
    }).finally(() => {
      if (entry.request === controller) entry.request = null;
    });
  }
  return {
    getSnapshot: path => entryFor(path).state,
    subscribe(path, listener) {
      const entry = entryFor(path);
      clearTimeout(entry.cleanup);
      entry.listeners.add(listener);
      refresh(path);
      return () => {
        entry.listeners.delete(listener);
        // Permite el desmontaje/remontaje inmediato de StrictMode sin duplicar GET.
        entry.cleanup = setTimeout(() => {
          if (!entry.listeners.size && entry.request) {
            entry.request.abort();
            entry.request = null;
            entry.state = { data: entry.state.data, loading: true, error: null };
          }
        }, 0);
      };
    },
    retry: path => refresh(path, true),
  };
}
export const resourceStore = createResourceStore();
