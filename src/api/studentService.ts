import api from './axios';

export interface OccupationRef {
  id: string;
  category?: string;
  name: string;
}

export interface GuardianUserAccount {
  id: string;
  username: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface StudentGuardian {
  id?: string | number;
  studentId?: string | number;
  relationship: string;
  fullName: string;
  nationalId?: string;
  nik?: string;
  birthYear?: number;
  isAlive?: boolean;
  education?: string;
  occupationId?: string | number | null;
  occupationRef?: OccupationRef;
  occupation?: string;
  monthlyIncome?: string;
  specialNeeds?: string;
  phone?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  userAccount?: GuardianUserAccount | null;
}

export interface StudentEnrollment {
  id?: string;
  studentId?: string;
  academicYearId: string;
  semesterId: string;
  classroomId?: string;
  enrollmentDate?: string;
  status?: string;
  classroom?: any;
  academicYear?: any;
  semester?: any;
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  fingerId?: string;
  cardId?: string;
  majorId?: string;
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
  phone?: string;
  email?: string;
  isActive?: boolean;
  major?: any;
  users?: { id: string; isActive: boolean }[];
  guardians?: StudentGuardian[];
  enrollments?: StudentEnrollment[];

  // Dapodik Kependudukan & Dokumen
  nik?: string;
  noKk?: string;
  birthCertNo?: string;

  // Periodik Fisik & Kesehatan
  heightCm?: number;
  weightKg?: number;
  headCircumferenceCm?: number;
  bloodType?: string;
  specialNeeds?: string;
  illnessHistory?: string;

  // Alamat & Wilayah Terstruktur
  rt?: string;
  rw?: string;
  subVillage?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  // Transportasi & Jarak Tempuh
  transportation?: string;
  distanceToSchoolKm?: number;
  travelTimeMinutes?: number;

  // Asal Sekolah & Ijazah
  previousSchoolNpsn?: string;
  previousSchoolName?: string;
  diplomaNumber?: string;
  skhunNumber?: string;
  examParticipantNumber?: string;

  // Kesejahteraan Siswa (KIP / PIP / KPS)
  kipNumber?: string;
  kpsNumber?: string;
  pipEligible?: boolean;
  pipReason?: string;
}

export interface CreateStudentWizardPayload {
  nis: string;
  nisn?: string;
  fullName: string;
  gender: string;
  status: string;
  majorId?: string;
  guardians: StudentGuardian[];
  enrollment: StudentEnrollment;
  createUserAccount?: boolean;
}

// ==========================================
// STUDENTS
// ==========================================
export const getStudents = async (params?: Record<string, any>): Promise<Student[]> => {
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

export const createGuardianAccount = async (
  guardianId: string | number,
  data: { username: string; password: string; name?: string }
): Promise<GuardianUserAccount> => {
  const response = await api.post(`/users/guardian/${guardianId}`, data);
  return response.data;
};

export const resetGuardianPassword = async (
  guardianId: string | number,
  data: { newPassword: string }
): Promise<{ message: string; userId: string; username: string }> => {
  const response = await api.post(`/users/guardian/${guardianId}/reset-password`, data);
  return response.data;
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

// ==========================================
// IMPORT & EXPORT EXCEL
// ==========================================
export const exportStudents = async (params?: Record<string, any>): Promise<Blob> => {
  const response = await api.get('/students/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const downloadImportTemplate = async (): Promise<void> => {
  const response = await api.get('/students/import-template', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Template-Import-Siswa.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const importStudents = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDeletedStudents = async (params?: any): Promise<any> => {
  const response = await api.get('/students/trash', { params });
  return response.data;
};

export const restoreStudent = async (id: string): Promise<any> => {
  const response = await api.post(`/students/${id}/restore`);
  return response.data;
};
