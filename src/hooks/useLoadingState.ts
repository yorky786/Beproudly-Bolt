import { useState, useCallback } from 'react';
import { LoadingState } from '../types';

export function useLoadingState(initialLoading = false): [
  LoadingState,
  {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
  }
] {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState({ isLoading: false, error });
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null });
  }, []);

  return [state, { setLoading, setError, reset }];
}
