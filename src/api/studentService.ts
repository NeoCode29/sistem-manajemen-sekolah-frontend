import api from './axios';

export interface StudentGuardian {
  id?: string;
  studentId?: string;
  relationship: string;
  fullName: string;
  nationalId?: string;
  occupation?: string;
  phone?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface StudentEnrollment {
  id?: string;
  studentId?: string;
  academicYearId: string;
  semesterId: string;
  classroomId?: string;
  enrollmentDate?: string;
  status?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  fingerId?: string;
  cardId?: string;
  fullName: string;
  gender: string;
  birthPlace?: string;
  birthDate?: string;
  religion?: string;
  nationality?: string;
  address?: string;
  status: string;
  admissionDate?: string;
  photo?: string;
  isActive?: boolean;
  users?: { id: string; isActive: boolean }[];
  guardians?: StudentGuardian[];
  enrollments?: StudentEnrollment[];
}

export interface CreateStudentWizardPayload {
  nis: string;
  nisn?: string;
  fullName: string;
  gender: string;
  status: string;
  guardians: StudentGuardian[];
  enrollment: StudentEnrollment;
  createUserAccount?: boolean;
}

// ==========================================
// STUDENTS
// ==========================================
export const getStudents = async (params?: Record<string, any>): Promise<{ data: Student[], meta?: any } | Student[]> => {
  const response = await api.get('/students', { params });
  return response.data.data || response.data;
};

export const getStudentsPaginated = async (params?: Record<string, any>): Promise<{ data: Student[], meta: any }> => {
  const response = await api.get('/students', { params });
  return response.data;
};

export const getStudentById = async (id: string): Promise<Student> => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const createStudentWizard = async (data: CreateStudentWizardPayload): Promise<Student> => {
  const response = await api.post('/students/wizard', data);
  return response.data;
};

export const updateStudent = async (id: string, data: Partial<Student>): Promise<Student> => {
  const response = await api.patch(`/students/${id}`, data);
  return response.data;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await api.delete(`/students/${id}`);
};

// ==========================================
// STUDENT GUARDIANS
// ==========================================
export const getGuardians = async (studentId: string): Promise<StudentGuardian[]> => {
  const response = await api.get(`/students/${studentId}/guardians`);
  return response.data;
};

export const createGuardian = async (studentId: string, data: Partial<StudentGuardian>): Promise<StudentGuardian> => {
  const response = await api.post(`/students/${studentId}/guardians`, data);
  return response.data;
};

export const updateGuardian = async (studentId: string, id: string, data: Partial<StudentGuardian>): Promise<StudentGuardian> => {
  const response = await api.patch(`/students/${studentId}/guardians/${id}`, data);
  return response.data;
};

export const deleteGuardian = async (studentId: string, id: string): Promise<void> => {
  await api.delete(`/students/${studentId}/guardians/${id}`);
};

// ==========================================
// STUDENT ENROLLMENTS
// ==========================================
export const createEnrollment = async (studentId: string, data: Partial<StudentEnrollment>): Promise<StudentEnrollment> => {
  const response = await api.post(`/students/${studentId}/enrollments`, data);
  return response.data;
};

export const updateEnrollment = async (studentId: string, id: string, data: Partial<StudentEnrollment>): Promise<StudentEnrollment> => {
  const response = await api.patch(`/students/${studentId}/enrollments/${id}`, data);
  return response.data;
};

export const deleteEnrollment = async (studentId: string, id: string): Promise<void> => {
  await api.delete(`/students/${studentId}/enrollments/${id}`);
};
