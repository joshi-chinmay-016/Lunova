'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { RetrievedSource } from '@/types/proposal';
import { Badge } from '@/components/ui/Badge';
import { FileText, ExternalLink, ChevronRight, ShieldCheck } from 'lucide-react';
import { SourceDetailModal } from './SourceDetailModal';

interface SourcesPanelProps {
  sources?: RetrievedSource[];
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources = [] }) => {
  const [selectedSource, setSelectedSource] = useState<RetrievedSource | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-900">Grounded Evidence Sources</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-500 font-semibold">
              {sources.length} {sources.length === 1 ? 'source' : 'sources'}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {sources.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              <p>No knowledge base sources retrieved yet.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Run AI analysis to extract and ground evidence against your indexed company documents.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E5E9]">
              {sources.map((src, index) => (
                <li
                  key={src.source_id || index}
                  onClick={() => setSelectedSource(src)}
                  className="p-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded bg-gray-100 border border-gray-200 text-gray-600 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {src.title}
                        </span>
                        {src.page && (
                          <span className="text-[10px] text-gray-500 font-mono">
                            (Page {src.page})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {src.section || 'General Reference'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={src.relevance === 'High' ? 'success' : 'primary'}
                      size="sm"
                    >
                      {src.relevance}
                    </Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <SourceDetailModal
        source={selectedSource}
        isOpen={!!selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </>
  );
};
