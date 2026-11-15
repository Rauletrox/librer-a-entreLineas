import { useCallback, useSyncExternalStore } from 'react';
import { resourceStore } from '../services/resourceStore.js';

export function useResource(path) {
  const subscribe = useCallback(listener => resourceStore.subscribe(path, listener), [path]);
  const getSnapshot = useCallback(() => resourceStore.getSnapshot(path), [path]);
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return { ...state, retry: () => resourceStore.retry(path) };
}
