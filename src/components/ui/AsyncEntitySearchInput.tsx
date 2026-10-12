import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Briefcase, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { lookupEmployees, lookupStudents, type EntityLookupItem } from '../../api/rbacService';

export interface AsyncEntitySearchInputProps {
  type: 'EMPLOYEE' | 'STUDENT';
  selectedEntity: EntityLookupItem | null;
  onSelect: (item: EntityLookupItem) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const AsyncEntitySearchInput: React.FC<AsyncEntitySearchInputProps> = ({
  type,
  selectedEntity,
  onSelect,
  onClear,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<EntityLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeholderText =
    type === 'EMPLOYEE'
      ? 'Ketik nama atau NIP pegawai (min. 2 huruf)...'
      : 'Ketik nama atau NIS siswa (min. 2 huruf)...';

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const fetcher = type === 'EMPLOYEE' ? lookupEmployees : lookupStudents;
        const data = await fetcher(trimmed, 10);
        setResults(data);
        setIsOpen(true);
      } catch (err: any) {
        console.error('Lookup search error:', err);
        setErrorMsg('Gagal memuat hasil pencarian');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, type]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (item: EntityLookupItem) => {
    if (item.hasAccount) return;
    onSelect(item);
    setSearchTerm('');
    setIsOpen(false);
  };

  // If an entity is selected, render a compact cardlet
  if (selectedEntity) {
    const isEmployee = type === 'EMPLOYEE';
    return (
      <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl transition-all shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            {isEmployee ? <Briefcase className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 truncate">
                {selectedEntity.name}
              </span>
              <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-100 text-indigo-700 font-medium">
                {isEmployee ? `NIP: ${selectedEntity.identifier}` : `NIS: ${selectedEntity.identifier}`}
              </span>
            </div>
            <p className="text-xs text-gray-600 truncate mt-0.5">
              {selectedEntity.subInfo || (isEmployee ? 'Pegawai Sekolah' : 'Siswa')}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors shrink-0 ml-3"
            title="Lepas kaitan entitas"
          >
            <X className="w-3.5 h-3.5" />
            <span>Lepas Kaitan</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholderText}
          disabled={disabled}
          className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Popover Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {errorMsg && (
            <div className="p-3 text-xs text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!loading && results.length === 0 && searchTerm.trim().length >= 2 && !errorMsg && (
            <div className="p-4 text-center text-xs text-gray-500">
              Tidak ditemukan {type === 'EMPLOYEE' ? 'pegawai' : 'siswa'} dengan kata kunci &quot;{searchTerm}&quot;
            </div>
          )}

          {results.map((item) => {
            const hasAccount = item.hasAccount;
            return (
              <div
                key={item.id}
                onClick={() => !hasAccount && handleSelect(item)}
                className={`p-3 flex items-center justify-between gap-3 text-left transition-colors ${
                  hasAccount
                    ? 'bg-gray-50/70 cursor-not-allowed opacity-75'
                    : 'hover:bg-indigo-50/70 cursor-pointer'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {item.identifier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {item.subInfo}
                  </p>
                </div>

                <div className="shrink-0">
                  {hasAccount ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
                      <AlertCircle className="w-3 h-3" />
                      Sudah ada akun {item.existingUsername ? `(@${item.existingUsername})` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Tersedia
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
