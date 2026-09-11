import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, HelpCircle, X, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';
type DialogVariant = 'error' | 'warning' | 'info' | 'success';

interface DialogOptions {
  type: DialogType;
  variant?: DialogVariant;
  title?: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: any) => void;
  onCancel?: () => void;
}

interface DialogContextProps {
  showAlert: (message: string, title?: string, variant?: DialogVariant) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  showPrompt: (message: string, onConfirm: (value: string) => void, defaultValue?: string, title?: string) => void;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const handleGlobalAlert = (e: any) => {
      const { title, message, variant } = e.detail;
      setTimeout(() => {
        setDialog({ type: 'alert', title, message, variant });
      }, 100);
    };
    window.addEventListener('global-alert', handleGlobalAlert);
    return () => window.removeEventListener('global-alert', handleGlobalAlert);
  }, []);

  const detectVariant = (title?: string, message?: string, explicitVariant?: DialogVariant): DialogVariant => {
    if (explicitVariant) return explicitVariant;
    const text = `${title || ''} ${message || ''}`.toLowerCase();
    if (text.includes('error') || text.includes('gagal') || text.includes('tidak dapat') || text.includes('dilarang')) {
      return 'error';
    }
    if (text.includes('peringatan') || text.includes('perhatian') || text.includes('warning')) {
      return 'warning';
    }
    if (text.includes('sukses') || text.includes('berhasil') || text.includes('dipulihkan')) {
      return 'success';
    }
    return 'info';
  };

  const showAlert = (message: string, title = 'Perhatian', variant?: DialogVariant) => {
    const resolvedVariant = detectVariant(title, message, variant);
    setDialog({ type: 'alert', message, title, variant: resolvedVariant });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'Konfirmasi') => {
    const resolvedVariant = detectVariant(title, message, undefined);
    setDialog({ type: 'confirm', message, title, onConfirm, variant: resolvedVariant });
  };

  const showPrompt = (message: string, onConfirm: (value: string) => void, defaultValue = '', title = 'Input Diperlukan') => {
    setInputValue(defaultValue);
    setDialog({ type: 'prompt', message, title, onConfirm, defaultValue, variant: 'info' });
  };

  const handleClose = () => {
    if (dialog?.onCancel) dialog.onCancel();
    setDialog(null);
  };

  const handleConfirm = () => {
    if (dialog?.onConfirm) {
      if (dialog.type === 'prompt') {
        dialog.onConfirm(inputValue);
      } else {
        dialog.onConfirm();
      }
    }
    setDialog(null);
  };

  const renderIcon = () => {
    if (!dialog) return null;
    if (dialog.type === 'confirm') {
      const isDanger = dialog.title?.toLowerCase().includes('hapus') || dialog.message.toLowerCase().includes('hapus');
      return (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
          {isDanger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
        </div>
      );
    }
    if (dialog.variant === 'error') {
      return (
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
          <AlertCircle size={20} />
        </div>
      );
    }
    if (dialog.variant === 'warning') {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle size={20} />
        </div>
      );
    }
    if (dialog.variant === 'success') {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
        <Info size={20} />
      </div>
    );
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {dialog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(5px)' }}>
          <div className="modal-enter relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex items-center gap-3">
                {renderIcon()}
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {dialog.title}
                </h2>
              </div>
              <button type="button" className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" onClick={handleClose}>
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              {dialog.type === 'alert' && dialog.variant === 'error' ? (
                <div className="p-4 rounded-xl bg-red-50/80 border border-red-100 text-sm text-red-900 leading-relaxed">
                  <p className="font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    Detail Informasi:
                  </p>
                  <p className="text-red-700">{dialog.message}</p>
                </div>
              ) : dialog.type === 'alert' && dialog.variant === 'warning' ? (
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-100 text-sm text-amber-900 leading-relaxed">
                  <p className="font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                    Pemberitahuan:
                  </p>
                  <p className="text-amber-700">{dialog.message}</p>
                </div>
              ) : dialog.type === 'alert' && dialog.variant === 'success' ? (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 text-sm text-emerald-900 leading-relaxed">
                  <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                    Berhasil:
                  </p>
                  <p className="text-emerald-700">{dialog.message}</p>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed text-sm">{dialog.message}</p>
              )}
              
              {dialog.type === 'prompt' && (
                <input
                  type="text"
                  className="w-full mt-4 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') handleClose();
                  }}
                />
              )}
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                {dialog.type !== 'alert' && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                    onClick={handleClose}
                  >
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  className={`px-5 py-2 rounded-xl text-white font-medium shadow-sm transition-colors text-sm ${
                    dialog.type === 'alert'
                      ? dialog.variant === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : dialog.variant === 'success'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                      : dialog.title?.toLowerCase().includes('hapus')
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  onClick={handleConfirm}
                  autoFocus={dialog.type !== 'prompt'}
                >
                  {dialog.type === 'alert'
                    ? 'Tutup'
                    : dialog.title?.toLowerCase().includes('hapus')
                    ? 'Ya, Hapus'
                    : 'Ya, Lanjutkan'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
};
