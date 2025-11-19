/**
 * Document API Service
 * 
 * Handles all document-related API calls
 */

import { get, post, put, patch, del } from '../client';
import type { Document, CollaborationSession, PaginatedResponse, ListParams } from '@/types/api';

/**
 * Create document data
 */
export interface CreateDocumentData {
  title: string;
  content?: string;
  document_type: 'report' | 'agreement' | 'evaluation' | 'general';
  internship_id?: string;
  is_collaborative?: boolean;
}

/**
 * Update document data
 */
export interface UpdateDocumentData {
  title?: string;
  content?: string;
  status?: 'draft' | 'review' | 'approved' | 'archived';
}

/**
 * Document service
 */
export const documentService = {
  /**
   * Get all documents with pagination and filtering
   */
  list: async (params?: ListParams): Promise<PaginatedResponse<Document>> => {
    return get<PaginatedResponse<Document>>('/documents', params);
  },

  /**
   * Get a specific document by ID
   */
  getById: async (id: string): Promise<Document> => {
    return get<Document>(`/documents/${id}`);
  },

  /**
   * Get documents by internship ID
   */
  getByInternship: async (internshipId: string, params?: ListParams): Promise<PaginatedResponse<Document>> => {
    return get<PaginatedResponse<Document>>(`/documents/internship/${internshipId}`, params);
  },

  /**
   * Create a new document
   */
  create: async (data: CreateDocumentData): Promise<Document> => {
    return post<Document>('/documents', data);
  },

  /**
   * Update a document
   */
  update: async (id: string, data: UpdateDocumentData): Promise<Document> => {
    return put<Document>(`/documents/${id}`, data);
  },

  /**
   * Delete a document
   */
  delete: async (id: string): Promise<void> => {
    return del(`/documents/${id}`);
  },

  /**
   * Get active collaboration sessions for a document
   */
  getSessions: async (documentId: string): Promise<CollaborationSession[]> => {
    return get<CollaborationSession[]>(`/documents/${documentId}/sessions`);
  },

  /**
   * Get document version history
   */
  getVersions: async (documentId: string): Promise<Array<{
    version: number;
    content: string;
    created_by: string;
    created_at: string;
  }>> => {
    return get(`/documents/${documentId}/versions`);
  },

  /**
   * Share document with users
   */
  share: async (documentId: string, userIds: string[]): Promise<void> => {
    return post(`/documents/${documentId}/share`, { user_ids: userIds });
  },

  /**
   * Update document status
   */
  updateStatus: async (id: string, status: Document['status']): Promise<Document> => {
    return patch<Document>(`/documents/${id}/status`, { status });
  },
};
