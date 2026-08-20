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
      setError(err.response?.data?.message || 'Gagal memuat data semester');
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
      throw new Error(err.response?.data?.message || 'Gagal menyimpan semester');
    }
  };

  const updateSemester = async (id: string, payload: any) => {
    try {
      await apiUpdateSemester(id, payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memperbarui semester');
    }
  };

  const toggleSemesterActive = async (id: string) => {
    try {
      await apiToggleSemesterActive(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal mengubah status semester');
    }
  };

  const deleteSemester = async (id: string) => {
    try {
      await apiDeleteSemester(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal menghapus semester');
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
