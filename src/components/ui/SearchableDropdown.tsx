import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Jumlah item visible sebelum scroll aktif, default 6 */
  maxVisible?: number;
  disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  className = '',
  maxVisible = 6,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const itemHeight = 36;
  const listMaxHeight = itemHeight * maxVisible;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between gap-2 transition-all duration-150 outline-none ${
          disabled
            ? 'bg-gray-50 cursor-not-allowed'
            : 'bg-white cursor-pointer'
        } ${
          open && !disabled ? 'ring-2 ring-indigo-400/20' : ''
        } ${value && !disabled ? 'text-gray-900' : 'text-gray-400'}`}
        style={{
          border: `1px solid ${disabled ? '#e5e7eb' : open ? '#818cf8' : '#6b7280'}`,
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${disabled ? 'text-gray-300' : 'text-gray-400'} ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari..."
              className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 bg-transparent"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ maxHeight: listMaxHeight }} className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Tidak ditemukan</div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  style={{ height: itemHeight }}
                  className={`w-full text-left px-4 text-sm flex items-center hover:bg-indigo-50 transition-colors ${opt === value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>

          {filtered.length > maxVisible && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400">{filtered.length} pilihan — scroll untuk melihat semua</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
