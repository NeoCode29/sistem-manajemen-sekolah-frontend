import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/employeeService';
import type { Employee, CreateEmployeePayload } from '../api/employeeService';
import { notify, parseApiError } from '../utils/feedback';

export function useEmployees(filter?: { page?: number; limit?: number; search?: string; positionId?: string; isDeleted?: boolean }) {
  const [items, setItems] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // use stringified filter to stabilize dependency
  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedFilter = filterKey ? JSON.parse(filterKey) : {};
      const { isDeleted, ...apiParams } = parsedFilter;

      let response;
      if (isDeleted) {
        response = await api.getDeletedEmployees(apiParams);
      } else {
        response = await api.getEmployeesPaginated(apiParams);
      }
      setItems(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to load employees', err);
      const errMsg = parseApiError(err, 'Gagal memuat daftar pegawai');
      setError(errMsg);
      notify.error(err, 'Gagal memuat daftar pegawai');
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  return {
    items,
    meta,
    loading,
    error,
    create: async (dto: CreateEmployeePayload) => {
      try {
        await api.createEmployee(dto);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal mendaftarkan pegawai baru'));
      }
    },
    update: async (id: string, dto: Partial<Employee>) => {
      try {
        await api.updateEmployee(id, dto);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal memperbarui data pegawai'));
      }
    },
    remove: async (id: string) => {
      try {
        await api.deleteEmployee(id);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal mengarsipkan data pegawai'));
      }
    },
    restore: async (id: string) => {
      try {
        await api.restoreEmployee(id);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal memulihkan data pegawai'));
      }
    },
    load,
  };
}
