import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => showToast(message, 'warning'),
    [showToast]
  );

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}



