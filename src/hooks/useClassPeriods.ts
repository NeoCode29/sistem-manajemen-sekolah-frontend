import { useState, useEffect, useCallback } from 'react';
import { 
  getClassPeriods, 
  createClassPeriod as apiCreateClassPeriod, 
  updateClassPeriod as apiUpdateClassPeriod, 
  deleteClassPeriod as apiDeleteClassPeriod,
  type ClassPeriod 
} from '../api/academicService';
import { parseApiError } from '../utils/feedback';

export function useClassPeriods() {
  const [periods, setPeriods] = useState<ClassPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClassPeriods();
      const sorted = data.sort((a, b) => a.periodNumber - b.periodNumber);
      setPeriods(sorted);
    } catch (err: any) {
      console.error('Failed to fetch class periods:', err);
      setError(parseApiError(err, 'Gagal memuat data jam pelajaran'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const createClassPeriod = async (payload: any) => {
    try {
      await apiCreateClassPeriod(payload);
      await fetchPeriods();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menyimpan jam pelajaran'));
    }
  };

  const updateClassPeriod = async (id: string, payload: any) => {
    try {
      await apiUpdateClassPeriod(id, payload);
      await fetchPeriods();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal memperbarui jam pelajaran'));
    }
  };

  const deleteClassPeriod = async (id: string) => {
    try {
      await apiDeleteClassPeriod(id);
      await fetchPeriods();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menghapus jam pelajaran'));
    }
  };

  return {
    periods,
    loading,
    error,
    refresh: fetchPeriods,
    createClassPeriod,
    updateClassPeriod,
    deleteClassPeriod
  };
}
