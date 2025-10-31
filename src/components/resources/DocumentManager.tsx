import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Eye, Trash2, Shield, AlertTriangle, Lock, Globe, Upload, Download, X } from 'lucide-react';
import { useDocuments, type NewDocument } from '@/hooks/useDocuments';
import { toast } from 'sonner';

export function DocumentManager() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [newDocument, setNewDocument] = useState<NewDocument>({
    title: '',
    description: '',
    content: '',
    classification: 'internal'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  
  const { documents, loading, addDocument, viewDocument, deleteDocument } = useDocuments();

  const handleAddDocument = async () => {
    try {
      setUploadError("");
      await addDocument({
        ...newDocument,
        file: selectedFile || undefined
      });
      
      // Reset form
      setNewDocument({ title: '', description: '', content: '', classification: 'internal' });
      setSelectedFile(null);
      setShowAddDialog(false);
    } catch (error: any) {
      console.error('Error adding document:', error);
      setUploadError(error.message || "Failed to upload document");
      toast.error("Failed to add document");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset form when dialog closes
      setNewDocument({ title: '', description: '', content: '', classification: 'internal' });
      setSelectedFile(null);
      setUploadError("");
    }
    setShowAddDialog(open);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleViewDocument = async (document: any) => {
    await viewDocument(document);
    setSelectedDocument(document);
    setShowViewDialog(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(documentId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'default';
      case 'internal': return 'secondary';
      case 'confidential': return 'destructive';
      case 'restricted': return 'destructive';
      default: return 'default';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'public': return Globe;
      case 'internal': return Eye;
      case 'confidential': return Lock;
      case 'restricted': return Shield;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Management
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newDocument.description || ''}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the document"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newDocument.content || ''}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Document content..."
                      rows={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classification">Classification Level</Label>
                    <Select 
                      value={newDocument.classification} 
                      onValueChange={(value: 'public' | 'internal' | 'confidential' | 'restricted') => 
                        setNewDocument(prev => ({ ...prev, classification: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">File Upload (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
              </div>
                    {selectedFile && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          <Upload className="h-4 w-4" />
                          <span>{selectedFile.name}</span>
                          <span className="text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeSelectedFile}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                    </p>
                    {uploadError && (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDocument}>
                      Add Document
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Access Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No documents found. Create your first document to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => {
                    const ClassificationIcon = getClassificationIcon(doc.classification);
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.file_url && <FileText className="h-4 w-4 text-blue-500" />}
                            {doc.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ClassificationIcon className="h-4 w-4" />
                            <Badge variant={getClassificationColor(doc.classification)}>
                              {doc.classification.toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{doc.access_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {doc.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.file_url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getClassificationColor(selectedDocument?.classification || 'public')}>
                {selectedDocument?.classification?.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedDocument?.access_count} views
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDocument?.description && (
              <p className="text-muted-foreground">{selectedDocument.description}</p>
            )}
            {selectedDocument?.file_url ? (
              <div className="text-center">
                <p className="mb-4">This document is a file. Click to download:</p>
                <Button 
                  onClick={() => window.open(selectedDocument.file_url, '_blank')}
                  className="mb-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {selectedDocument.file_name}
                </Button>
              </div>
            ) : (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {selectedDocument?.content}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}