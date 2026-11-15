import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createResourceStore } from '../src/services/resourceStore.js';
const tick = () => new Promise(resolve => setTimeout(resolve, 10));

test('comparte peticiones simultáneas y reutiliza la caché al volver', async () => {
  let calls = 0;
  let finish;
  const store = createResourceStore(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const leave = store.subscribe('books', () => {});
  const leaveOther = store.subscribe('books', () => {});
  await tick();
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot('books').loading, true);
  finish([]);
  await tick();
  leave(); leaveOther();
  const back = store.subscribe('books', () => {});
  await tick();
  assert.equal(calls, 1);
  assert.deepEqual(store.getSnapshot('books'), { data: [], loading: false, error: null });
  back();
});
test('StrictMode no duplica la solicitud durante el remontaje inmediato', async () => {
  let calls = 0;
  const store = createResourceStore(async () => { calls++; return []; });
  store.subscribe('categories', () => {})();
  const leave = store.subscribe('categories', () => {});
  await tick();
  assert.equal(calls, 1);
  leave();
});
test('renueva la caché vencida sin ocultar el contenido anterior', async () => {
  let clock = 0, calls = 0, finish;
  const store = createResourceStore(() => {
    calls++;
    return calls === 1 ? Promise.resolve(['anterior']) : new Promise(resolve => { finish = resolve; });
  }, { ttl: 100, now: () => clock });
  const leave = store.subscribe('books', () => {});
  await tick(); leave();
  clock = 101;
  const back = store.subscribe('books', () => {});
  assert.deepEqual(store.getSnapshot('books'), { data: ['anterior'], loading: true, error: null });
  await tick(); finish(['actualizado']); await tick();
  assert.equal(calls, 2);
  assert.deepEqual(store.getSnapshot('books').data, ['actualizado']);
  back();
});
test('permite reintentar un fallo y conserva datos ante errores al actualizar', async () => {
  let fail = true;
  const store = createResourceStore(async () => { if (fail) throw new Error('Servidor temporalmente no disponible'); return ['libro']; });
  const leave = store.subscribe('books', () => {});
  await tick();
  assert.equal(store.getSnapshot('books').loading, false);
  assert.match(store.getSnapshot('books').error, /Servidor/);
  fail = false; store.retry('books'); await tick();
  assert.deepEqual(store.getSnapshot('books').data, ['libro']);
  fail = true; store.retry('books'); await tick();
  assert.deepEqual(store.getSnapshot('books').data, ['libro']);
  assert.equal(store.getSnapshot('books').loading, false);
  leave();
});
test('cancela al salir y una respuesta tardía no reemplaza otra ruta', async () => {
  let oldSignal;
  const store = createResourceStore(async (path, signal) => {
    if (path === 'old') { oldSignal = signal; await tick(); await tick(); }
    return [path];
  });
  const leave = store.subscribe('old', () => {});
  await tick(); leave();
  const leaveNew = store.subscribe('new', () => {});
  await tick(); await tick();
  assert.equal(oldSignal.aborted, true);
  assert.deepEqual(store.getSnapshot('new').data, ['new']);
  assert.equal(store.getSnapshot('old').data, null);
  leaveNew();
});
