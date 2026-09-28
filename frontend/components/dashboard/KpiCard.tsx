import React from 'react';
import { Card } from '@/components/ui/Card';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: string | number;
  description: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  description,
  change,
  trend = 'neutral',
  icon: Icon,
  className,
}) => {
  return (
    <Card className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#EEF0F3] border border-[#E2E5E9] flex items-center justify-center text-gray-600 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
          <Icon className="w-5 h-5 stroke-[1.75]" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500 truncate max-w-[180px]">{description}</span>
        {change && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold text-[11px] shrink-0',
              trend === 'up'
                ? 'text-emerald-700'
                : trend === 'down'
                ? 'text-red-700'
                : 'text-gray-500'
            )}
          >
            {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend === 'neutral' && <Minus className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
    </Card>
  );
};
