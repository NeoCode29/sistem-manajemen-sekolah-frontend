import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, HelpCircle, X, Info } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
  type: DialogType;
  title?: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: any) => void;
  onCancel?: () => void;
}

interface DialogContextProps {
  showAlert: (message: string, title?: string) => void;
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
      const { title, message } = e.detail;
      setTimeout(() => {
        setDialog({ type: 'alert', title, message });
      }, 100);
    };
    window.addEventListener('global-alert', handleGlobalAlert);
    return () => window.removeEventListener('global-alert', handleGlobalAlert);
  }, []);

  const showAlert = (message: string, title = 'Perhatian') => {
    setDialog({ type: 'alert', message, title });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'Konfirmasi') => {
    setDialog({ type: 'confirm', message, title, onConfirm });
  };

  const showPrompt = (message: string, onConfirm: (value: string) => void, defaultValue = '', title = 'Input Diperlukan') => {
    setInputValue(defaultValue);
    setDialog({ type: 'prompt', message, title, onConfirm, defaultValue });
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

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {dialog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-enter relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 leading-tight">
                {dialog.type === 'alert' && <Info className="text-blue-500" size={24} />}
                {dialog.type === 'confirm' && <HelpCircle className="text-orange-500" size={24} />}
                {dialog.type === 'prompt' && <AlertCircle className="text-indigo-500" size={24} />}
                {dialog.title}
              </h2>
              <button type="button" className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-2">{dialog.message}</p>
              
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
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    onClick={handleClose}
                  >
                    Batal
                  </button>
                )}
                <button
                  className={`px-6 py-2.5 rounded-xl text-white font-semibold shadow-sm transition-colors text-sm ${dialog.title?.toLowerCase().includes('hapus') ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  onClick={handleConfirm}
                  autoFocus={dialog.type !== 'prompt'}
                >
                  {dialog.type === 'alert' ? 'OK' : (dialog.title?.toLowerCase().includes('hapus') ? 'Ya, Hapus' : 'Ya, Lanjutkan')}
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
