import React from 'react';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'Something went wrong while retrieving information. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={`p-8 text-center flex flex-col items-center justify-center rounded-2xl bg-white border border-red-100 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.06)] ${
        className || ''
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-3.5">
        <AlertTriangle className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
