import api from './axios';

export interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  positionId: string;
  employeeNumber: string;
  nationalId?: string;
  fingerId?: string;
  cardId?: string;
  fullName: string;
  gender?: string;
  birthPlace?: string;
  birthDate?: string;
  religion?: string;
  maritalStatus?: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  lastDegree?: string;
  institution?: string;
  major?: string;
  hireDate?: string;
  employmentType?: string;
  employmentStatus?: string;
  signatureUrl?: string;
  isActive: boolean;
  position?: Position;
  deletedAt?: string;
}

export type CreateEmployeePayload = Partial<Employee> & {
  createAccount?: boolean;
  username?: string;
  password?: string;
  roleId?: number | string;
};

// ==========================================
// POSITIONS
// ==========================================
export const getPositions = async (isActive?: boolean): Promise<Position[]> => {
  const params = isActive !== undefined ? { isActive } : {};
  const response = await api.get('/positions', { params });
  return response.data.data ? response.data.data : response.data;
};

export const createPosition = async (data: Partial<Position>): Promise<Position> => {
  const response = await api.post('/positions', data);
  return response.data;
};

export const updatePosition = async (id: string, data: Partial<Position>): Promise<Position> => {
  const response = await api.patch(`/positions/${id}`, data);
  return response.data;
};

export const deletePosition = async (id: string): Promise<void> => {
  await api.delete(`/positions/${id}`);
};

// ==========================================
// EMPLOYEES
// ==========================================
export const getEmployees = async (params?: Record<string, any>): Promise<Employee[]> => {
  const response = await api.get('/employees', { params });
  return response.data.data ? response.data.data : response.data;
};

export const getEmployeesPaginated = async (params?: Record<string, any>): Promise<{ data: Employee[], meta: any }> => {
  const response = await api.get('/employees', { params });
  return response.data;
};

export const createEmployee = async (data: CreateEmployeePayload) => {
  const response = await api.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
  const response = await api.patch(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await api.delete(`/employees/${id}`);
};

export const uploadSignature = async (id: string, file: File): Promise<Employee> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/employees/${id}/signature`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
