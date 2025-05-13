'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { listKnowledgeBaseDocuments, uploadKnowledgeBaseDocument, deleteKnowledgeBaseDocument, KBDocument } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge'; // Per lo stato
import { Upload, Trash2, FileText, AlertCircle, Loader2 } from 'lucide-react'; // Icone

// Interfaccia per lo stato locale del documento da eliminare
interface DocumentToDelete {
  id: string;
  name: string;
}

export default function KnowledgeBasePage() {
  const params = useParams();
  const projectId = params.projectId as string; // Assumiamo che projectId sia sempre presente
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentToDelete | null>(null);

  // Query per ottenere i documenti della KB
  const { data: documents, isLoading: isLoadingDocuments, error: documentsError } = useQuery<KBDocument[], Error>({
    queryKey: ['kbDocuments', projectId],
    queryFn: () => listKnowledgeBaseDocuments(projectId),
    enabled: !!projectId, // Esegui solo se projectId è valido
  });

  // Mutazione per l'upload di un documento
  const { mutate: uploadDocument, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => uploadKnowledgeBaseDocument(projectId, file),
    onSuccess: (data) => {
      toast.success(data.message || 'Document uploaded successfully! Processing started.');
      queryClient.invalidateQueries({ queryKey: ['kbDocuments', projectId] });
      setSelectedFile(null); // Resetta input file
      // Resetta l'elemento input nativo
      const fileInput = document.getElementById('kb-file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  // Mutazione per eliminare un documento
  const { mutate: deleteDocument, isPending: isDeleting } = useMutation({
    mutationFn: (documentId: string) => deleteKnowledgeBaseDocument(projectId, documentId),
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['kbDocuments', projectId] });
      setDocumentToDelete(null); // Chiudi dialog
    },
    onError: (error: Error) => {
      toast.error(`Deletion failed: ${error.message}`);
      setDocumentToDelete(null); // Chiudi dialog anche in caso di errore
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadDocument(selectedFile);
    }
  };

  const handleDeleteClick = (doc: KBDocument) => {
    setDocumentToDelete({ id: doc.id, name: doc.file_name });
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocument(documentToDelete.id);
    }
  };

  // Helper per formattare la dimensione del file
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper per visualizzare lo stato con Badge
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'indexed':
        return <Badge variant="default">Indexed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base Management</h1>

      {/* Sezione Upload */}
      <div className="mb-8 p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Input
            id="kb-file-upload"
            type="file"
            onChange={handleFileChange}
            className="flex-grow cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            disabled={isUploading}
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Upload Document</>
            )}
          </Button>
        </div>
        {selectedFile && (
          <p className="mt-3 text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
        )}
      </div>

      {/* Sezione Elenco Documenti */}
      <div className="p-6 border rounded-lg shadow-sm bg-card">
        <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
        {isLoadingDocuments && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">Loading documents...</p>
          </div>
        )}
        {documentsError && (
          <div className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Failed to load documents:</p>
            <p className="text-sm">{documentsError.message}</p>
          </div>
        )}
        {!isLoadingDocuments && !documentsError && documents && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2" />
            <p>No documents found in the knowledge base.</p>
            <p className="text-sm">Upload a document using the form above.</p>
          </div>
        )}
        {!isLoadingDocuments && !documentsError && documents && documents.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.file_name}</TableCell>
                  <TableCell>{renderStatusBadge(doc.status)}</TableCell>
                  <TableCell>{doc.mime_type}</TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(doc)}
                        disabled={isDeleting && documentToDelete?.id === doc.id}
                        title={`Delete ${doc.file_name}`}
                      >
                        {isDeleting && documentToDelete?.id === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    {doc.status === 'failed' && doc.error_message && (
                       <span title={doc.error_message} className="ml-2 text-destructive cursor-help"><AlertCircle className="h-4 w-4 inline"/></span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document '
              <strong>{documentToDelete?.name}</strong>' and all its associated data from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 