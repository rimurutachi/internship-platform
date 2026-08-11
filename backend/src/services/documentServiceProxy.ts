/**
 * Document Service Proxy
 * Calls document-service (port 6000) for all document operations
 * Acts as gateway between backend and document-service
 */

import axios, { AxiosError } from 'axios';

// Document-service uses a single port for HTTP + WebSocket (default 6001)
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:6001';

interface ProxyConfig {
  token?: string;
}

class DocumentServiceProxy {
  private baseURL: string;

  constructor() {
    this.baseURL = DOCUMENT_SERVICE_URL;
  }

  /**
   * Make authenticated request to document-service
   */
  private async request(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    token?: string
  ) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log(`📡 [Proxy] ${method} ${endpoint}`);

      const config = {
        method,
        url,
        headers,
        ...(data && { data }),
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ [Proxy] Request failed`, error);
      throw error;
    }
  }

  // ===== FILE OPERATIONS =====

  async uploadFile(documentId: string, file: Buffer, fileName: string, token: string) {
    const formData = new FormData();
    const blob = new Blob([file]);
    formData.append('file', blob, fileName);
    formData.append('documentId', documentId);

    return this.request('POST', `/api/documents/${documentId}/files`, formData, token);
  }

  async listFiles(documentId: string, token: string) {
    return this.request('GET', `/api/documents/${documentId}/files`, undefined, token);
  }

  async getSignedUrl(fileId: string, token: string) {
    return this.request('GET', `/api/documents/files/${fileId}/signed-url`, undefined, token);
  }

  async deleteFile(fileId: string, token: string) {
    return this.request('DELETE', `/api/documents/files/${fileId}`, undefined, token);
  }

  // ===== ACCESS CONTROL OPERATIONS =====

  async grantAccess(documentId: string, data: any, token: string) {
    return this.request('POST', `/api/access/${documentId}/access/grant`, data, token);
  }

  async revokeAccess(accessId: string, token: string) {
    return this.request('DELETE', `/api/access/${accessId}/revoke`, {}, token);
  }

  async listDocumentAccess(documentId: string, token: string) {
    return this.request('GET', `/api/access/${documentId}/access`, undefined, token);
  }

  async getDocumentAudit(documentId: string, limit: number = 100, token: string) {
    return this.request('GET', `/api/access/${documentId}/audit?limit=${limit}`, undefined, token);
  }

  async getAuditStats(documentId: string, token: string) {
    return this.request('GET', `/api/access/${documentId}/audit/stats`, undefined, token);
  }

  // ===== WORKFLOW OPERATIONS =====

  async createWorkflow(documentId: string, data: any, token: string) {
    return this.request('POST', `/api/workflows/${documentId}/workflows`, data, token);
  }

  async getWorkflow(workflowId: string, token: string) {
    return this.request('GET', `/api/workflows/workflows/${workflowId}`, undefined, token);
  }

  async updateWorkflowStage(workflowId: string, data: any, token: string) {
    return this.request('PATCH', `/api/workflows/${workflowId}/workflows`, data, token);
  }

  async listDocumentWorkflows(documentId: string, token: string) {
    return this.request('GET', `/api/workflows/${documentId}/workflows`, undefined, token);
  }

  async getWorkflowApprovals(workflowId: string, token: string) {
    return this.request('GET', `/api/workflows/${workflowId}/workflows/approvals`, undefined, token);
  }

  async submitApproval(approvalId: string, data: any, token: string) {
    return this.request('POST', `/api/workflows/${approvalId}/approvals/submit`, data, token);
  }

  async getWorkflowProgress(workflowId: string, token: string) {
    return this.request('GET', `/api/workflows/${workflowId}/workflows/progress`, undefined, token);
  }

  // ===== TEMPLATE OPERATIONS =====

  async createTemplate(data: any, token: string) {
    return this.request('POST', `/api/templates/`, data, token);
  }

  async getTemplate(templateId: string, token: string) {
    return this.request('GET', `/api/templates/${templateId}`, undefined, token);
  }

  async listTemplates(filters?: any, token?: string) {
    const query = new URLSearchParams(filters || {}).toString();
    return this.request('GET', `/api/templates/?${query}`, undefined, token);
  }

  async updateTemplate(templateId: string, data: any, token: string) {
    return this.request('PATCH', `/api/templates/${templateId}`, data, token);
  }

  async deleteTemplate(templateId: string, token: string) {
    return this.request('DELETE', `/api/templates/${templateId}`, undefined, token);
  }

  async createDocumentFromTemplate(templateId: string, data: any, token: string) {
    return this.request('POST', `/api/templates/${templateId}/create-document`, data, token);
  }

  async getTemplatesByCategory(category: string, limit: number = 50, token: string) {
    return this.request('GET', `/api/templates/category/${category}?limit=${limit}`, undefined, token);
  }

  async searchTemplatesByTags(tags: string[], limit: number = 50, token: string) {
    return this.request('POST', `/api/templates/search/tags?limit=${limit}`, { tags }, token);
  }

  async getPublicTemplates(limit: number = 100) {
    return this.request('GET', `/api/templates/public/list?limit=${limit}`);
  }

  // ===== SIGNATURE VERIFICATION =====

  async verifySignaturePublic(signatureId: string) {
    return this.request('GET', `/api/public/signatures/verify/${signatureId}`);
  }

  async verifyDocumentPublic(documentId: string) {
    return this.request('GET', `/api/public/verify/${documentId}`);
  }

  // ===== HEALTH CHECK =====

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      console.log('✅ [Proxy] Document-service is healthy');
      return response.status === 200;
    } catch (error) {
      console.error('❌ [Proxy] Document-service is unavailable');
      return false;
    }
  }
}

export default new DocumentServiceProxy();
