import { useState, useEffect, useCallback } from 'react';
import { 
  getClassrooms, 
  createClassroom as apiCreateClassroom, 
  updateClassroom as apiUpdateClassroom, 
  deleteClassroom as apiDeleteClassroom, 
  getGrades,
  getMajors,
  type Classroom,
  type Grade,
  type Major
} from '../api/academicService';
import { parseApiError } from '../utils/feedback';

export function useClassrooms(filterGradeId?: string) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classroomsData, gradesData, majorsData] = await Promise.all([
        getClassrooms(filterGradeId || undefined),
        getGrades(),
        getMajors()
      ]);
      setClassrooms(classroomsData);
      setGrades(gradesData);
      setMajors(majorsData);
    } catch (err: any) {
      console.error('Failed to fetch classrooms data:', err);
      setError(parseApiError(err, 'Gagal memuat data rombel'));
    } finally {
      setLoading(false);
    }
  }, [filterGradeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createClassroom = async (payload: any) => {
    try {
      await apiCreateClassroom(payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menambahkan rombel baru'));
    }
  };

  const updateClassroom = async (id: string, payload: any) => {
    try {
      await apiUpdateClassroom(id, payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal memperbarui data rombel'));
    }
  };

  const deleteClassroom = async (id: string) => {
    try {
      await apiDeleteClassroom(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menghapus rombel'));
    }
  };

  return {
    classrooms,
    grades,
    majors,
    loading,
    error,
    refresh: fetchData,
    createClassroom,
    updateClassroom,
    deleteClassroom
  };
}
