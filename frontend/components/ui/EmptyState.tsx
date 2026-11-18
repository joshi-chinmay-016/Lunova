'use client';

import React from 'react';
import { useLunovaStore } from '@/lib/lunovaStore';
import { RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  icon: Icon,
}) => {
  const { resetSampleData, addToast } = useLunovaStore();

  const handleReset = () => {
    resetSampleData();
    addToast({
      title: 'Sample Data Loaded',
      message: 'Restored observatory proposals and knowledge documents.',
      type: 'success',
    });
  };

  return (
    <div
      className={`p-10 rounded-card border border-line bg-surface-1 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 ${className}`}
    >
      {/* Custom Lunar Observatory Illustration (SVG) */}
      <div className="w-20 h-20 mb-5 relative flex items-center justify-center">
        <svg
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-accent"
        >
          {/* Orbital path */}
          <ellipse
            cx="40"
            cy="40"
            rx="36"
            ry="18"
            stroke="var(--line)"
            strokeWidth="1"
            strokeDasharray="3 3"
            transform="rotate(-20 40 40)"
          />
          {/* Central cratered moon */}
          <circle cx="40" cy="40" r="18" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.2" />
          <path
            d="M40 22C49.9411 22 58 30.0589 58 40C58 49.9411 49.9411 58 40 58C36 53 34 46.5 34 40C34 33.5 36 27 40 22Z"
            fill="var(--accent)"
            opacity="0.85"
          />
          {/* Small crater dots */}
          <circle cx="46" cy="34" r="2.5" fill="var(--surface-3)" opacity="0.6" />
          <circle cx="50" cy="44" r="2" fill="var(--surface-3)" opacity="0.6" />
          <circle cx="43" cy="48" r="1.5" fill="var(--surface-3)" opacity="0.5" />
          {/* Orbiting doc node */}
          <circle cx="68" cy="32" r="3" fill="var(--evidence)" />
          <circle cx="14" cy="48" r="2" fill="var(--text-muted)" opacity="0.6" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed max-w-xs mb-6">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full justify-center">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full sm:w-auto px-4 py-2 rounded-md bg-accent text-bg text-xs font-bold hover:opacity-90 transition-opacity"
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={handleReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-line text-xs font-medium text-text-muted hover:text-text transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Load sample data</span>
        </button>
      </div>
    </div>
  );
};
