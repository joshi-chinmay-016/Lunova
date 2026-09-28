import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { KnowledgeDocument } from '@/types/knowledge';
import { FileText, Database, Layers, Calendar, HardDrive, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface DocumentDetailModalProps {
  document: KnowledgeDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="truncate">{document.name}</span>
        </div>
      }
      description={document.category || 'Knowledge Base Index'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Document Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-[#EEF0F3] rounded-xl border border-[#E2E5E9] text-xs">
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Type</span>
            <p className="font-semibold text-gray-900 mt-0.5">{document.type}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">File Size</span>
            <p className="font-semibold text-gray-900 mt-0.5 font-mono">{document.file_size}</p>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Status</span>
            <div className="mt-0.5">
              <Badge variant={document.status === 'READY' ? 'success' : 'warning'} size="sm">
                {document.status}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Indexed Chunks</span>
            <p className="font-semibold text-gray-900 mt-0.5 font-mono">
              {document.chunks_count} chunks
            </p>
          </div>
        </div>

        {/* Index Summary */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Document Abstract & Knowledge Scope</span>
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed p-3.5 bg-gray-50 rounded-xl border border-gray-200">
            {document.summary || 'Document indexed and ready for semantic vector similarity retrieval.'}
          </p>
        </div>

        {/* Audit Timestamps */}
        <div className="text-[11px] text-gray-500 space-y-1 pt-1 font-mono">
          <p>Uploaded: {formatDate(document.uploaded_at)}</p>
          <p>Last vector sync: {formatDate(document.last_updated)}</p>
        </div>

        <div className="pt-3 border-t border-[#E2E5E9] flex items-center justify-between">
          {onDelete ? (
            <button
              onClick={() => {
                if (confirm(`Remove "${document.name}" from knowledge index?`)) {
                  onDelete(document.id);
                  onClose();
                }
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Delete Document
            </button>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
