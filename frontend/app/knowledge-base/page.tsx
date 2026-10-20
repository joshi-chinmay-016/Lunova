'use client';

import React, { useState, useMemo } from 'react';
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useKnowledge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DocumentUploadCard } from '@/components/knowledge/DocumentUploadCard';
import { DocumentDetailModal } from '@/components/knowledge/DocumentDetailModal';
import { KnowledgeDocument } from '@/types/knowledge';
import { formatDate } from '@/lib/utils';
import { BookOpen, Search, FileText, Database, Trash2, Eye, Filter } from 'lucide-react';

export default function KnowledgeBasePage() {
  const { data: documents, isLoading, error, refetch } = useDocuments();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.filter((doc) => {
      const matchesSearch =
        !search ||
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.category.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, search, typeFilter]);

  const typeOptions = [
    { value: 'ALL', label: 'All Document Types' },
    { value: 'PDF', label: 'PDF Documents' },
    { value: 'DOCX', label: 'DOCX Word' },
    { value: 'XLSX', label: 'XLSX Spreadsheets' },
    { value: 'TXT', label: 'Plain Text' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base"
          description="Manage the information Lunova uses when generating responses."
        />
        <Skeleton className="h-44 w-full" />
        <Card className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-60 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !documents) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Knowledge Base"
          description="Manage the information Lunova uses when generating responses."
        />
        <ErrorState
          title="Unable to load Knowledge Base"
          message="Could not retrieve indexed documents from the workspace."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return <Badge variant="success" size="sm" dot>Ready</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning" size="sm" dot>Processing</Badge>;
      case 'FAILED':
        return <Badge variant="danger" size="sm" dot>Failed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Knowledge Base"
        description="Manage company case studies, compliance certifications, and architecture blueprints for evidence-backed generation."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Knowledge Base' },
        ]}
      />

      {/* Upload Zone */}
      <DocumentUploadCard
        onUpload={async (payload) => {
          await uploadMutation.mutateAsync(payload);
        }}
      />

      {/* Documents Filter & Search Card */}
      <Card>
        <CardHeader className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Indexed Knowledge Documents</h3>
            <span className="text-[11px] font-mono text-gray-400">
              ({filteredDocuments.length} files)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="w-56">
              <Input
                placeholder="Search knowledge docs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={BookOpen}
                title={search || typeFilter !== 'ALL' ? 'No matching documents' : 'Your knowledge base is empty'}
                description={
                  search || typeFilter !== 'ALL'
                    ? 'No documents matched your filter parameters.'
                    : 'Upload company documents so Lunova can use them when generating proposal responses.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E5E9] bg-gray-50/50 text-gray-500 font-medium">
                    <th className="py-3 px-4 font-semibold">Document Name</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">Uploaded</th>
                    <th className="py-3 px-4 font-semibold hidden lg:table-cell">Last Updated</th>
                    <th className="py-3 px-4 font-semibold hidden sm:table-cell">Chunks</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E9]">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors block truncate max-w-xs sm:max-w-sm">
                              {doc.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono block">
                              {doc.file_size} • {doc.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 font-mono font-medium text-gray-600 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px]">
                          {doc.type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Uploaded */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap hidden md:table-cell">
                        {formatDate(doc.uploaded_at)}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap hidden lg:table-cell">
                        {formatDate(doc.last_updated)}
                      </td>

                      {/* Chunks */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap font-mono hidden sm:table-cell">
                        {doc.chunks_count} vectors
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedDoc(doc)}
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Remove "${doc.name}" from knowledge base?`)) {
                                deleteMutation.mutate(doc.id);
                              }
                            }}
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
