import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, HelpCircle, X, Info } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
  type: DialogType;
  title?: string;
  message: string;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
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
        <div className="modal-backdrop-v4" style={{ zIndex: 9999 }}>
          <div className="modal-content-v4" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="modal-header-v4 border-b pb-4 mb-4 flex justify-between items-center">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {dialog.type === 'alert' && <Info className="text-blue-500" size={24} />}
                {dialog.type === 'confirm' && <HelpCircle className="text-orange-500" size={24} />}
                {dialog.type === 'prompt' && <AlertCircle className="text-indigo-500" size={24} />}
                {dialog.title}
              </h2>
              <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" onClick={handleClose}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body-v4">
              <p className="text-gray-700 mb-4">{dialog.message}</p>
              
              {dialog.type === 'prompt' && (
                <input
                  type="text"
                  className="input-field w-full mb-4"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') handleClose();
                  }}
                />
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                {dialog.type !== 'alert' && (
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={handleClose}
                  >
                    Batal
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  onClick={handleConfirm}
                  autoFocus={dialog.type !== 'prompt'}
                >
                  {dialog.type === 'alert' ? 'OK' : 'Ya, Lanjutkan'}
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
