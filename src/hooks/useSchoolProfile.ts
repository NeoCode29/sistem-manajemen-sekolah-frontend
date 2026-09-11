import { useState, useCallback, useEffect } from 'react';
import * as api from '../api/schoolProfileService';
import type { SchoolProfile } from '../api/schoolProfileService';
import { getErrorMessage } from '../utils/errorHandler';

export function useSchoolProfile() {
  const [profile, setProfile] = useState<Partial<SchoolProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | string[]>('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const data = await api.getSchoolProfile();
      if (data) {
        setProfile(data);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err, 'Gagal memuat profil sekolah'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (payload: Partial<SchoolProfile>) => {
    setSaving(true);
    clearMessages();
    try {
      await api.updateSchoolProfile(payload);
      setSuccess('Profil sekolah berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err: any) {
      setError(getErrorMessage(err, 'Gagal menyimpan profil sekolah'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setSaving(true);
    clearMessages();
    try {
      const response = await api.uploadSchoolLogo(file);
      if (response && response.logoUrl) {
        setProfile(prev => ({ ...prev, logoUrl: response.logoUrl }));
        setSuccess('Logo berhasil diunggah!');
        setTimeout(() => setSuccess(''), 3000);
        return response.logoUrl;
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Gagal mengunggah logo sekolah'));
    } finally {
      setSaving(false);
    }
    return null;
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    clearMessages();
    try {
      const data = await api.downloadTemplateDocx();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Template_Kop_Surat_${profile.name?.replace(/\s+/g, '_') || 'Sekolah'}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Template berhasil diunduh!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Gagal mengunduh template docx');
    } finally {
      setDownloading(false);
    }
  };

  return {
    profile,
    setProfile,
    loading,
    saving,
    downloading,
    error,
    success,
    loadProfile,
    updateProfile,
    uploadLogo,
    downloadTemplate,
    clearMessages
  };
}
