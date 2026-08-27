import { useState, useCallback } from 'react';
import api from '../api/axios';

export interface ReportCard {
  id: string;
  studentId: string;
  classroomId: string;
  academicYearId: string;
  semesterId: string;
  sickDays: number;
  excusedDays: number;
  unexcusedDays: number;
  homeroomNotes: string | null;
  isPromoted: boolean | null;
  promotedToGrade: string | null;
  student: { id: string; fullName: string; nis: string };
}

export const useReportCards = () => {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportCards = useCallback(async (params: { classroomId?: string; studentId?: string; academicYearId?: string; semesterId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assessment/report-cards', { params });
      const responseData = response.data;
      setReportCards(Array.isArray(responseData) ? responseData : responseData?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch report cards');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReportCards = async (data: { classroomId: string; academicYearId: string; semesterId: string }) => {
    setLoading(true);
    try {
      await api.post('/assessment/report-cards/generate', data);
      await fetchReportCards({ classroomId: data.classroomId, academicYearId: data.academicYearId, semesterId: data.semesterId });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report cards');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHomeroomNotes = async (id: string, data: { sickDays: number; excusedDays: number; unexcusedDays: number; homeroomNotes: string; isPromoted?: boolean }) => {
    try {
      await api.patch(`/assessment/report-cards/${id}/notes`, data);
      setReportCards(prev => prev.map(rc => rc.id === id ? { ...rc, ...data } : rc));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update notes');
      throw err;
    }
  };

  const exportPdf = async (id: string, studentName: string) => {
    try {
      const response = await api.get(`/assessment/report-cards/${id}/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapor-${studentName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengunduh PDF');
    }
  };

  return { reportCards, loading, error, fetchReportCards, generateReportCards, updateHomeroomNotes, exportPdf };
};
