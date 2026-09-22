import { useState, useEffect, useCallback } from 'react';
import { 
  getAcademicYears, 
  createAcademicYear as apiCreateAcademicYear, 
  updateAcademicYear as apiUpdateAcademicYear, 
  deleteAcademicYear as apiDeleteAcademicYear,
  toggleAcademicYearActive as apiToggleAcademicYearActive,
  type AcademicYear 
} from '../api/academicService';
import { parseApiError } from '../utils/feedback';

export function useAcademicYears() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYears = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAcademicYears();
      setYears(data);
    } catch (err: any) {
      console.error('Failed to fetch academic years:', err);
      setError(parseApiError(err, 'Gagal memuat data tahun ajaran'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const createAcademicYear = async (payload: any) => {
    try {
      await apiCreateAcademicYear(payload);
      await fetchYears();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menyimpan tahun ajaran'));
    }
  };

  const updateAcademicYear = async (id: string, payload: any) => {
    try {
      await apiUpdateAcademicYear(id, payload);
      await fetchYears();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal memperbarui tahun ajaran'));
    }
  };

  const toggleAcademicYearActive = async (id: string) => {
    try {
      await apiToggleAcademicYearActive(id);
      await fetchYears();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal mengubah status'));
    }
  };

  const deleteAcademicYear = async (id: string) => {
    try {
      await apiDeleteAcademicYear(id);
      await fetchYears();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menghapus tahun ajaran'));
    }
  };

  return {
    years,
    loading,
    error,
    refresh: fetchYears,
    createAcademicYear,
    updateAcademicYear,
    toggleAcademicYearActive,
    deleteAcademicYear
  };
}
