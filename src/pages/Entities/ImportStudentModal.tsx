import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { downloadImportTemplate, importStudents } from '../../api/studentService';
import { Modal } from '../../components/ui/Modal';

interface ImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportStudentModal: React.FC<ImportStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      await downloadImportTemplate();
    } catch (err) {
      console.error('Failed to download template', err);
      setError('Gagal mengunduh template');
    }
  };

  const handleUpload = async () => {
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
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mengimport data');
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
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <AlertCircle size={18} /> Petunjuk Import:
              </h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>Unduh template Excel terbaru (berisi dropdown validasi data Jurusan dan Kelas).</li>
                <li>Isi data siswa pada template tersebut. Kolom wajib harus diisi.</li>
                <li>Upload kembali file Excel yang sudah diisi.</li>
                <li>Jika NIS sudah ada, data akan diupdate (Upsert).</li>
              </ol>
              <button
                onClick={handleDownloadTemplate}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-colors text-sm font-medium"
              >
                <Download size={16} /> Download Template Excel
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <label className="block">
                <span className="sr-only">Pilih file Excel</span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 cursor-pointer"
                />
              </label>
              {file && (
                <p className="mt-3 text-sm text-slate-600">File terpilih: <span className="font-semibold text-slate-800">{file.name}</span></p>
              )}
            </div>

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
