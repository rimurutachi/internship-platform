/* eslint-disable @typescript-eslint/no-explicit-any */
// Admin Documents API Client
import { apiClient } from './client';
import {
  DocumentsResponse,
  DocumentResponse,
  DocumentVersion,
  DocumentComment,
  DocumentWorkflow,
  StatsResponse,
  DocumentFilters,
  DocumentSortOptions,
  PaginationOptions,
  UpdateStatusData,
  UpdateWorkflowData
} from '@/types/documents';

const DOCUMENTS_ENDPOINT = '/admin/documents';

export const adminDocumentsAPI = {
  /**
   * Get all documents with filtering, sorting, and pagination
   */
  async getDocuments(
    filters?: DocumentFilters,
    pagination?: PaginationOptions,
    sort?: DocumentSortOptions
  ): Promise<DocumentsResponse> {
    try {
      const params = new URLSearchParams();
      
      // Apply filters
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.owner_id) params.append('owner_id', filters.owner_id);
      if (filters?.search) params.append('search', filters.search);
      
      // Apply pagination
      if (pagination?.page) params.append('page', String(pagination.page));
      if (pagination?.limit) params.append('limit', String(pagination.limit));
      
      // Apply sorting
      if (sort?.sort_by) params.append('sort_by', sort.sort_by);
      if (sort?.sort_order) params.append('sort_order', sort.sort_order);
      
      const queryString = params.toString();
      const url = `${DOCUMENTS_ENDPOINT}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Get documents error:', error);
      throw error;
    }
  },

  /**
   * Get single document with full details
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/${documentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  /**
   * Get document version history
   */
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/${documentId}/versions`);
      // Handle both success wrapper and direct array
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data || [];
    } catch (error: any) {
      console.error('Get versions error:', error);
      throw error;
    }
  },

  /**
   * Get download URL for a specific version
   */
  async getVersionDownloadUrl(documentId: string, versionId: string): Promise<{ url: string; file_name: string }> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/${documentId}/versions/${versionId}/download`);
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error: any) {
      console.error('Get version download URL error:', error);
      throw error;
    }
  },

  /**
   * Get document comments
   */
  async getComments(documentId: string): Promise<DocumentComment[]> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/${documentId}/comments`);
      return response.data;
    } catch (error: any) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  /**
   * Get document workflow
   */
  async getWorkflow(documentId: string): Promise<DocumentWorkflow[]> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/${documentId}/workflow`);
      return response.data;
    } catch (error: any) {
      console.error('Get workflow error:', error);
      throw error;
    }
  },



  /**
   * Update document status
   */
  async updateStatus(documentId: string, data: UpdateStatusData): Promise<DocumentResponse> {
    try {
      const response = await apiClient.patch(`${DOCUMENTS_ENDPOINT}/${documentId}/status`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update status error:', error);
      throw error;
    }
  },

  /**
   * Update workflow (approve/reject/advance)
   */
  async updateWorkflow(documentId: string, data: UpdateWorkflowData): Promise<any> {
    try {
      const response = await apiClient.patch(`${DOCUMENTS_ENDPOINT}/${documentId}/workflow`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update workflow error:', error);
      throw error;
    }
  },

  /**
   * Archive a document
   */
  async archiveDocument(documentId: string): Promise<DocumentResponse> {
    try {
      const response = await apiClient.patch(`${DOCUMENTS_ENDPOINT}/${documentId}/archive`);
      return response.data;
    } catch (error: any) {
      console.error('Archive document error:', error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete(`${DOCUMENTS_ENDPOINT}/${documentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete document error:', error);
      throw error;
    }
  },

  /**
   * Get document statistics
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await apiClient.get(`${DOCUMENTS_ENDPOINT}/stats/overview`);
      return response.data;
    } catch (error: any) {
      console.error('Get stats error:', error);
      throw error;
    }
  }
};

export default adminDocumentsAPI;
