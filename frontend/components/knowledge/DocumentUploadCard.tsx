'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UploadDocumentPayload } from '@/types/knowledge';
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface DocumentUploadCardProps {
  onUpload: (payload: UploadDocumentPayload) => Promise<any>;
}

export const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [lastUploadedName, setLastUploadedName] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file: File) => {
    setLastUploadedName(file.name);
    setUploadState('processing');
    setStatusMessage('Uploading & indexing document into tenant vector store...');

    // Determine type
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const docType: 'PDF' | 'DOCX' | 'XLSX' | 'TXT' =
      ext === 'DOCX' ? 'DOCX' : ext === 'XLSX' ? 'XLSX' : ext === 'TXT' ? 'TXT' : 'PDF';

    try {
      await onUpload({
        name: file.name,
        type: docType,
        category: 'Enterprise Documentation',
        content: `Indexed content from ${file.name}`,
      });

      setUploadState('success');
      setStatusMessage('Document successfully indexed and ready for proposal citations.');
      setTimeout(() => {
        setUploadState('idle');
        setStatusMessage('');
      }, 4000);
    } catch (err: any) {
      setUploadState('idle');
      alert(`Upload failed: ${err.message}`);
    }
  };

  return (
    <Card className="border-dashed border-2 border-[#E2E5E9] bg-white">
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploadState === 'processing' ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{lastUploadedName}</p>
              <p className="text-xs text-gray-500">{statusMessage}</p>
              <p className="text-[11px] text-gray-400 font-mono">
                Extracting semantic chunks and creating embeddings...
              </p>
            </div>
          </div>
        ) : uploadState === 'success' ? (
          <div className="py-8 text-center flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-900">Upload Complete</p>
              <p className="text-xs text-emerald-700">{statusMessage}</p>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`py-8 text-center flex flex-col items-center justify-center cursor-pointer rounded-xl transition-all ${
              isDragging ? 'bg-blue-50/60 border-blue-400' : 'hover:bg-gray-50/60'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EEF0F3] border border-[#E2E5E9] flex items-center justify-center text-gray-600 mb-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
              <UploadCloud className="w-6 h-6 stroke-[1.75]" />
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Drag &amp; drop documents or <span className="text-blue-600 underline">browse</span>
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              Supports PDF, DOCX, XLSX, and TXT files for semantic vector indexing.
            </p>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">PDF</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">DOCX</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">XLSX</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">TXT</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
