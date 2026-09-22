import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/studentService';
import type { Student, CreateStudentWizardPayload } from '../api/studentService';
import { notify, parseApiError } from '../utils/feedback';

export function useStudents(filter?: { page?: number; limit?: number; search?: string; status?: string; isDeleted?: boolean }) {
  const [items, setItems] = useState<Student[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sanitizedFilter = {
    page: filter?.page,
    limit: filter?.limit,
    search: typeof filter?.search === 'string' ? filter.search : undefined,
    status: typeof filter?.status === 'string' ? filter.status : undefined,
    isDeleted: Boolean(filter?.isDeleted)
  };

  const filterKey = JSON.stringify(sanitizedFilter);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      const errMsg = parseApiError(err, 'Gagal memuat daftar siswa');
      setError(errMsg);
      notify.error(err, 'Gagal memuat daftar siswa');
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
    createWizard: async (dto: CreateStudentWizardPayload) => {
      try {
        await api.createStudentWizard(dto);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal mendaftarkan siswa baru'));
      }
    },
    restore: async (id: string) => {
      try {
        await api.restoreStudent(id);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal memulihkan siswa'));
      }
    },
    remove: async (id: string) => {
      try {
        await api.deleteStudent(id);
        await load();
      } catch (err) {
        throw new Error(parseApiError(err, 'Gagal menghapus siswa'));
      }
    },
    load
  };
}
