import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDocuments,
  uploadDocument,
  deleteDocument
} from '@/lib/api/client';
import { KnowledgeDocument, UploadDocumentPayload } from '@/types/knowledge';

export function useDocuments() {
  return useQuery<KnowledgeDocument[]>({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    staleTime: 1000 * 30,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadDocumentPayload) => uploadDocument(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
