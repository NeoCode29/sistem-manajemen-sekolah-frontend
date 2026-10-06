import React from 'react';
import { Archive, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableSkeleton } from './TableSkeleton';
import { Pagination } from './Pagination';
import type { SortConfig, SortDirection } from '../../utils/tableSort';

export type { SortConfig, SortDirection };

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index?: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
  /** Menentukan apakah kolom bisa diurutkan. Default false untuk 'actions' & '#', true untuk kolom data */
  sortable?: boolean;
  /** Fungsi kustom untuk mengekstrak nilai pembanding (misal: nested object atau formatted value) */
  sortValue?: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
  hasNextPage?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  hasPagination?: boolean;
  containerClassName?: string;
  pagination?: DataTablePaginationProps;
  sortConfig?: SortConfig | null;
  onSortChange?: (sort: SortConfig | null) => void;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data.',
  containerClassName,
  pagination,
  sortConfig,
  onSortChange
}: DataTableProps<T>) {
  const showPagination = Boolean(pagination && (pagination.totalItems ?? data.length) > 0);
  const defaultContainerClass = `bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full rounded-2xl`;
  const finalContainerClass = containerClassName !== undefined ? containerClassName : defaultContainerClass;

  const handleHeaderClick = (col: Column<T>) => {
    const isSortable = col.sortable !== undefined ? col.sortable : col.key !== 'actions' && col.key !== '#';
    if (!isSortable || !onSortChange) return;

    if (!sortConfig || sortConfig.key !== col.key) {
      onSortChange({ key: col.key, direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      onSortChange({ key: col.key, direction: 'desc' });
    } else {
      onSortChange(null);
    }
  };

  const renderHeaderRow = (isInteractive: boolean = true) => (
    <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
      {columns.map((col) => {
        const isSortable = Boolean(
          isInteractive &&
          onSortChange &&
          (col.sortable !== undefined ? col.sortable : col.key !== 'actions' && col.key !== '#')
        );
        const isCurrentSorted = sortConfig?.key === col.key;
        const direction = isCurrentSorted ? sortConfig.direction : null;

        return (
          <th 
            key={col.key} 
            style={col.width ? { width: col.width, maxWidth: col.width } : undefined}
            onClick={isSortable ? () => handleHeaderClick(col) : undefined}
            className={`px-6 py-4 font-semibold tracking-wide whitespace-nowrap transition-colors ${
              isSortable ? 'cursor-pointer select-none hover:bg-gray-100/70 group' : ''
            } ${col.headerClassName || ''}`}
            title={
              isSortable
                ? direction === 'asc'
                  ? 'Klik untuk urutkan Z-A (Descending)'
                  : direction === 'desc'
                  ? 'Klik untuk kembalikan urutan default'
                  : 'Klik untuk urutkan A-Z (Ascending)'
                : undefined
            }
          >
            <div className="flex items-center justify-between gap-2">
              <span>{col.header}</span>
              {isSortable && (
                <span className="inline-flex items-center">
                  {direction === 'asc' ? (
                    <ArrowUp className="w-3.5 h-3.5 text-blue-600 bg-blue-50 rounded p-0.5" />
                  ) : direction === 'desc' ? (
                    <ArrowDown className="w-3.5 h-3.5 text-blue-600 bg-blue-50 rounded p-0.5" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  )}
                </span>
              )}
            </div>
          </th>
        );
      })}
    </tr>
  );

  if (loading) {
    return (
      <div className={finalContainerClass}>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              {renderHeaderRow(false)}
            </thead>
            <tbody className="divide-y divide-gray-50">
              <TableSkeleton columns={columns.length} rows={5} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={finalContainerClass}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm">
          <thead>
            {renderHeaderRow(true)}
          </thead>
          <tbody className="divide-y divide-gray-50 animate-in fade-in duration-300">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="text-center p-12 text-gray-500 flex flex-col items-center justify-center gap-3">
                    <Archive size={48} className="text-gray-300 mb-2" />
                    <span className="text-sm font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                  {columns.map((col) => {
                    const content = col.render ? col.render(row, rowIndex) : (row as any)[col.key];
                    const isPrimitive = typeof content === 'string' || typeof content === 'number';
                    const displayContent = isPrimitive ? (
                      <span 
                        className="block max-w-[240px] md:max-w-[280px] truncate" 
                        title={String(content)}
                      >
                        {content}
                      </span>
                    ) : (
                      content ?? '-'
                    );

                    return (
                      <td 
                        key={col.key} 
                        style={col.width ? { width: col.width, maxWidth: col.width } : undefined}
                        className={`px-6 py-4 align-middle max-w-[320px] overflow-hidden ${col.className || ''}`}
                      >
                        {displayContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && showPagination && pagination && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}
