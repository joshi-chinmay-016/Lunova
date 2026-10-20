'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Proposal } from '@/types/proposal';
import { formatDate } from '@/lib/utils';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface UpcomingDeadlinesProps {
  proposals: Proposal[];
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ proposals }) => {
  // Sort by deadline
  const sorted = [...proposals]
    .filter((p) => p.status !== 'APPROVED' && p.status !== 'REJECTED')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const getPriorityInfo = (deadline: string) => {
    const target = new Date(deadline).getTime();
    const now = new Date('2026-09-28').getTime(); // anchored to current context
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 4) {
      return {
        priority: 'Urgent',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        text: `${diffDays} days left`,
        isUrgent: true,
      };
    } else if (diffDays <= 10) {
      return {
        priority: 'Due soon',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        text: `${diffDays} days left`,
        isUrgent: false,
      };
    } else {
      return {
        priority: 'Normal',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        text: `${diffDays} days left`,
        isUrgent: false,
      };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Upcoming Deadlines</h3>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[#E2E5E9]">
          {sorted.map((prop) => {
            const pInfo = getPriorityInfo(prop.deadline);
            return (
              <li
                key={prop.id}
                className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/proposals/${prop.id}`}
                    className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors block truncate"
                  >
                    {prop.title}
                  </Link>
                  <p className="text-[11px] text-gray-500 mt-0.5">{prop.customer}</p>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                    Due {formatDate(prop.deadline)}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${pInfo.badgeClass}`}
                  >
                    {pInfo.isUrgent && <AlertTriangle className="w-3 h-3" />}
                    <span>{pInfo.text}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};
