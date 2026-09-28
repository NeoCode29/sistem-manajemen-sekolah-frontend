import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    openUpwards: boolean;
  } | null>(null);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const itemHeight = 36;
  const listMaxHeight = itemHeight * maxVisible;

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownEstimatedHeight = listMaxHeight + 70; // search header + footer
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < dropdownEstimatedHeight && rect.top > dropdownEstimatedHeight;

    setCoords({
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpwards,
    });
  };

  useEffect(() => {
    if (open) {
      updateCoords();
      setTimeout(() => searchRef.current?.focus(), 50);

      const handleScrollOrResize = (e: Event) => {
        // Jangan tutup jika scroll terjadi di dalam list item dropdown itu sendiri
        if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
          return;
        }
        setOpen(false);
        setSearch('');
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
          setSearch('');
        }
      };

      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setCoords(null);
    }
  }, [open, listMaxHeight]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        aria-expanded={open}
        style={{
          border: `1px solid ${disabled ? '#e5e7eb' : open ? '#818cf8' : '#e5e7eb'}`,
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          boxShadow: open ? '0 0 0 2px rgba(129, 140, 248, 0.2)' : 'none',
        }}
        className={`input-std flex items-center justify-between gap-2 text-left min-h-[38px] transition-all duration-150 ${
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:!border-gray-300'
        }`}
      >
        <span className={`truncate ${value ? 'text-gray-900 font-normal' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {open && coords && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            transform: coords.openUpwards ? 'translateY(-100%)' : 'none',
            zIndex: 99999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
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
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
              >
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
                  className={`w-full text-left px-4 text-sm flex items-center hover:bg-indigo-50 transition-colors cursor-pointer ${
                    opt === value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700'
                  }`}
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
        </div>,
        document.body
      )}
    </div>
  );
};
