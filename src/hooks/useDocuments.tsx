import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Document {
  id: string;
  title: string;
  description?: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  created_by: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  tags?: string[];
}

export interface NewDocument {
  title: string;
  description?: string;
  content?: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  tags?: string[];
  file?: File;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async (newDoc: NewDocument) => {
    if (!user) throw new Error('User not authenticated');

    try {
      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Handle file upload if present
      let textContent: string | undefined = newDoc.content;
      if (newDoc.file) {
        const fileExt = newDoc.file.name.split('.').pop();
        const uploadFileName = `${Math.random()}.${fileExt}`;
        const filePath = `documents/${user.id}/${uploadFileName}`;

        // If it's a plain text file, also capture its contents for RLS policies that require content
        try {
          if (newDoc.file.type === 'text/plain' || (fileExt && fileExt.toLowerCase() === 'txt')) {
            textContent = await newDoc.file.text();
          }
        } catch (e) {
          // Non-blocking
          console.warn('Unable to read text file content:', e);
        }

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, newDoc.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = newDoc.file.name;
        fileSize = newDoc.file.size;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: newDoc.title,
          description: newDoc.description,
          content: textContent,
          classification: newDoc.classification,
          created_by: user.id,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          tags: newDoc.tags || [],
          access_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data as Document, ...prev]);
      toast.success('Document added successfully');
      
      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'document',
        _resource_id: data.id,
        _details: { title: data.title, classification: data.classification }
      });

      return data;
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Failed to add document');
      throw error;
    }
  };

  const viewDocument = async (document: Document) => {
    try {
      // Increment access count
      const { error } = await supabase
        .from('documents')
        .update({ access_count: document.access_count + 1 })
        .eq('id', document.id);

      if (error) throw error;

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, access_count: doc.access_count + 1 }
            : doc
        )
      );

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'VIEW',
        _resource: 'document',
        _resource_id: document.id,
        _details: { title: document.title }
      });

    } catch (error) {
      console.error('Error logging document view:', error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'document',
        _resource_id: documentId
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  };

  return {
    documents,
    loading,
    addDocument,
    viewDocument,
    deleteDocument,
    refetch: fetchDocuments
  };
}