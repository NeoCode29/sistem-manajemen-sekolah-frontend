import { useState, useMemo, useEffect } from 'react';
import type { DataTablePaginationProps } from '../components/Common/DataTable';

export function useClientPagination<T>(
  items: T[],
  initialPageSize: number = 10,
  resetDeps: any[] = []
): {
  paginatedItems: T[];
  pagination: DataTablePaginationProps;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (limit: number) => void;
} {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, safePage, itemsPerPage]);

  return {
    paginatedItems,
    currentPage: safePage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    pagination: {
      currentPage: safePage,
      totalPages,
      totalItems,
      itemsPerPage,
      onPageChange: setCurrentPage,
      onItemsPerPageChange: (newLimit: number) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1);
      }
    }
  };
}
