import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Loads data from the backend and tracks loading, error, and the data itself
export function useLoad(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      setState({ data: await api(path), loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err.message });
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}