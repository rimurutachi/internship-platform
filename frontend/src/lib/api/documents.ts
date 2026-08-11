/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Document Service API Client
 * Connects to document-service on port 6001
 * Handles all document CRUD operations and version control
 */

import axios from 'axios';
import { createSupabaseClient } from '@/lib/supabase';
import type {
  Document,
  DocumentVersion,
  DocumentFilters,
  DocumentSortOptions,
  PaginationOptions,
  DocumentWithDetails,
} from '@/types/documents';

// Document service runs on separate port
const DOCUMENT_SERVICE_URL = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || 'http://localhost:6001';

/**
 * Get authentication headers with Supabase JWT token
 */
async function getAuthHeaders() {
  try {
    const supabase = createSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      console.error('❌ [Documents API] No valid session:', error);
      throw new Error('Authentication required');
    }

    console.log('🔑 [Documents API] Auth token retrieved');
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    console.error('💥 [Documents API] Auth error:', error);
    throw error;
  }
}

/**
 * Document API Client
 */
export const documentsAPI = {
  /**
   * Get all documents for the current user
   */
  async getDocuments(
    filters?: DocumentFilters,
    sortOptions?: DocumentSortOptions,
    pagination?: PaginationOptions
  ): Promise<{ documents: DocumentWithDetails[]; total: number }> {
    try {
      console.log('🔵 [Documents API] Fetching documents...', { filters, sortOptions, pagination });
      
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();

      // Add filters
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.owner_id) params.append('owner_id', filters.owner_id);

      // Add sorting
      if (sortOptions?.sort_by) params.append('sort_by', sortOptions.sort_by);
      if (sortOptions?.sort_order) params.append('sort_order', sortOptions.sort_order);

      // Add pagination
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents${queryString}`,
        { headers }
      );

      console.log('🟢 [Documents API] Documents fetched:', response.data);
      
      // Handle different response formats
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          documents: data.documents || data,
          total: data.total || data.length || 0,
        };
      }
      
      return {
        documents: Array.isArray(response.data) ? response.data : [],
        total: Array.isArray(response.data) ? response.data.length : 0,
      };
    } catch (error) {
      console.error('❌ [Documents API] Get documents error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<DocumentWithDetails> {
    try {
      console.log('🔵 [Documents API] Fetching document:', documentId);
      
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}`,
        { headers }
      );

      console.log('🟢 [Documents API] Document fetched:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Get document error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Create a new document
   */
  async createDocument(documentData: {
    title: string;
    type: string;
    content?: any;
    description?: string;
    file_url?: string;
    metadata?: any;
  }): Promise<Document> {
    try {
      console.log('🔵 [Documents API] Creating document:', documentData.title);
      
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/documents`,
        documentData,
        { headers }
      );

      console.log('🟢 [Documents API] Document created:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Create document error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Update an existing document
   */
  async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<Document> {
    try {
      console.log('🔵 [Documents API] Updating document:', documentId);
      
      const headers = await getAuthHeaders();
      const response = await axios.put(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}`,
        updates,
        { headers }
      );

      console.log('🟢 [Documents API] Document updated:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Update document error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('🔵 [Documents API] Deleting document:', documentId);
      
      const headers = await getAuthHeaders();
      await axios.delete(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}`,
        { headers }
      );

      console.log('🟢 [Documents API] Document deleted successfully');
    } catch (error) {
      console.error('❌ [Documents API] Delete document error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Get all versions of a document
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      console.log('🔵 [Documents API] Fetching versions for:', documentId);
      
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/versions`,
        { headers }
      );

      console.log('🟢 [Documents API] Versions fetched:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ [Documents API] Get versions error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Get download URL for a specific version
   */
  async getVersionDownloadUrl(documentId: string, versionId: string): Promise<{ url: string; file_name: string }> {
    try {
      console.log('🔵 [Documents API] Getting version download URL:', versionId);
      
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/versions/${versionId}/download`,
        { headers }
      );

      console.log('🟢 [Documents API] Version download URL obtained');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Get version download URL error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    versionData: {
      content: any;
      changes_summary?: string;
      change_type?: 'major' | 'minor' | 'patch';
    }
  ): Promise<DocumentVersion> {
    try {
      console.log('🔵 [Documents API] Creating version for:', documentId);
      
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/versions`,
        versionData,
        { headers }
      );

      console.log('🟢 [Documents API] Version created:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Create version error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Upload a file (for file_url in document)
   * Note: This is a placeholder - implement actual file upload logic
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    try {
      console.log('🔵 [Documents API] Uploading file:', file.name);
      
      // TODO: Implement actual file upload to storage service (Supabase Storage, S3, etc.)
      // For now, return a mock URL
      console.warn('⚠️ [Documents API] File upload not yet implemented - returning mock URL');
      
      return {
        url: `https://storage.example.com/${Date.now()}_${file.name}`,
      };
    } catch (error) {
      console.error('❌ [Documents API] Upload file error:', error);
      throw error;
    }
  },

  // =============================
  // ACCESS CONTROL METHODS
  // =============================

  /**
   * Grant access to a document for another user
   */
  async grantAccess(
    documentId: string,
    data: {
      user_id: string;
      permission_level: 'view' | 'comment' | 'edit' | 'admin';
      expires_at?: string;
    }
  ): Promise<{ id: string; document_id: string; user_id: string; permission_level: string }> {
    try {
      console.log('🔵 [Documents API] Granting access to document:', documentId, 'for user:', data.user_id);
      
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/access/${documentId}/access/grant`,
        data,
        { headers }
      );

      console.log('🟢 [Documents API] Access granted:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Grant access error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * List all access grants for a document
   */
  async listAccess(documentId: string): Promise<Array<{
    id: string;
    document_id: string;
    user_id: string;
    permission_level: string;
    granted_by: string;
    granted_at: string;
    expires_at?: string;
    users?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>> {
    try {
      console.log('🔵 [Documents API] Listing access for document:', documentId);
      
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/access/${documentId}/access`,
        { headers }
      );

      console.log('🟢 [Documents API] Access list fetched:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ [Documents API] List access error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Revoke access for a user
   */
  async revokeAccess(accessId: string): Promise<void> {
    try {
      console.log('🔵 [Documents API] Revoking access:', accessId);
      
      const headers = await getAuthHeaders();
      await axios.delete(
        `${DOCUMENT_SERVICE_URL}/api/access/${accessId}/revoke`,
        { headers }
      );

      console.log('🟢 [Documents API] Access revoked successfully');
    } catch (error) {
      console.error('❌ [Documents API] Revoke access error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  // =============================
  // USER SEARCH FOR SHARING
  // =============================

  /**
   * Search users for document sharing
   * Uses the backend communication endpoint for user search
   */
  async searchUsersForSharing(query: string, roleFilter?: string): Promise<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }>> {
    try {
      console.log('🔵 [Documents API] Searching users:', query);
      
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (roleFilter) params.append('role', roleFilter);
      
      // NEXT_PUBLIC_API_URL already includes /api (e.g., http://localhost:5000/api)
      const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(
        `${BACKEND_API_URL}/communications/users/search?${params.toString()}`,
        { headers }
      );

      console.log('🟢 [Documents API] Users found:', response.data);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ [Documents API] Search users error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  // =============================
  // DOWNLOAD FUNCTIONALITY
  // =============================

  /**
   * Get a signed download URL for a document file
   * First fetches document files, then gets signed URL for the primary file
   */
  async getDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
    try {
      console.log('🔵 [Documents API] Getting download URL for document:', documentId);
      
      const headers = await getAuthHeaders();
      
      // First, get the document files list
      const filesResponse = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/files`,
        { headers }
      );

      console.log('📁 [Documents API] Document files:', filesResponse.data);
      
      const files = filesResponse.data.success ? filesResponse.data.data : filesResponse.data;
      
      if (!files || files.length === 0) {
        console.warn('⚠️ [Documents API] No files attached to document:', documentId);
        throw new Error('This document does not have a file attached yet. Please upload a file first.');
      }

      // Find the primary file, or use the first one
      const primaryFile = files.find((f: any) => f.is_primary) || files[0];
      
      // Get signed URL for the file
      const signedUrlResponse = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/files/${primaryFile.id}/signed-url`,
        { headers }
      );

      console.log('🟢 [Documents API] Signed URL obtained');
      
      const signedUrl = signedUrlResponse.data.success 
        ? signedUrlResponse.data.data.signed_url 
        : signedUrlResponse.data.signed_url;
      
      return { url: signedUrl, fileName: primaryFile.file_name };
    } catch (error) {
      console.error('❌ [Documents API] Get download URL error:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
      throw error;
    }
  },

  /**
   * Get a fresh signed download URL for the secure PDF
   */
  async getSecurePdfUrl(documentId: string): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/secure-pdf-url`,
        { headers }
      );
      
      const url = response.data.success 
        ? response.data.url 
        : response.data.signedUrl;
      
      return url;
    } catch (error) {
      console.error('❌ [Documents API] Get secure PDF URL error:', error);
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.error || error.message;
        throw new Error(errorMsg);
      }
      throw error;
    }
  },

  // =============================
  // HYBRID WORKFLOW METHODS
  // =============================

  /**
   * Pre-approve a document (locks content, generates SHA-256 hash, creates secure PDF)
   * Transitions document from 'draft' → 'pre_approved'
   */
  async preApproveDocument(documentId: string): Promise<{
    document: any;
    secure_pdf_url: string;
    content_hash: string;
  }> {
    try {
      console.log('🔵 [Documents API] Pre-approving document:', documentId);

      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/workflows/${documentId}/workflows/pre-approve`,
        {},
        { headers }
      );

      console.log('🟢 [Documents API] Document pre-approved:', response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Pre-approve error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Revert a pre-approved document back to draft (unlocks content editing)
   * Transitions document from 'pre_approved' → 'draft'
   */
  async revertPreApproval(documentId: string, reason?: string): Promise<{
    document: any;
    message: string;
  }> {
    try {
      console.log('🔵 [Documents API] Reverting pre-approval:', documentId);

      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/workflows/${documentId}/workflows/revert-pre-approval`,
        { reason: reason || 'Reverted by advisor for further editing' },
        { headers }
      );

      console.log('🟢 [Documents API] Pre-approval reverted:', response.data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Revert pre-approval error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Upload a scanned, physically signed document for AI verification
   * Sends the file to the AI service for signature detection
   * On success: transitions document from 'pre_approved' → 'approved'
   * On failure: returns error with AI scan analysis
   */
  async uploadSignedDocument(documentId: string, fileUrl: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    ai_analysis?: {
      has_signature: boolean;
      confidence_score: number;
      notes: string;
    };
    error?: string;
  }> {
    try {
      console.log('🔵 [Documents API] Uploading signed document:', documentId);

      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/workflows/${documentId}/workflows/upload-signed`,
        { file_url: fileUrl },
        { headers }
      );

      console.log('🟢 [Documents API] Signed document processed:', response.data);

      return response.data;
    } catch (error) {
      console.error('❌ [Documents API] Upload signed document error:', error);
      if (axios.isAxiosError(error)) {
        // Return the full error response for AI scan failures (400 status)
        if (error.response?.status === 400) {
          return {
            success: false,
            message: error.response.data?.error || 'Signature verification failed',
            ai_analysis: error.response.data?.ai_analysis,
            error: error.response.data?.error,
          };
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  // =============================
  // TEMPLATE MANAGEMENT METHODS
  // =============================

  /**
   * Fetch template by ID
   */
  async getTemplate(templateId: string): Promise<any> {
    try {
      console.log('🔵 [Documents API] Fetching template:', templateId);
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/templates/${templateId}`,
        { headers }
      );
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('❌ [Documents API] Get template error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Create an official master template
   */
  async createTemplate(templateData: {
    name: string;
    description?: string;
    content: string;
    fields?: any[];
    category?: string;
    tags?: string[];
    is_public?: boolean;
    file_url?: string;
  }): Promise<any> {
    try {
      console.log('🔵 [Documents API] Creating template:', templateData.name);
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/templates/`,
        {
          name: templateData.name,
          description: templateData.description || '',
          content: templateData.content || '<p></p>',
          fields: templateData.fields || [],
          category: templateData.category || 'general',
          tags: templateData.tags || [],
          is_public: templateData.is_public ?? true,
          file_url: templateData.file_url || null,
        },
        { headers }
      );
      console.log('🟢 [Documents API] Template created:', response.data);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('❌ [Documents API] Create template error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Convert an existing uploaded document into an official master template
   */
  async saveDocumentAsTemplate(
    documentId: string,
    templateData: { name: string; description?: string; category?: string }
  ): Promise<any> {
    try {
      console.log('🔵 [Documents API] Converting document to template:', documentId);
      const headers = await getAuthHeaders();

      // 1. Fetch document details to get content
      const docResponse = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}`,
        { headers }
      );
      const doc = docResponse.data.success ? docResponse.data.data : docResponse.data;

      // Extract HTML content string from doc.content object if needed
      let htmlContent = '<p></p>';
      if (typeof doc.content === 'string') {
        htmlContent = doc.content;
      } else if (doc.content?.html) {
        htmlContent = doc.content.html;
      }

      // 2. Call createTemplate endpoint
      return await this.createTemplate({
        name: templateData.name || doc.title,
        description: templateData.description || doc.description || '',
        content: htmlContent,
        category: templateData.category || doc.type || 'general',
        tags: [doc.type || 'document'],
        is_public: true,
        file_url: doc.file_url || null,
      });
    } catch (error) {
      console.error('❌ [Documents API] Save doc as template error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Generates a new DOCX file for a document based on its template fields
   */
  async generateDocx(
    documentId: string,
    fieldValues: Record<string, string>
  ): Promise<{ message: string; path: string }> {
    try {
      console.log('🔵 [Documents API] Generating DOCX for:', documentId);
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/generate-docx`,
        { field_values: fieldValues },
        { headers }
      );
      console.log('🟢 [Documents API] Generated DOCX:', response.data);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      console.error('❌ [Documents API] Generate DOCX error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  /**
   * Extracts dynamic template fields from the document's .docx file
   */
  async extractTemplateFields(documentId: string): Promise<{ name: string; label: string; required: boolean }[]> {
    try {
      console.log('🔵 [Documents API] Extracting fields for:', documentId);
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/extract-fields`,
        { headers }
      );
      console.log('🟢 [Documents API] Extracted fields:', response.data);
      return response.data.success ? response.data.data.fields : [];
    } catch (error) {
      console.error('❌ [Documents API] Extract Fields error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }
};

export default documentsAPI;
