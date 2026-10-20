import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'flat' | 'well';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'raised', interactive = false, children, ...props }, ref) => {
    const variantStyles = {
      raised:
        'bg-white border border-[#E2E5E9] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]',
      flat: 'bg-white border border-[#E2E5E9] rounded-2xl',
      well: 'bg-[#EEF0F3] border border-[#E2E5E9] rounded-xl shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]',
    };

    const interactiveStyles = interactive
      ? 'cursor-pointer hover:border-[#D1D5DB] hover:-translate-y-0.5 hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05),0_12px_28px_-4px_rgba(15,23,42,0.09)] transition-all duration-200'
      : '';

    return (
      <div
        ref={ref}
        className={cn(variantStyles[variant], interactiveStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-6 py-4 border-b border-[#E2E5E9] flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-6 py-3.5 bg-gray-50/70 border-t border-[#E2E5E9] rounded-b-2xl flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);
