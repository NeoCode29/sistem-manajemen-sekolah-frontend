import { useState, useEffect, useCallback } from 'react';
import { getGraduations, batchGraduate as apiBatchGraduate, cancelGraduation as apiCancelGraduation } from '../api/promotionService';
import { getClassrooms, getAcademicYears } from '../api/academicService';
import { getStudents, type Student } from '../api/studentService';
import type { Classroom as ClassType } from '../api/academicService';

export function useGraduations() {
  const [graduationsHistory, setGraduationsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [sourceStudents, setSourceStudents] = useState<Student[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGraduations();
      setGraduationsHistory(data);
    } catch (err: any) {
      console.error('Failed to fetch graduations:', err);
      setError('Gagal memuat riwayat kelulusan (Alumni)');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const [classData, ayData] = await Promise.all([
        getClassrooms(),
        getAcademicYears()
      ]);
      setClasses(classData);
      setAcademicYears(ayData);
      
      const activeAy = ayData.find((ay: any) => ay.isActive);
      if (activeAy) {
        setSelectedAcademicYear(activeAy.id);
      }
    } catch (err) {
      console.error('Failed to load classes or academic years');
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchClasses();
  }, [fetchHistory, fetchClasses]);

  const loadStudents = async (classId: string, academicYearId: string) => {
    if (!classId) {
      setSourceStudents([]);
      return [];
    }
    try {
      const payload: any = { classroomId: classId, status: 'ACTIVE', enrollmentStatus: 'ENROLLED' };
      if (academicYearId) {
        payload.academicYearId = academicYearId;
      }
      const res = await getStudents(payload);
      const students = Array.isArray(res) ? res : ((res as any).data || []);
      setSourceStudents(students as Student[]);
      return students as Student[];
    } catch (err) {
      console.error('Failed to load students:', err);
      return [];
    }
  };

  const batchGraduate = async (payload: any) => {
    try {
      await apiBatchGraduate(payload);
      await fetchHistory();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal memproses kelulusan');
    }
  };

  const cancelGraduation = async (id: string) => {
    try {
      await apiCancelGraduation(id);
      await fetchHistory();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Gagal membatalkan kelulusan');
    }
  };

  return {
    graduationsHistory,
    loading,
    error,
    classes,
    academicYears,
    sourceStudents,
    selectedAcademicYear,
    setSelectedAcademicYear,
    loadStudents,
    setSourceStudents,
    refresh: fetchHistory,
    batchGraduate,
    cancelGraduation
  };
}
