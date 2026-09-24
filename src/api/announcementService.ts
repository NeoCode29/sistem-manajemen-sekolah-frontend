import api from './axios';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  isPinned: boolean;
  isActive: boolean;
  publishDate: string;
  expireDate?: string | null;
  posterUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    username: string;
    name: string;
  };
}

export const getAnnouncements = async (params?: Record<string, any>) => {
  const response = await api.get('/announcements', { params });
  return response.data;
};

export const getMyAnnouncements = async () => {
  const response = await api.get('/announcements/my');
  return response.data;
};

export const createAnnouncement = async (data: FormData | Partial<Announcement>) => {
  const isFormData = data instanceof FormData;
  const response = await api.post('/announcements', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const updateAnnouncement = async (id: string, data: FormData | Partial<Announcement>) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/announcements/${id}`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
};

export const deleteAnnouncement = async (id: string) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};
