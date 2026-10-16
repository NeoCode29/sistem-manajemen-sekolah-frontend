import api from './axios';

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  date?: string;
  eventDate?: string;
  category?: string;
  level?: string; // e.g. "Sekolah", "Kabupaten", "Provinsi", "Nasional", "Internasional"
  rank?: string; // e.g. "Juara 1", "Medali Emas"
  points?: number;
  student?: any;
}

export interface ViolationType {
  id: string;
  code: string;
  name: string;
  category: string;
  points: number;
  description?: string;
  isActive?: boolean;
}

export interface Violation {
  id: string;
  studentId: string;
  violationTypeId?: string | null;
  title?: string;
  category?: string;
  actionTaken?: string;
  violationDate: string;
  points: number;
  notes?: string;
  student?: {
    id: string;
    fullName: string;
    nis: string;
    classroomName?: string | null;
  };
  violationType?: ViolationType | null;
  recordedBy?: {
    id: string;
    fullName: string;
    employeeNumber?: string;
  } | null;
  academicYear?: {
    id: string;
    name: string;
  } | null;
}

// ==========================
// ACHIEVEMENTS
// ==========================
export const getAchievements = async (params?: Record<string, any>): Promise<Achievement[]> => {
  const response = await api.get('/achievements', { params });
  return response.data;
};

export const createAchievement = async (data: Partial<Achievement>): Promise<Achievement> => {
  const response = await api.post('/achievements', data);
  return response.data;
};

export const updateAchievement = async (id: string, data: Partial<Achievement>): Promise<Achievement> => {
  const response = await api.patch(`/achievements/${id}`, data);
  return response.data;
};

export const deleteAchievement = async (id: string): Promise<void> => {
  await api.delete(`/achievements/${id}`);
};

// ==========================
// VIOLATIONS
// ==========================
export const getViolations = async (params?: Record<string, any>): Promise<Violation[]> => {
  const response = await api.get('/student-violations', { params });
  return response.data;
};

export const createViolation = async (data: Partial<Violation>): Promise<Violation> => {
  const response = await api.post('/student-violations', data);
  return response.data;
};

export const updateViolation = async (id: string, data: Partial<Violation>): Promise<Violation> => {
  const response = await api.patch(`/student-violations/${id}`, data);
  return response.data;
};

export const deleteViolation = async (id: string): Promise<void> => {
  await api.delete(`/student-violations/${id}`);
};

// ==========================
// VIOLATION TYPES (KAMUS TATA TERTIB)
// ==========================
export const getViolationTypes = async (params?: Record<string, any>): Promise<ViolationType[]> => {
  const response = await api.get('/violation-types', { params });
  return response.data;
};

export const createViolationType = async (data: Partial<ViolationType>): Promise<ViolationType> => {
  const response = await api.post('/violation-types', data);
  return response.data;
};

export const updateViolationType = async (id: string, data: Partial<ViolationType>): Promise<ViolationType> => {
  const response = await api.patch(`/violation-types/${id}`, data);
  return response.data;
};

export const deleteViolationType = async (id: string): Promise<void> => {
  await api.delete(`/violation-types/${id}`);
};

// ==========================
// POINTS SUMMARY & SP STATUS
// ==========================
export interface StudentPointsSummary {
  studentId: string;
  studentName: string;
  nis: string;
  academicYearId: string;
  totalAchievementPoints: number;
  totalViolationPoints: number;
  netPoints: number;
  spStatus: 'SAFE' | 'WARNING_SP1' | 'WARNING_SP2' | 'DANGER_SP3' | string;
  spRecommendation: string;
}

export const getStudentPointsSummary = async (studentId: string, academicYearId?: string): Promise<StudentPointsSummary> => {
  const response = await api.get(`/students/${studentId}/points-summary`, { params: { academicYearId } });
  return response.data;
};

