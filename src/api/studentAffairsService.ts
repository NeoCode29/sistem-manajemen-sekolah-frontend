import api from './axios';

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  date: string;
  level?: string; // e.g. "Sekolah", "Kabupaten", "Provinsi", "Nasional", "Internasional"
  rank?: string; // e.g. "Juara 1", "Medali Emas"
  points?: number;
  student?: any;
}

export interface Violation {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  date: string;
  category?: string; // e.g. "Ringan", "Sedang", "Berat"
  points?: number; // penalty points
  actionTaken?: string;
  student?: any;
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
