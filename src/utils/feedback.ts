import toast from 'react-hot-toast';

/**
 * Helper to safely extract user-friendly error messages from NestJS / Axios API responses.
 */
export function parseApiError(error: unknown, fallbackMessage = 'Terjadi kesalahan pada sistem'): string {
  if (!error) return fallbackMessage;

  // Axios or API Response error object
  const err = error as any;
  const resData = err.response?.data;

  if (resData) {
    // NestJS default validation pipe returns { message: string | string[], error: string, statusCode: number }
    if (Array.isArray(resData.message) && resData.message.length > 0) {
      return resData.message.join(', ');
    }
    if (typeof resData.message === 'string' && resData.message.trim().length > 0) {
      return resData.message;
    }
    if (typeof resData.error === 'string' && resData.error.trim().length > 0) {
      return resData.error;
    }
  }

  // Axios network error or standard JS Error
  if (err.message && typeof err.message === 'string') {
    if (err.message === 'Network Error') {
      return 'Gagal terhubung ke server. Periksa koneksi internet atau server backend.';
    }
    return err.message;
  }

  return fallbackMessage;
}

/**
 * Standardized feedback notification wrapper using react-hot-toast.
 */
export const notify = {
  success: (message: string) => {
    return toast.success(message, {
      duration: 3500,
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#f8fafc',
      },
    });
  },

  error: (error: unknown, fallbackMessage?: string) => {
    const message = parseApiError(error, fallbackMessage);
    return toast.error(message, {
      duration: 5000,
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#f8fafc',
      },
    });
  },

  warning: (message: string) => {
    return toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    });
  },

  info: (message: string) => {
    return toast(message, {
      duration: 3500,
      icon: 'ℹ️',
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#f8fafc',
        fontSize: '14px',
        padding: '12px 16px',
      },
    });
  },
};
