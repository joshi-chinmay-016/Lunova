import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertCircle className="w-5 h-5 text-red-600" />,
    primary: <Info className="w-5 h-5 text-blue-600" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  };

  const iconBgMap = {
    danger: 'bg-red-50 border-red-100',
    primary: 'bg-blue-50 border-blue-100',
    success: 'bg-emerald-50 border-emerald-100',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${iconBgMap[variant]}`}
          >
            {iconMap[variant]}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E2E5E9]">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
