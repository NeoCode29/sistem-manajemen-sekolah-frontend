import { useState, useMemo, useEffect } from 'react';
import type { DataTablePaginationProps, Column } from '../components/Common/DataTable';
import { sortData, type SortConfig } from '../utils/tableSort';

export function useClientPagination<T>(
  items: T[],
  initialPageSize: number = 10,
  resetDeps: any[] = [],
  columns?: Column<T>[],
  defaultSort?: SortConfig | null
): {
  paginatedItems: T[];
  pagination: DataTablePaginationProps;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (limit: number) => void;
  sortConfig: SortConfig | null;
  setSortConfig: (sort: SortConfig | null) => void;
  onSortChange: (sort: SortConfig | null) => void;
} {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  /* oxlint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(() => {
    setCurrentPage(1);
    /* oxlint-disable-next-line react-hooks/exhaustive-deps */
  }, resetDeps);

  // Buat custom extractors dari definisi col.sortValue jika ada
  const customExtractors = useMemo(() => {
    if (!columns) return undefined;
    const extractors: Record<string, (item: T) => any> = {};
    for (const col of columns) {
      if (col.sortValue) {
        extractors[col.key] = col.sortValue;
      }
    }
    return Object.keys(extractors).length > 0 ? extractors : undefined;
  }, [columns]);

  // 1. Urutkan seluruh data (whole dataset) sebelum dipotong paginasi
  const sortedItems = useMemo(() => {
    return sortData(items, sortConfig, customExtractors);
  }, [items, sortConfig, customExtractors]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  // 2. Potong data yang sudah terurut ke halaman aktif
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, safePage, itemsPerPage]);

  const handleSortChange = (newSort: SortConfig | null) => {
    setSortConfig(newSort);
    setCurrentPage(1); // Reset ke halaman 1 saat urutan berubah
  };

  return {
    paginatedItems,
    currentPage: safePage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortConfig,
    setSortConfig,
    onSortChange: handleSortChange,
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
