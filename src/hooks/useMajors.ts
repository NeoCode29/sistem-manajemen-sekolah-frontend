import { useState, useEffect, useCallback } from 'react';
import * as academicService from '../api/academicService';
import { useDialog } from '../contexts/DialogContext';

export const useMajors = () => {
  const [majors, setMajors] = useState<academicService.Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showAlert } = useDialog();

  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await academicService.getMajors();
      setMajors(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jurusan');
      showAlert(err.message || 'Gagal memuat data jurusan', 'Gagal');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const createMajor = async (data: Partial<academicService.Major>) => {
    try {
      await academicService.createMajor(data);
      await fetchMajors();
      showAlert('Data jurusan berhasil ditambahkan', 'Sukses');
    } catch (err: any) {
      throw err;
    }
  };

  const updateMajor = async (id: string, data: Partial<academicService.Major>) => {
    try {
      await academicService.updateMajor(id, data);
      await fetchMajors();
      showAlert('Data jurusan berhasil diperbarui', 'Sukses');
    } catch (err: any) {
      throw err;
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await academicService.toggleMajorActive(id);
      await fetchMajors();
      showAlert('Status jurusan berhasil diubah', 'Sukses');
    } catch (err: any) {
      showAlert(err.message || 'Gagal mengubah status jurusan', 'Gagal');
    }
  };

  const deleteMajor = async (id: string) => {
    try {
      await academicService.deleteMajor(id);
      await fetchMajors();
      showAlert('Data jurusan berhasil dihapus', 'Sukses');
    } catch (err: any) {
      throw err;
    }
  };

  return {
    majors,
    loading,
    error,
    createMajor,
    updateMajor,
    toggleActive,
    deleteMajor,
    refresh: fetchMajors
  };
};
