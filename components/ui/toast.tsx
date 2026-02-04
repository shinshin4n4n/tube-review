'use client';

import * as React from 'react';
import { X } from 'lucide-react';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose: () => void;
}

export function Toast({
  title,
  description,
  variant = 'default',
  onClose,
}: ToastProps) {
  return (
    <div
      className={`pointer-events-auto flex w-full max-w-md rounded-lg shadow-lg ${
        variant === 'destructive'
          ? 'bg-red-600 text-white'
          : 'bg-white border border-stroke'
      }`}
    >
      <div className="flex-1 p-4">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && (
          <p className={`mt-1 text-sm ${variant === 'destructive' ? 'text-white' : 'text-content-secondary'}`}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex items-center justify-center px-4 border-l border-stroke-light hover:bg-elevated"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export interface ToasterProps {
  toasts: ToastProps[];
}

export function Toaster({ toasts }: ToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-auto sm:right-4 sm:top-4 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
