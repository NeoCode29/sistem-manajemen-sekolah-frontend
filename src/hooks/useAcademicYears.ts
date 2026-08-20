import { useState, useEffect, useCallback } from 'react';
import { 
  getAcademicYears, 
  createAcademicYear as apiCreateAcademicYear, 
  updateAcademicYear as apiUpdateAcademicYear, 
  deleteAcademicYear as apiDeleteAcademicYear,
  toggleAcademicYearActive as apiToggleAcademicYearActive,
  type AcademicYear 
} from '../api/academicService';

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
      setError(err.response?.data?.message || 'Gagal memuat data tahun ajaran');
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
      const message = err.response?.data?.message;
      throw new Error(Array.isArray(message) ? message.join(', ') : (message || 'Gagal menyimpan tahun ajaran'));
    }
  };

  const updateAcademicYear = async (id: string, payload: any) => {
    try {
      await apiUpdateAcademicYear(id, payload);
      await fetchYears();
    } catch (err: any) {
      const message = err.response?.data?.message;
      throw new Error(Array.isArray(message) ? message.join(', ') : (message || 'Gagal memperbarui tahun ajaran'));
    }
  };

  const toggleAcademicYearActive = async (id: string) => {
    try {
      await apiToggleAcademicYearActive(id);
      await fetchYears();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const deleteAcademicYear = async (id: string) => {
    try {
      await apiDeleteAcademicYear(id);
      await fetchYears();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal menghapus tahun ajaran');
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
