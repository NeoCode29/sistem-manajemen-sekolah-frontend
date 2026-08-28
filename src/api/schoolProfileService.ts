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
  city?: string;
  logoUrl?: string;
  principalSignatureUrl?: string;
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

export const uploadSchoolSignature = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/schools/singleton/signature', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadTemplateDocx = async () => {
  const response = await api.get('/schools/template-docx', {
    responseType: 'blob',
  });
  return response.data;
};
