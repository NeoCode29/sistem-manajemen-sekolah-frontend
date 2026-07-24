import api from './axios';

export interface SchoolProfile {
  id?: string;
  code: string; // NPSN
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  principalName?: string;
  principalNip?: string;
  headerText?: string;
  logoUrl?: string;
}

export interface FoundationProfile {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  headerText?: string;
  logoUrl?: string;
}

export const getSchoolProfile = async () => {
  const response = await api.get('/schools/singleton');
  return response.data;
};

export const updateSchoolProfile = async (data: Partial<SchoolProfile>) => {
  const response = await api.put('/schools/singleton', data);
  return response.data;
};

export const uploadSchoolLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/schools/singleton/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getFoundationProfile = async () => {
  const response = await api.get('/foundations/singleton');
  return response.data;
};

export const updateFoundationProfile = async (data: Partial<FoundationProfile>) => {
  const response = await api.put('/foundations/singleton', data);
  return response.data;
};

export const uploadFoundationLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/foundations/singleton/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
