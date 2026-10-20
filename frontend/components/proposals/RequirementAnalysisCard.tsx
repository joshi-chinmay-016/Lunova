'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ProposalRequirement } from '@/types/proposal';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  BookOpen,
  Tag
} from 'lucide-react';

interface RequirementAnalysisCardProps {
  requirements?: ProposalRequirement[];
}

export const RequirementAnalysisCard: React.FC<RequirementAnalysisCardProps> = ({
  requirements = [],
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'PARTIAL':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'FLAGGED':
        return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return (
          <Badge variant="success" size="sm">
            Fulfilled
          </Badge>
        );
      case 'PARTIAL':
        return (
          <Badge variant="warning" size="sm">
            Partial Match
          </Badge>
        );
      case 'FLAGGED':
        return (
          <Badge variant="danger" size="sm">
            Attention Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
            MED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
            LOW
          </span>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Extracted Requirements</h3>
          </div>
          <span className="text-[11px] font-mono text-gray-500 font-semibold">
            {requirements.length} {requirements.length === 1 ? 'requirement' : 'requirements'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {requirements.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">
            <p>No requirements extracted yet.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Click &ldquo;Run AI Analysis&rdquo; to parse the inquiry text and extract mandatory customer criteria.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E5E9]">
            {requirements.map((req, idx) => (
              <li key={req.requirement_id || idx} className="p-4 hover:bg-gray-50/50 transition-colors space-y-2">
                {/* Top line: Status Icon + Description + Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">{getStatusIcon(req.status)}</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 leading-snug">
                        {req.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono text-gray-400 px-1 py-0.5 rounded border border-gray-200 bg-white">
                      {req.category}
                    </span>
                    {getPriorityBadge(req.priority)}
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                {/* Evidence citation & Notes */}
                {(req.evidence || req.notes) && (
                  <div className="pl-6.5 text-[11px] space-y-1">
                    {req.evidence && (
                      <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                        <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="font-semibold text-gray-600">Evidence:</span>
                        <span className="font-medium truncate">{req.evidence}</span>
                      </div>
                    )}
                    {req.notes && (
                      <p className="text-gray-500 italic pl-1">
                        Note: {req.notes}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
