import { useState, useCallback } from 'react';
import { PaginationParams } from '../types';

export function usePagination(initialLimit = 20) {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: initialLimit,
    offset: 0,
  });

  const nextPage = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      page: prev.page + 1,
      offset: prev.page * prev.limit,
    }));
  }, []);

  const prevPage = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
      offset: Math.max(0, (prev.page - 2) * prev.limit),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({
      ...prev,
      page: Math.max(1, page),
      offset: Math.max(0, (page - 1) * prev.limit),
    }));
  }, []);

  const reset = useCallback(() => {
    setParams({
      page: 1,
      limit: initialLimit,
      offset: 0,
    });
  }, [initialLimit]);

  return {
    params,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
}
