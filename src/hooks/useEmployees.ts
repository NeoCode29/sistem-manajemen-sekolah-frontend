import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/employeeService';
import type { Employee, CreateEmployeePayload } from '../api/employeeService';

export function useEmployees(filter?: { page?: number; limit?: number; search?: string; positionId?: string; isDeleted?: boolean }) {
  const [items, setItems] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // use stringified filter to stabilize dependency
  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  return {
    items,
    meta,
    loading,
    create: async (dto: CreateEmployeePayload) => { await api.createEmployee(dto); await load(); },
    update: async (id: string, dto: Partial<Employee>) => { await api.updateEmployee(id, dto); await load(); },
    remove: async (id: string) => { await api.deleteEmployee(id); await load(); },
    restore: async (id: string) => { await api.restoreEmployee(id); await load(); },
    load,
  };
}
