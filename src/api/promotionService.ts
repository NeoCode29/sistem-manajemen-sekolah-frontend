import api from './axios';

// PROMOTIONS
export const getPromotions = async (params?: Record<string, any>) => {
  const response = await api.get('/promotions', { params });
  return response.data;
};

export const getPromotionById = async (id: string) => {
  const response = await api.get(`/promotions/${id}`);
  return response.data;
};

export const promoteStudent = async (data: any) => {
  const response = await api.post('/promotions', data);
  return response.data;
};

export const batchPromote = async (data: { academicYearId: string; sourceClassId: string; promotions: { studentId: string; targetClassId: string; status: string; notes?: string }[] }) => {
  const response = await api.post('/promotions/batch', data);
  return response.data;
};

export const cancelPromotion = async (id: string) => {
  const response = await api.patch(`/promotions/${id}/cancel`);
  return response.data;
};

// GRADUATIONS
export const getGraduations = async (params?: Record<string, any>) => {
  const response = await api.get('/graduations', { params });
  return response.data;
};

export const getGraduationById = async (id: string) => {
  const response = await api.get(`/graduations/${id}`);
  return response.data;
};

export const graduateStudent = async (data: any) => {
  const response = await api.post('/graduations/graduate', data);
  return response.data;
};

export const batchGraduate = async (data: { classId: string; graduationDate: string; documentNumber: string; studentIds: string[] }) => {
  const response = await api.post('/graduations/batch-graduate', data);
  return response.data;
};

export const updateGraduation = async (id: string, data: any) => {
  const response = await api.patch(`/graduations/${id}`, data);
  return response.data;
};

export const cancelGraduation = async (id: string) => {
  const response = await api.delete(`/graduations/${id}`);
  return response.data;
};
