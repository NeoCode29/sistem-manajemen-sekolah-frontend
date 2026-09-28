import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import { downloadImportTemplate, importStudents } from '../../api/studentService';
import { Modal } from '../../components/ui/Modal';
import { usePermissions } from '../../hooks/usePermissions';
import { parseApiError } from '../../utils/feedback';

interface ImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportStudentModal: React.FC<ImportStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canImportExportStudent } = usePermissions();

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    if (!canImportExportStudent) {
      setError('Anda tidak memiliki izin untuk mengunduh template import siswa.');
      return;
    }
    try {
      await downloadImportTemplate();
    } catch (err) {
      console.error('Failed to download template', err);
      setError(parseApiError(err, 'Gagal mengunduh template'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Harap pilih file dengan format Excel (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.xlsx')) {
        setError('Harap pilih file dengan format Excel (.xlsx)');
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async () => {
    if (!canImportExportStudent) {
      setError('Anda tidak memiliki izin untuk mengimpor data siswa.');
      return;
    }
    if (!file) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const res = await importStudents(file);
      setResult(res);
      if (res.totalSuccess > 0) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error', err);
      setError(parseApiError(err, 'Terjadi kesalahan saat mengimpor data'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Import Data Siswa (Excel)"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            className="btn-std-secondary"
            onClick={onClose}
          >
            {result ? 'Tutup' : 'Batal'}
          </button>
          {!result && (
            <button
              type="button"
              className="btn-std-primary flex items-center gap-2"
              onClick={handleUpload}
              disabled={isUploading || !file}
              style={{ opacity: (isUploading || !file) ? 0.6 : 1, cursor: (isUploading || !file) ? 'not-allowed' : 'pointer' }}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengupload...
                </>
              ) : (
                <>
                  <Upload size={18} /> Upload Data
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="relative p-6 flex-auto">
        {!result ? (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200/80 shadow-sm">
              <h4 className="font-semibold flex items-center gap-2 mb-2 text-indigo-950">
                <AlertCircle size={18} className="text-indigo-600" /> Petunjuk Import Data Siswa Dapodik:
              </h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-indigo-900 leading-relaxed">
                <li>
                  <strong>Unduh Template Excel Terbaru:</strong> Template dilengkapi 21 kolom standar Dapodik. Kolom wajib ditandai dengan warna header khusus dan label <em>(Wajib)</em>: <strong>NIS</strong>, <strong>Nama Lengkap</strong>, <strong>L/P</strong>, dan <strong>Status</strong>. Kolom kelas menggunakan <strong>Nama Kelas</strong> langsung (bukan kode), dan jurusan otomatis mengikuti kelas yang dipilih.
                </li>
                <li>
                  <strong>Dropdown Pilihan Otomatis:</strong> Kolom <strong>L/P</strong>, <strong>Status</strong>, <strong>Nama Kelas</strong>, <strong>Agama</strong>, <strong>Tempat Tinggal</strong>, dan <strong>Moda Transportasi</strong> telah dilengkapi dropdown validasi pilihan bawaan.
                </li>
                <li>
                  <strong>Format Angka Kependudukan:</strong> Kolom NIK, No KK, NISN, dan No Akta telah diformat otomatis sebagai teks agar angka 16 digit tidak berubah menjadi format eksponensial di Excel.
                </li>
                <li>
                  <strong>Mekanisme Upsert Pintar:</strong> Jika baris siswa dengan NIS yang sama sudah ada di database, profil kependudukan & alamat wilayahnya akan diperbarui secara otomatis.
                </li>
              </ol>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-all text-xs font-semibold cursor-pointer"
              >
                <Download size={15} /> Unduh Template Excel (Dapodik Lengkap)
              </button>
            </div>

            {/* Input file tersembunyi */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              /* Dropzone saat belum ada file */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01] shadow-inner'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/20 bg-white'
                }`}
              >
                <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-200">
                  <Upload size={26} className="text-indigo-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  Pilih atau Tarik File Excel ke Sini
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Klik di area ini untuk menelusuri file dari perangkat Anda
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 group-hover:bg-indigo-100/70 text-slate-600 group-hover:text-indigo-700 rounded-full text-[11px] font-medium transition-colors">
                  <FileSpreadsheet size={13} className="text-emerald-600" />
                  Format yang didukung: .xlsx (Maksimal 10MB)
                </div>
              </div>
            ) : (
              /* Preview file saat sudah dipilih */
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs transition-all duration-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {file.name}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Siap Diupload
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ukuran: {formatFileSize(file.size)} • Format Excel (.xlsx)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus file terpilih"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Hasil Import</h4>
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-700">{result.totalProcessed}</div>
                  <div className="text-sm text-slate-500">Diproses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{result.totalSuccess}</div>
                  <div className="text-sm text-green-600 font-medium">Berhasil</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{result.totalFailed}</div>
                  <div className="text-sm text-red-500 font-medium">Gagal</div>
                </div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                  <AlertCircle size={16} /> Detail Error ({result.errors.length})
                </h5>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Baris</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NIS</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {result.errors.map((err: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">{err.row}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-900">{err.nis || '-'}</td>
                          <td className="px-3 py-2 text-sm text-red-600">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
