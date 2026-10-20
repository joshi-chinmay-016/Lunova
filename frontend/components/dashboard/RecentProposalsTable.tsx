'use client';

import React from 'react';
import Link from 'next/link';
import { Proposal } from '@/types/proposal';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ArrowRight, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RecentProposalsTableProps {
  proposals: Proposal[];
}

export const RecentProposalsTable: React.FC<RecentProposalsTableProps> = ({ proposals }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#E2E5E9] bg-gray-50/50 text-gray-500 font-medium">
            <th className="py-3 px-4 font-semibold">Proposal</th>
            <th className="py-3 px-4 font-semibold">Customer</th>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold">Deadline</th>
            <th className="py-3 px-4 font-semibold hidden md:table-cell">Last Updated</th>
            <th className="py-3 px-4 font-semibold hidden lg:table-cell">Owner</th>
            <th className="py-3 px-4 font-semibold text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E5E9]">
          {proposals.map((prop) => (
            <tr
              key={prop.id}
              className="hover:bg-gray-50/80 transition-colors group"
            >
              {/* Proposal title */}
              <td className="py-3 px-4">
                <Link
                  href={`/proposals/${prop.id}`}
                  className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors block max-w-xs sm:max-w-sm truncate"
                >
                  {prop.title}
                </Link>
                {prop.estimated_value && (
                  <span className="text-[11px] text-gray-500 font-mono mt-0.5 block">
                    {prop.estimated_value}
                  </span>
                )}
              </td>

              {/* Customer */}
              <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">
                {prop.customer}
              </td>

              {/* Status */}
              <td className="py-3 px-4 whitespace-nowrap">
                <ProposalStatusBadge status={prop.status} />
              </td>

              {/* Deadline */}
              <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDate(prop.deadline)}</span>
                </div>
              </td>

              {/* Last Updated */}
              <td className="py-3 px-4 text-gray-500 whitespace-nowrap hidden md:table-cell">
                {formatRelativeTime(prop.updated_at)}
              </td>

              {/* Owner */}
              <td className="py-3 px-4 text-gray-600 whitespace-nowrap hidden lg:table-cell">
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{prop.owner.split(' ')[0]} {prop.owner.split(' ')[1]?.[0]}.</span>
                </div>
              </td>

              {/* Action */}
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <Link href={`/proposals/${prop.id}`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
                    <span>Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-blue-600" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
