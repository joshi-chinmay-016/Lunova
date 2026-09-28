import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center rounded-2xl bg-white border border-[#E2E5E9] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] ${
        className || ''
      }`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#EEF0F3] border border-[#E2E5E9] flex items-center justify-center text-gray-500 mb-4 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
          <Icon className="w-6 h-6 stroke-[1.75]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1.5 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
