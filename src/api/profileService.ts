import api from './axios';

export interface Foundation {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  headerText?: string;
}

export interface School {
  id: string;
  foundationId?: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  principalName?: string;
  principalNip?: string;
  headerText?: string;
}

// ==========================
// FOUNDATION
// ==========================

export const getFoundation = async (): Promise<Foundation | null> => {
  const response = await api.get('/foundations/singleton');
  return response.data;
};

export const upsertFoundation = async (data: Partial<Foundation>): Promise<Foundation> => {
  const response = await api.put('/foundations/singleton', data);
  return response.data;
};

export const uploadFoundationLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/foundations/singleton/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ==========================
// SCHOOL
// ==========================

export const getSchool = async (): Promise<School | null> => {
  const response = await api.get('/schools/singleton');
  return response.data;
};

export const upsertSchool = async (data: Partial<School>): Promise<School> => {
  const response = await api.put('/schools/singleton', data);
  return response.data;
};

export const uploadSchoolLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/schools/singleton/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
