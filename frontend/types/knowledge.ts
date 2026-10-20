export type DocumentStatus = 'READY' | 'PROCESSING' | 'FAILED';

export type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'TXT';

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  file_size: string;
  uploaded_at: string;
  last_updated: string;
  chunks_count: number;
  category: string;
  summary?: string;
  content_preview?: string;
}

export interface UploadDocumentPayload {
  name: string;
  type: DocumentType;
  category: string;
  content?: string;
}
