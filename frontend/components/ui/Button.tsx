import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer';

    const sizeStyles = {
      sm: 'text-xs sm:text-sm px-4 py-2 gap-2 h-9.5 sm:h-10 font-semibold',
      md: 'text-sm sm:text-base px-5 sm:px-6 py-2.5 gap-2.5 h-11 sm:h-12 font-semibold',
      lg: 'text-base px-7 py-3.5 gap-3 h-13 font-bold',
    };

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow border border-blue-600 focus:ring-blue-500 font-semibold',
      secondary:
        'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm focus:ring-slate-300 font-semibold',
      outline:
        'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100 focus:ring-slate-300 font-semibold',
      ghost:
        'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent focus:ring-slate-200 font-medium',
      danger:
        'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600 focus:ring-red-400 font-semibold',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-600 focus:ring-emerald-400 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
