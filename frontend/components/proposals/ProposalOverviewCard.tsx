import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Proposal } from '@/types/proposal';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import { formatDate } from '@/lib/utils';
import { Building2, Calendar, User, DollarSign, Mail, FileText } from 'lucide-react';

interface ProposalOverviewCardProps {
  proposal: Proposal;
}

export const ProposalOverviewCard: React.FC<ProposalOverviewCardProps> = ({ proposal }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <h3 className="text-sm font-bold text-gray-900">Proposal Overview</h3>
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#EEF0F3]/70 rounded-xl border border-[#E2E5E9]">
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3 text-gray-400" />
              Customer
            </span>
            <p className="font-semibold text-gray-900 mt-1 truncate">{proposal.customer}</p>
          </div>

          <div className="p-3 bg-[#EEF0F3]/70 rounded-xl border border-[#E2E5E9]">
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              Submission Deadline
            </span>
            <p className="font-semibold text-gray-900 mt-1 truncate">
              {formatDate(proposal.deadline)}
            </p>
          </div>

          <div className="p-3 bg-[#EEF0F3]/70 rounded-xl border border-[#E2E5E9]">
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400" />
              Owner
            </span>
            <p className="font-semibold text-gray-900 mt-1 truncate">{proposal.owner}</p>
          </div>

          <div className="p-3 bg-[#EEF0F3]/70 rounded-xl border border-[#E2E5E9]">
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-gray-400" />
              Est. Contract Value
            </span>
            <p className="font-semibold text-gray-900 mt-1 truncate font-mono">
              {proposal.estimated_value || 'Undisclosed'}
            </p>
          </div>
        </div>

        {/* Client RFP Summary / Scope */}
        {proposal.summary && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-gray-700 block">RFP Scope & Context</span>
            <p className="text-xs text-gray-600 leading-relaxed p-3 bg-gray-50 rounded-xl border border-gray-200">
              {proposal.summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
