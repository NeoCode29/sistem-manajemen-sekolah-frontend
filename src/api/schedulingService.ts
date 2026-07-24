import api from './axios';
import type { AcademicYear, Semester, Subject, ClassPeriod } from './academicService';
import type { Employee } from './employeeService';

export interface SubjectAssignment {
  id: string;
  classroomId: string;
  subjectId: string;
  employeeId: string;
  academicYearId: string;
  semesterId: string;
  creditHours?: number;
  isActive: boolean;
  subject?: Subject;
  employee?: Employee;
  academicYear?: AcademicYear;
  semester?: Semester;
}

export interface Schedule {
  id: string;
  classroomId: string;
  academicYearId: string;
  semesterId: string;
  classPeriodId: string;
  subjectAssignmentId: string;
  room?: string;
  dayOfWeek: number; // 1 = Senin, etc.
  classPeriod?: ClassPeriod;
  subjectAssignment?: SubjectAssignment;
}

// ========================
// Subject Assignments
// ========================
export const getSubjectAssignments = async (classroomId: string): Promise<SubjectAssignment[]> => {
  const response = await api.get(`/classrooms/${classroomId}/subject-assignments`);
  return response.data;
};

export const createSubjectAssignment = async (classroomId: string, data: Partial<SubjectAssignment>): Promise<SubjectAssignment> => {
  const response = await api.post(`/classrooms/${classroomId}/subject-assignments`, data);
  return response.data;
};

export const updateSubjectAssignment = async (classroomId: string, id: string, data: Partial<SubjectAssignment>): Promise<SubjectAssignment> => {
  const response = await api.put(`/classrooms/${classroomId}/subject-assignments/${id}`, data);
  return response.data;
};

export const deleteSubjectAssignment = async (classroomId: string, id: string): Promise<void> => {
  await api.delete(`/classrooms/${classroomId}/subject-assignments/${id}`);
};

// ========================
// Class Schedules
// ========================
export const getSchedules = async (classroomId: string): Promise<Schedule[]> => {
  const response = await api.get(`/classrooms/${classroomId}/schedules`);
  return response.data;
};

export const createSchedule = async (classroomId: string, data: Partial<Schedule>): Promise<Schedule> => {
  const response = await api.post(`/classrooms/${classroomId}/schedules`, data);
  return response.data;
};

export const updateSchedule = async (classroomId: string, id: string, data: Partial<Schedule>): Promise<Schedule> => {
  const response = await api.put(`/classrooms/${classroomId}/schedules/${id}`, data);
  return response.data;
};

export const deleteSchedule = async (classroomId: string, id: string): Promise<void> => {
  await api.delete(`/classrooms/${classroomId}/schedules/${id}`);
};
