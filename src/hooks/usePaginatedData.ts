import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationState;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePaginatedData<T>(
  data: T[],
  initialPageSize: number = 20
): {
  paginatedResult: PaginatedResult<T>;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
} {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const paginatedResult = useMemo(() => {
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total,
      },
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }, [data, page, pageSize]);

  const goToPage = (newPage: number) => {
    const maxPage = Math.ceil(data.length / pageSize);
    setPage(Math.max(1, Math.min(newPage, maxPage)));
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const nextPage = () => {
    if (paginatedResult.hasNextPage) {
      setPage(page + 1);
    }
  };

  const previousPage = () => {
    if (paginatedResult.hasPreviousPage) {
      setPage(page - 1);
    }
  };

  return {
    paginatedResult,
    goToPage,
    setPageSize,
    nextPage,
    previousPage,
  };
}