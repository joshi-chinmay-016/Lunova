import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Soft dark overlay */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Raised clay modal surface */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl border border-[#E2E5E9] shadow-[0_12px_36px_-4px_rgba(15,23,42,0.14),0_4px_16px_-2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150',
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="px-6 pt-5 pb-4 border-b border-[#E2E5E9] flex items-start justify-between">
            <div>
              {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
              {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors ml-4"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
