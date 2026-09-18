import api from './axios';

export interface Permission {
  id: string | number;
  name: string;
  guardName: string;
}

export interface Role {
  id: string | number;
  name: string;
  guardName: string;
  permissions?: Permission[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  isActive: boolean;
  roles?: { id: string | number; name: string }[];
}

// Permissions
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await api.get('/permissions');
  return response.data;
};

export const createPermission = async (data: { name: string; guardName: string }) => {
  const response = await api.post('/permissions', data);
  return response.data;
};

export const updatePermission = async (id: string | number, data: { name?: string; guardName?: string }) => {
  const response = await api.patch(`/permissions/${id}`, data);
  return response.data;
};

export const deletePermission = async (id: string | number) => {
  const response = await api.delete(`/permissions/${id}`);
  return response.data;
};

// Roles
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get('/roles');
  return response.data;
};

export const createRole = async (data: { name: string; guardName: string }) => {
  const response = await api.post('/roles', data);
  return response.data;
};

export const updateRole = async (id: string | number, data: { name?: string; guardName?: string }) => {
  const response = await api.patch(`/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id: string | number) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

export const assignPermissionsToRole = async (roleId: string | number, permissionIds: (string | number)[]) => {
  const response = await api.put(`/roles/${roleId}/permissions`, { 
    permissionIds: (permissionIds || []).map(String) 
  });
  return response.data;
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (data: any) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const assignRolesToUser = async (userId: string, roleIds: (string | number)[]) => {
  const response = await api.put(`/users/${userId}/roles`, { roleIds: roleIds.map(String) });
  return response.data;
};
