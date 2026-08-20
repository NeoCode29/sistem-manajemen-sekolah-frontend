import { useState, useEffect, useCallback } from 'react';
import { 
  getClassrooms, 
  createClassroom as apiCreateClassroom, 
  updateClassroom as apiUpdateClassroom, 
  deleteClassroom as apiDeleteClassroom, 
  getGrades, 
  type Classroom, 
  type Grade 
} from '../api/academicService';

export function useClassrooms(filterGradeId?: string) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [classroomsData, gradesData] = await Promise.all([
        getClassrooms(filterGradeId || undefined),
        getGrades()
      ]);
      setClassrooms(classroomsData);
      setGrades(gradesData);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to fetch classrooms data');
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
      throw new Error(err.response?.data?.message || 'Failed to create classroom');
    }
  };

  const updateClassroom = async (id: string, payload: any) => {
    try {
      await apiUpdateClassroom(id, payload);
      await fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update classroom');
    }
  };

  const deleteClassroom = async (id: string) => {
    try {
      await apiDeleteClassroom(id);
      await fetchData();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete classroom');
    }
  };

  return {
    classrooms,
    grades,
    loading,
    error,
    refresh: fetchData,
    createClassroom,
    updateClassroom,
    deleteClassroom
  };
}
