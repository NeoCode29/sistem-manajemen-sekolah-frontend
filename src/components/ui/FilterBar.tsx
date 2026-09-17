import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filters,
  onReset,
  showReset = false,
  extraActions,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 placeholder-gray-400"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Filters (Dropdowns) */}
        {filters && (
          <div className="flex flex-wrap items-center gap-3">
            {filters}
          </div>
        )}

        {/* Reset Filter Button */}
        {showReset && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800 rounded-xl transition-colors"
            title="Reset Filter"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Extra Action Buttons on the Right */}
      {extraActions && (
        <div className="flex items-center gap-2">
          {extraActions}
        </div>
      )}
    </div>
  );
};
