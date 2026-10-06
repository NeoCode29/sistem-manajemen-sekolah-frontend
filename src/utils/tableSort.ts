export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

/**
 * Mendapatkan nilai dari object berdasarkan key atau dot-notation path (contoh: 'profile.name')
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

/**
 * Pembanding multi-tipe (angka, tanggal, boolean, teks) yang aman terhadap null/undefined.
 * Nilai null atau undefined selalu ditempatkan di posisi paling akhir.
 */
export function compareValues(aValue: any, bValue: any, direction: 'asc' | 'desc'): number {
  const isANull = aValue === null || aValue === undefined || aValue === '';
  const isBNull = bValue === null || bValue === undefined || bValue === '';

  if (isANull && isBNull) return 0;
  if (isANull) return 1; // null selalu di akhir
  if (isBNull) return -1; // null selalu di akhir

  let comparison = 0;

  // 1. Tipe Boolean
  if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
    comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
  }
  // 2. Tipe Angka / Number
  else if (typeof aValue === 'number' && typeof bValue === 'number') {
    comparison = aValue - bValue;
  }
  // 3. Tipe Tanggal / Date
  else if (aValue instanceof Date && bValue instanceof Date) {
    comparison = aValue.getTime() - bValue.getTime();
  }
  // 4. String tanggal ISO (misal: '2026-10-06T14:00:00Z')
  else if (
    typeof aValue === 'string' &&
    typeof bValue === 'string' &&
    /^\d{4}-\d{2}-\d{2}/.test(aValue) &&
    /^\d{4}-\d{2}-\d{2}/.test(bValue) &&
    !isNaN(Date.parse(aValue)) &&
    !isNaN(Date.parse(bValue))
  ) {
    comparison = Date.parse(aValue) - Date.parse(bValue);
  }
  // 5. Tipe String / Teks (Gunakan localeCompare bahasa Indonesia case-insensitive)
  else {
    const aStr = String(aValue).trim();
    const bStr = String(bValue).trim();
    comparison = aStr.localeCompare(bStr, 'id', { numeric: true, sensitivity: 'base' });
  }

  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Mengurutkan array data berdasarkan sortConfig dan custom extractors opsional.
 * Mengembalikan array baru tanpa memutasi array asli.
 */
export function sortData<T>(
  data: T[],
  sortConfig: SortConfig | null,
  customExtractors?: Record<string, (item: T) => any>
): T[] {
  if (!sortConfig || !sortConfig.key || !sortConfig.direction) {
    return data;
  }

  const { key, direction } = sortConfig;
  const extractor = customExtractors?.[key];

  return [...data].sort((a, b) => {
    const aVal = extractor ? extractor(a) : getNestedValue(a, key);
    const bVal = extractor ? extractor(b) : getNestedValue(b, key);
    return compareValues(aVal, bVal, direction);
  });
}
