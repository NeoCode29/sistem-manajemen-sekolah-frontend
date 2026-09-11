import React from 'react';
import { Archive } from 'lucide-react';
import { TableSkeleton } from './TableSkeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  hasPagination?: boolean;
  containerClassName?: string;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data.',
  hasPagination = false,
  containerClassName
}: DataTableProps<T>) {
  const defaultContainerClass = `bg-white border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full ${hasPagination ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'}`;
  const finalContainerClass = containerClassName !== undefined ? containerClassName : defaultContainerClass;

  if (loading) {
    return (
      <div className={finalContainerClass}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 font-semibold tracking-wide">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <TableSkeleton columns={columns.length} rows={5} />
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={finalContainerClass}>
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 font-semibold tracking-wide">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
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
            data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
