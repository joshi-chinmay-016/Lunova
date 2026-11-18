'use client';

import React from 'react';
import { useLunovaStore } from '@/lib/lunovaStore';
import { PhaseGlyph } from './PhaseGlyph';
import { X, Undo2 } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLunovaStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast: any) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-3.5 rounded-card bg-surface-2 border border-line shadow-2xl text-text text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.phase ? (
              <PhaseGlyph phase={toast.phase} size="sm" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
            )}
            <div className="truncate">
              <p className="font-semibold text-text truncate">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-text-muted truncate">{toast.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-3 hover:bg-surface-1 border border-line text-[11px] font-bold text-accent hover:text-text transition-colors"
              >
                <Undo2 className="w-3 h-3" />
                <span>Undo</span>
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
