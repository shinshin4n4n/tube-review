'use client';

import { useState, useCallback } from 'react';
import type { ToastProps } from '@/components/ui/toast';

let toastIdCounter = 0;

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastIdCounter}`;
    const duration = options.duration ?? 5000;

    const newToast: ToastProps = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant,
      onClose: () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toast,
    toasts,
    dismiss,
  };
}
