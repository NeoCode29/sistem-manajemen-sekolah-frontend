import api from './axios';

// 1. Academic Years
export interface AcademicYear {
  id: string;
  code: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}
export const getAcademicYears = async (): Promise<AcademicYear[]> => {
  const response = await api.get('/academic-years');
  return response.data.data ? response.data.data : response.data;
};
export const createAcademicYear = async (data: Partial<AcademicYear>) => {
  const response = await api.post('/academic-years', data);
  return response.data;
};
export const toggleAcademicYearActive = async (id: string) => {
  const response = await api.patch(`/academic-years/${id}/toggle-active`);
  return response.data;
};
export const deleteAcademicYear = async (id: string) => {
  const response = await api.delete(`/academic-years/${id}`);
  return response.data;
};
export const updateAcademicYear = async (id: string, data: Partial<AcademicYear>) => {
  const response = await api.patch(`/academic-years/${id}`, data);
  return response.data;
};

// 2. Semesters
export interface Semester {
  id: string;
  academicYearId: string;
  code: string;
  name: string;
  semesterType?: string;
  isActive: boolean;
  academicYear?: AcademicYear;
}
export const getSemesters = async (): Promise<Semester[]> => {
  const response = await api.get('/semesters');
  return response.data.data ? response.data.data : response.data;
};
export const createSemester = async (data: Partial<Semester>) => {
  const response = await api.post('/semesters', data);
  return response.data;
};
export const toggleSemesterActive = async (id: string) => {
  const response = await api.patch(`/semesters/${id}/toggle-active`);
  return response.data;
};
export const deleteSemester = async (id: string) => {
  const response = await api.delete(`/semesters/${id}`);
  return response.data;
};
export const updateSemester = async (id: string, data: Partial<Semester>) => {
  const response = await api.patch(`/semesters/${id}`, data);
  return response.data;
};

// 3. Grades (Tingkat)
export interface Grade {
  id: string;
  code: string;
  name: string;
  level: number;
  educationLevel: string;
}
export const getGrades = async (): Promise<Grade[]> => {
  const response = await api.get('/grades');
  return response.data.data ? response.data.data : response.data;
};
export const createGrade = async (data: Partial<Grade>) => {
  const response = await api.post('/grades', data);
  return response.data;
};
export const deleteGrade = async (id: string) => {
  const response = await api.delete(`/grades/${id}`);
  return response.data;
};
export const updateGrade = async (id: string, data: Partial<Grade>) => {
  const response = await api.patch(`/grades/${id}`, data);
  return response.data;
};

// 4. Classrooms
export interface Classroom {
  id: string;
  gradeId: string;
  code: string;
  name: string;
  capacity?: number;
  grade?: Grade;
}
export const getClassrooms = async (gradeId?: string): Promise<Classroom[]> => {
  const url = gradeId ? `/classrooms?gradeId=${gradeId}` : '/classrooms';
  const response = await api.get(url);
  return response.data.data ? response.data.data : response.data;
};
export const createClassroom = async (data: Partial<Classroom>) => {
  const response = await api.post('/classrooms', data);
  return response.data;
};
export const deleteClassroom = async (id: string) => {
  const response = await api.delete(`/classrooms/${id}`);
  return response.data;
};
export const updateClassroom = async (id: string, data: Partial<Classroom>) => {
  const response = await api.patch(`/classrooms/${id}`, data);
  return response.data;
};
export const getClassroomCapacity = async (id: string, academicYearId?: string) => {
  const url = academicYearId ? `/classrooms/${id}/capacity?academicYearId=${academicYearId}` : `/classrooms/${id}/capacity`;
  const response = await api.get(url);
  return response.data;
};

// 5. Subjects
export interface Subject {
  id: string;
  code: string;
  name: string;
  minimumPassingGrade?: number;
}
export const getSubjects = async (): Promise<Subject[]> => {
  const response = await api.get('/subjects');
  return response.data.data ? response.data.data : response.data;
};
export const createSubject = async (data: Partial<Subject>) => {
  const response = await api.post('/subjects', data);
  return response.data;
};
export const deleteSubject = async (id: string) => {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
};
export const updateSubject = async (id: string, data: Partial<Subject>) => {
  const response = await api.patch(`/subjects/${id}`, data);
  return response.data;
};

// 6. Class Periods
export interface ClassPeriod {
  id: string;
  code: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}
export const getClassPeriods = async (): Promise<ClassPeriod[]> => {
  const response = await api.get('/class-periods');
  return response.data;
};
export const createClassPeriod = async (data: Partial<ClassPeriod>) => {
  const response = await api.post('/class-periods', data);
  return response.data;
};
export const deleteClassPeriod = async (id: string) => {
  const response = await api.delete(`/class-periods/${id}`);
  return response.data;
};
export const updateClassPeriod = async (id: string, data: Partial<ClassPeriod>) => {
  const response = await api.patch(`/class-periods/${id}`, data);
  return response.data;
};
