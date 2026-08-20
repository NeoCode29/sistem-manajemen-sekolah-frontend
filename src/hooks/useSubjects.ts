import { useState, useEffect, useCallback } from 'react';
import { 
  getSubjects, 
  createSubject as apiCreateSubject, 
  updateSubject as apiUpdateSubject, 
  deleteSubject as apiDeleteSubject,
  type Subject 
} from '../api/academicService';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSubjects();
      setSubjects(data);
    } catch (err: any) {
      console.error('Failed to fetch subjects:', err);
      setError(err.response?.data?.message || 'Gagal memuat data mata pelajaran');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const createSubject = async (payload: any) => {
    try {
      await apiCreateSubject(payload);
      await fetchSubjects();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal menyimpan mata pelajaran');
    }
  };

  const updateSubject = async (id: string, payload: any) => {
    try {
      await apiUpdateSubject(id, payload);
      await fetchSubjects();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memperbarui mata pelajaran');
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await apiDeleteSubject(id);
      await fetchSubjects();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal menghapus mata pelajaran');
    }
  };

  return {
    subjects,
    loading,
    error,
    refresh: fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject
  };
}
