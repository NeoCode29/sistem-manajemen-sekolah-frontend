import { useState, useEffect, useCallback } from 'react';
import { 
  getSemesters, 
  createSemester as apiCreateSemester, 
  updateSemester as apiUpdateSemester, 
  deleteSemester as apiDeleteSemester,
  toggleSemesterActive as apiToggleSemesterActive,
  getAcademicYears,
  type Semester,
  type AcademicYear
} from '../api/academicService';
import { parseApiError } from '../utils/feedback';

export function useSemesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [semestersData, yearsData] = await Promise.all([
        getSemesters(),
        getAcademicYears()
      ]);
      setSemesters(semestersData);
      setAcademicYears(yearsData);
    } catch (err: any) {
      console.error('Failed to fetch semesters:', err);
      setError(parseApiError(err, 'Gagal memuat data semester. Silakan periksa koneksi atau coba beberapa saat lagi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createSemester = async (payload: any) => {
    try {
      await apiCreateSemester(payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menambahkan semester.'));
    }
  };

  const updateSemester = async (id: string, payload: any) => {
    try {
      await apiUpdateSemester(id, payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal memperbarui informasi semester.'));
    }
  };

  const toggleSemesterActive = async (id: string) => {
    try {
      await apiToggleSemesterActive(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal mengubah status aktif semester.'));
    }
  };

  const deleteSemester = async (id: string) => {
    try {
      await apiDeleteSemester(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menghapus data semester.'));
    }
  };

  return {
    semesters,
    academicYears,
    loading,
    error,
    refresh: fetchData,
    createSemester,
    updateSemester,
    toggleSemesterActive,
    deleteSemester
  };
}
