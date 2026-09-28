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
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    };

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 shadow-clay-button border border-blue-600 focus:ring-blue-500',
      secondary:
        'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow focus:ring-gray-300',
      outline:
        'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-100 focus:ring-gray-300',
      ghost:
        'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent focus:ring-gray-200',
      danger:
        'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-600 focus:ring-red-400',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-600 focus:ring-emerald-400',
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
