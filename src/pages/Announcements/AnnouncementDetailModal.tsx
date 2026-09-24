import React from 'react';
import { Modal, Badge, type BadgeVariant } from '../../components/ui';
import type { Announcement } from '../../api/announcementService';
import { 
  Pin, 
  Calendar, 
  Users, 
  User, 
  FileText, 
  Download, 
  ExternalLink, 
  Maximize2 
} from 'lucide-react';

interface AnnouncementDetailModalProps {
  announcement: Announcement | null;
  open: boolean;
  onClose: () => void;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  open,
  onClose,
}) => {
  if (!announcement) return null;

  const getTargetBadgeVariant = (target?: string): BadgeVariant => {
    switch (target) {
      case 'SISWA': return 'success';
      case 'GURU': return 'info';
      case 'STAFF': return 'warning';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Base URL server
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
  const posterFullUrl = announcement.posterUrl ? `${apiBaseUrl}${announcement.posterUrl}` : null;
  const attachmentFullUrl = announcement.attachmentUrl ? `${apiBaseUrl}${announcement.attachmentUrl}` : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Pengumuman"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Header Info */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getTargetBadgeVariant(announcement.targetAudience)}>
              <span className="flex items-center gap-1">
                <Users size={12} />
                {announcement.targetAudience || 'SEMUA'}
              </span>
            </Badge>

            <Badge variant={announcement.isActive ? 'success' : 'default'}>
              {announcement.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>

            {announcement.isPinned && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Pin size={11} className="fill-amber-500 text-amber-500" /> Disematkan di Atas
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
            {announcement.title}
          </h2>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              Mulai: {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>

            {announcement.expireDate && (
              <span className="flex items-center gap-1.5 text-rose-600">
                <Calendar size={13} />
                Berakhir: {new Date(announcement.expireDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              Diposkan oleh: <strong className="text-slate-700">{announcement.createdBy?.name || announcement.createdBy?.username || 'Staf Admin'}</strong>
            </span>
          </div>
        </div>

        {/* Poster Banner (Jika ada) */}
        {posterFullUrl && (
          <div className="space-y-2">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm max-h-[380px] flex items-center justify-center">
              <img
                src={posterFullUrl}
                alt={announcement.title}
                className="w-full h-auto max-h-[380px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <a
                href={posterFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md opacity-90 group-hover:opacity-100"
              >
                <Maximize2 size={13} />
                Buka Gambar Penuh
              </a>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="prose max-w-none text-slate-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-normal">
          {announcement.content}
        </div>

        {/* Dokumen Lampiran (SK / Berita Acara / Dokumen Resmi) */}
        {attachmentFullUrl && (
          <div className="p-4 md:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-between gap-4 flex-wrap shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                <FileText size={24} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate" title={announcement.attachmentName || 'Berkas Lampiran'}>
                  {announcement.attachmentName || 'Dokumen Resmi Lampiran'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Berkas Dokumen</span>
                  {announcement.attachmentSize && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{formatFileSize(announcement.attachmentSize)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={attachmentFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all hover:-translate-y-0.5"
              >
                <Download size={14} />
                Unduh / Buka Berkas
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-std-secondary px-6"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
