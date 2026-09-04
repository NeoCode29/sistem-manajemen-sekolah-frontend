import api from './axios';

export interface RegisterIdentityDto {
  cardId?: string | null;
  fingerId?: string | null;
}

export interface HardwareLog {
  id: string;
  deviceId?: string;
  scanType: string;
  scanValue: string;
  status: string;
  attendableType?: string;
  attendableId?: string;
  message?: string;
  createdAt: string;
}

export const registerStudentIdentity = async (studentId: string, data: RegisterIdentityDto) => {
  const response = await api.put(`/hardware/register/student/${studentId}`, data);
  return response.data;
};

export const registerEmployeeIdentity = async (employeeId: string, data: RegisterIdentityDto) => {
  const response = await api.put(`/hardware/register/employee/${employeeId}`, data);
  return response.data;
};

export const getRecentScans = async (deviceId?: string, scanType?: string, limit: number = 10) => {
  const params: any = { limit };
  if (deviceId) params.deviceId = deviceId;
  if (scanType) params.scanType = scanType;
  
  const response = await api.get('/hardware/logs/recent', { params });
  return response.data;
};

export const getScanLogs = async (params?: Record<string, any>) => {
  const response = await api.get('/hardware/logs', { params });
  return response.data;
};
