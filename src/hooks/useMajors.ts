import { useState, useEffect, useCallback } from 'react';
import * as academicService from '../api/academicService';
import { parseApiError } from '../utils/feedback';

export const useMajors = () => {
  const [majors, setMajors] = useState<academicService.Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await academicService.getMajors();
      setMajors(data);
    } catch (err: any) {
      console.error('Failed to fetch majors:', err);
      setError(parseApiError(err, 'Gagal memuat data jurusan. Silakan periksa koneksi atau coba beberapa saat lagi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  const createMajor = async (data: Partial<academicService.Major>) => {
    try {
      await academicService.createMajor(data);
      await fetchMajors();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menambahkan jurusan baru.'));
    }
  };

  const updateMajor = async (id: string, data: Partial<academicService.Major>) => {
    try {
      await academicService.updateMajor(id, data);
      await fetchMajors();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal memperbarui data jurusan.'));
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await academicService.toggleMajorActive(id);
      await fetchMajors();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal mengubah status keaktifan jurusan.'));
    }
  };

  const deleteMajor = async (id: string) => {
    try {
      await academicService.deleteMajor(id);
      await fetchMajors();
    } catch (err: any) {
      throw new Error(parseApiError(err, 'Gagal menghapus data jurusan.'));
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
