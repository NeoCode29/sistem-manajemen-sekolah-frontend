import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/studentService';
import type { Student, CreateStudentWizardPayload } from '../api/studentService';

export function useStudents(filter?: { page?: number; limit?: number; search?: string; status?: string; isDeleted?: boolean }) {
  const [items, setItems] = useState<Student[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const parsedFilter = filterKey ? JSON.parse(filterKey) : {};
      const { isDeleted, ...apiParams } = parsedFilter;
      
      let response;
      if (isDeleted) {
        response = await api.getDeletedStudents(apiParams);
      } else {
        response = await api.getStudentsPaginated(apiParams);
      }
      setItems(response.data);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to load students', err);
    } finally {
      setLoading(false);
    }
  }, [filterKey]);

  useEffect(() => { load(); }, [load]);

  return {
    items,
    meta,
    loading,
    createWizard: async (dto: CreateStudentWizardPayload) => { await api.createStudentWizard(dto); await load(); },
    restore: async (id: string) => { await api.restoreStudent(id); await load(); },
    remove: async (id: string) => { await api.deleteStudent(id); await load(); },
    load
  };
}
