import React from 'react';
import { ProposalStatus } from '@/types/proposal';
import { Badge } from '@/components/ui/Badge';

export interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  size?: 'sm' | 'md';
}

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'NEW':
      return (
        <Badge variant="neutral" size={size} dot>
          New
        </Badge>
      );
    case 'ANALYZING':
      return (
        <Badge variant="warning" size={size} dot>
          Analyzing
        </Badge>
      );
    case 'AI_DRAFTED':
      return (
        <Badge variant="info" size={size} dot>
          AI Drafted
        </Badge>
      );
    case 'UNDER_REVIEW':
      return (
        <Badge variant="primary" size={size} dot>
          Under Review
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="success" size={size} dot>
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger" size={size} dot>
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size={size}>
          {status}
        </Badge>
      );
  }
};
