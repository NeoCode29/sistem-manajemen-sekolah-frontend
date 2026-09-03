import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  hasNextPage?: boolean; // For when totalPages is unknown, like in Students where backend limits to 50 but doesn't return totalPages
  totalItems?: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange
}) => {
  // If totalPages is provided, we use it to determine if there's a next page.
  // If not, we rely on hasNextPage boolean (useful for backend that doesn't return totalPages).
  const canGoNext = totalPages !== undefined ? currentPage < totalPages : hasNextPage;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-md border-t border-gray-100 sm:px-6 rounded-b-2xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Halaman <span className="font-semibold text-indigo-600">{currentPage}</span>
            {totalPages !== undefined && (
              <> dari <span className="font-semibold text-gray-900">{totalPages}</span></>
            )}
            {totalItems !== undefined && (
               <> (Total <span className="font-semibold text-gray-900">{totalItems}</span> data)</>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-6">
          {onItemsPerPageChange && itemsPerPage && (
            <div className="flex items-center space-x-2">
              <label htmlFor="limit" className="text-sm text-gray-500 font-medium">Tampilkan:</label>
              <div className="relative">
                <select
                  id="limit"
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                  className="rounded-lg border-gray-200 py-1.5 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white shadow-sm transition-all cursor-pointer appearance-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
              </div>
            </div>
          )}

          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-lg px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-indigo-50 hover:text-indigo-600 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className="relative inline-flex items-center rounded-r-lg px-3 py-2 text-gray-400 ring-1 ring-inset ring-gray-200 hover:bg-indigo-50 hover:text-indigo-600 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
