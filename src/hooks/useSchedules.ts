import { useState, useEffect, useCallback } from 'react';
import { getSchedules, createSchedule as apiCreateSchedule, updateSchedule as apiUpdateSchedule, deleteSchedule as apiDeleteSchedule, getSubjectAssignments, createSubjectAssignment as apiCreateSubjectAssignment, updateSubjectAssignment as apiUpdateSubjectAssignment, deleteSubjectAssignment as apiDeleteSubjectAssignment } from '../api/schedulingService';
import type { Schedule, SubjectAssignment } from '../api/schedulingService';
import { getAcademicYears, getSemesters, getClassrooms, getSubjects, getClassPeriods } from '../api/academicService';
import type { AcademicYear, Semester, Classroom, Subject, ClassPeriod } from '../api/academicService';
import { getEmployees } from '../api/employeeService';
import type { Employee } from '../api/employeeService';
import { getErrorMessage } from '../utils/errorHandler';

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [classPeriods, setClassPeriods] = useState<ClassPeriod[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageError, setPageError] = useState('');

  // Filters
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');
  const [filterSemesterId, setFilterSemesterId] = useState('');
  const [filterClassroomId, setFilterClassroomId] = useState('');

  const fetchDependencies = useCallback(async () => {
    try {
      setPageError('');
      const [ayData, semData, subjData, empData, clsData, periodData] = await Promise.all([
        getAcademicYears(),
        getSemesters(),
        getSubjects(),
        getEmployees({ isActive: 'true' }),
        getClassrooms(),
        getClassPeriods()
      ]);
      setAcademicYears(ayData);
      setSemesters(semData);
      setSubjects(subjData);
      setEmployees(empData);
      setClassrooms(clsData);
      setClassPeriods(periodData.filter((p: any) => !p.isBreak).sort((a: any, b: any) => a.periodNumber - b.periodNumber));
      
      const activeAy = ayData.find((a: any) => a.isActive);
      const activeSem = semData.find((s: any) => s.isActive);
      if (activeAy) setFilterAcademicYearId(activeAy.id);
      if (activeSem) setFilterSemesterId(activeSem.id);
      
      if (clsData.length > 0 && !filterClassroomId) {
        setFilterClassroomId(clsData[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setPageError(getErrorMessage(err, 'Gagal memuat data referensi jadwal'));
    }
  }, [filterClassroomId]);

  const fetchClassroomData = useCallback(async () => {
    if (!filterClassroomId) return;
    try {
      setLoading(true);
      setError('');
      const [scheds, assigns] = await Promise.all([
        getSchedules(filterClassroomId),
        getSubjectAssignments(filterClassroomId)
      ]);
      
      setSchedules(scheds.filter((s: any) => s.academicYearId === filterAcademicYearId && s.semesterId === filterSemesterId));
      setSubjectAssignments(assigns.filter((a: any) => a.academicYearId === filterAcademicYearId && a.semesterId === filterSemesterId));
    } catch (err: any) {
      setError(getErrorMessage(err, 'Gagal memuat data jadwal pelajaran kelas'));
    } finally {
      setLoading(false);
    }
  }, [filterClassroomId, filterAcademicYearId, filterSemesterId]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    if (filterClassroomId) {
      fetchClassroomData();
    } else {
      setSchedules([]);
      setSubjectAssignments([]);
    }
  }, [filterClassroomId, filterAcademicYearId, filterSemesterId, fetchClassroomData]);

  const createSubjectAssignment = async (payload: any) => {
    if (!filterClassroomId) return;
    try {
      await apiCreateSubjectAssignment(filterClassroomId, payload);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  const updateSubjectAssignment = async (id: string, payload: any) => {
    if (!filterClassroomId) return;
    try {
      await apiUpdateSubjectAssignment(filterClassroomId, id, payload);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteSubjectAssignment = async (id: string) => {
    if (!filterClassroomId) return;
    try {
      await apiDeleteSubjectAssignment(filterClassroomId, id);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  const createSchedule = async (payload: any) => {
    if (!filterClassroomId) return;
    try {
      await apiCreateSchedule(filterClassroomId, payload);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  const updateSchedule = async (id: string, payload: any) => {
    if (!filterClassroomId) return;
    try {
      await apiUpdateSchedule(filterClassroomId, id, payload);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!filterClassroomId) return;
    try {
      await apiDeleteSchedule(filterClassroomId, id);
      await fetchClassroomData();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    schedules,
    subjectAssignments,
    academicYears,
    semesters,
    classrooms,
    subjects,
    employees,
    classPeriods,
    loading,
    error,
    pageError,
    setError,
    filterAcademicYearId,
    setFilterAcademicYearId,
    filterSemesterId,
    setFilterSemesterId,
    filterClassroomId,
    setFilterClassroomId,
    createSubjectAssignment,
    updateSubjectAssignment,
    deleteSubjectAssignment,
    createSchedule,
    updateSchedule,
    deleteSchedule
  };
}
