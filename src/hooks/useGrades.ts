import { useState, useEffect, useCallback } from 'react';
import { 
  getGrades, 
  createGrade as apiCreateGrade, 
  updateGrade as apiUpdateGrade, 
  deleteGrade as apiDeleteGrade,
  type Grade 
} from '../api/academicService';
import { getErrorMessage } from '../utils/errorHandler';

export function useGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGrades();
      setGrades(data);
    } catch (err: any) {
      console.error('Failed to fetch grades:', err);
      setError(getErrorMessage(err, 'Gagal memuat data tingkat kelas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const createGrade = async (payload: any) => {
    try {
      await apiCreateGrade(payload);
      await fetchGrades();
    } catch (err: any) {
      throw new Error(getErrorMessage(err, 'Gagal menyimpan tingkat kelas'));
    }
  };

  const updateGrade = async (id: string, payload: any) => {
    try {
      await apiUpdateGrade(id, payload);
      await fetchGrades();
    } catch (err: any) {
      throw new Error(getErrorMessage(err, 'Gagal memperbarui tingkat kelas'));
    }
  };

  const deleteGrade = async (id: string) => {
    try {
      await apiDeleteGrade(id);
      await fetchGrades();
    } catch (err: any) {
      throw new Error(getErrorMessage(err, 'Gagal menghapus tingkat kelas'));
    }
  };

  return {
    grades,
    loading,
    error,
    refresh: fetchGrades,
    createGrade,
    updateGrade,
    deleteGrade
  };
}
