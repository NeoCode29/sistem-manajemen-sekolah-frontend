import api from './axios';

// Interfaces
export interface IncomingLetter {
  id: string;
  referenceNumber: string;
  sender: string;
  subject: string;
  receivedDate: string;
  letterDate: string;
  fileUrl?: string;
  description?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  code: string;
  content: string; // HTML or Text with placeholders
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutgoingLetter {
  id: string;
  referenceNumber: string;
  recipient: string;
  subject: string;
  status: string; // DRAFT, PENDING_APPROVAL, APPROVED, SENT, REJECTED
  content?: string;
  variables?: any;
  templateId?: string;
  fileUrl?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  template?: LetterTemplate;
}

// INCOMING LETTERS
export const getIncomingLetters = async (params?: Record<string, any>) => {
  const response = await api.get('/letters/incoming', { params });
  return response.data;
};

export const getIncomingLetterById = async (id: string) => {
  const response = await api.get(`/letters/incoming/${id}`);
  return response.data;
};

export const createIncomingLetter = async (data: Partial<IncomingLetter>) => {
  const response = await api.post('/letters/incoming', data);
  return response.data;
};

export const updateIncomingLetter = async (id: string, data: Partial<IncomingLetter>) => {
  const response = await api.put(`/letters/incoming/${id}`, data);
  return response.data;
};

export const deleteIncomingLetter = async (id: string) => {
  const response = await api.delete(`/letters/incoming/${id}`);
  return response.data;
};

export const uploadIncomingLetterFile = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/letters/incoming/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// OUTGOING LETTERS
export const getOutgoingLetters = async (params?: Record<string, any>) => {
  const response = await api.get('/letters/outgoing', { params });
  return response.data;
};

export const getOutgoingLetterById = async (id: string) => {
  const response = await api.get(`/letters/outgoing/${id}`);
  return response.data;
};

export const createOutgoingLetter = async (data: Partial<OutgoingLetter>) => {
  const response = await api.post('/letters/outgoing', data);
  return response.data;
};

export const updateOutgoingLetter = async (id: string, data: Partial<OutgoingLetter>) => {
  const response = await api.put(`/letters/outgoing/${id}`, data);
  return response.data;
};

export const deleteOutgoingLetter = async (id: string) => {
  const response = await api.delete(`/letters/outgoing/${id}`);
  return response.data;
};

export const updateOutgoingLetterStatus = async (id: string, status: string) => {
  const response = await api.patch(`/letters/outgoing/${id}/status`, { status });
  return response.data;
};

export const generateOutgoingLetterDocument = async (id: string) => {
  const response = await api.post(`/letters/outgoing/${id}/generate`);
  return response.data;
};

// LETTER TEMPLATES
export const getLetterTemplates = async (params?: Record<string, any>) => {
  const response = await api.get('/letters/templates', { params });
  return response.data;
};

export const createLetterTemplate = async (data: Partial<LetterTemplate>) => {
  const response = await api.post('/letters/templates', data);
  return response.data;
};

export const updateLetterTemplate = async (id: string, data: Partial<LetterTemplate>) => {
  const response = await api.put(`/letters/templates/${id}`, data);
  return response.data;
};

export const deleteLetterTemplate = async (id: string) => {
  const response = await api.delete(`/letters/templates/${id}`);
  return response.data;
};
