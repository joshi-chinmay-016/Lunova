import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { RetrievedSource } from '@/types/proposal';
import { FileText, Bookmark, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface SourceDetailModalProps {
  source: RetrievedSource | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  source,
  isOpen,
  onClose,
}) => {
  if (!source) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>{source.title}</span>
        </div>
      }
      description={source.section || 'Knowledge Base Source Document'}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Source Metadata Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[#EEF0F3] rounded-xl border border-[#E2E5E9] text-xs">
          <div className="flex items-center gap-1 text-gray-700">
            <span className="font-semibold text-gray-500">Relevance:</span>
            <Badge variant={source.relevance === 'High' ? 'success' : 'primary'} size="sm">
              {source.relevance}
              {source.relevance_score ? ` (${(source.relevance_score * 100).toFixed(0)}%)` : ''}
            </Badge>
          </div>

          {source.page && (
            <div className="flex items-center gap-1 text-gray-700 font-mono">
              <span className="font-semibold text-gray-500 font-sans">Citation:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                Page {source.page}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-gray-700">
            <span className="font-semibold text-gray-500">Source ID:</span>
            <span className="font-mono text-gray-600">{source.source_id}</span>
          </div>
        </div>

        {/* Supporting excerpt */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-600" />
            <span>Retrieved Evidence Excerpt</span>
          </h4>
          <div className="p-4 rounded-xl bg-white border border-[#E2E5E9] text-xs text-gray-800 leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] border-l-4 border-l-blue-600">
            &ldquo;{source.supporting_info}&rdquo;
          </div>
        </div>

        {source.snippet && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-700">Contextual Snippet</h4>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed font-mono">
              {source.snippet}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-[#E2E5E9] flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-mono">
            Grounding verification via Lunova Vector Index
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
