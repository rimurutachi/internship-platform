// Admin Documents Advanced API Client (proxying to backend)
import { apiClient } from './client';

const BASE = '/admin/documents';

export const adminDocumentsAdvancedAPI = {
  // Blockchain
  recordBlockchain(documentId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/blockchain/record`, payload).then(r => r.data);
  },
  getLedger(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/blockchain/ledger`).then(r => r.data);
  },
  verifyDocument(documentId: string) {
    return apiClient.post(`${BASE}/${documentId}/blockchain/verify`, {}).then(r => r.data);
  },

  // Signatures
  signDocument(documentId: string, payload: any) {
    // payload should have: { version_id, content, private_key }
    if (!payload.content || !payload.private_key) {
      throw new Error('Content and private_key are required for signing');
    }
    return apiClient.post(`${BASE}/${documentId}/signatures/sign`, payload).then(r => r.data);
  },
  getSignatures(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/signatures`).then(r => r.data);
  },
  verifySignature(documentId: string, signatureId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/signatures/${signatureId}/verify`, payload).then(r => r.data);
  },

  // Access Control
  grantAccess(documentId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/access/grant`, payload).then(r => r.data);
  },
  listAccess(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/access`).then(r => r.data);
  },
  revokeAccess(documentId: string, accessId: string) {
    return apiClient.delete(`${BASE}/${documentId}/access/${accessId}`).then(r => r.data);
  },
  getAudit(documentId: string, limit = 100) {
    return apiClient.get(`${BASE}/${documentId}/audit`, { params: { limit } }).then(r => r.data);
  },
  getAuditStats(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/audit/stats`).then(r => r.data);
  },

  // Workflows
  createWorkflow(documentId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/workflows`, payload).then(r => r.data);
  },
  listWorkflows(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/workflows`).then(r => r.data);
  },
  getWorkflowApprovals(documentId: string, workflowId: string) {
    return apiClient.get(`${BASE}/${documentId}/workflows/${workflowId}/approvals`).then(r => r.data);
  },
  getWorkflowProgress(documentId: string, workflowId: string) {
    return apiClient.get(`${BASE}/${documentId}/workflows/${workflowId}/progress`).then(r => r.data);
  },

  // Templates
  createTemplate(payload: any) {
    return apiClient.post(`${BASE}/templates`, payload).then(r => r.data);
  },
  listTemplates(params?: Record<string, any>) {
    return apiClient.get(`${BASE}/templates`, { params }).then(r => r.data);
  },
  getTemplate(templateId: string) {
    return apiClient.get(`${BASE}/templates/${templateId}`).then(r => r.data);
  },
  updateTemplate(templateId: string, payload: any) {
    return apiClient.patch(`${BASE}/templates/${templateId}`, payload).then(r => r.data);
  },
  deleteTemplate(templateId: string) {
    return apiClient.delete(`${BASE}/templates/${templateId}`).then(r => r.data);
  },

  // Collaboration (admin scoped)
  initializeSession(documentId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/collaboration/sessions`, payload).then(r => r.data);
  },
  recordChange(documentId: string, payload: any) {
    return apiClient.post(`${BASE}/${documentId}/collaboration/changes`, payload).then(r => r.data);
  },
  getChanges(documentId: string, limit = 100) {
    return apiClient.get(`${BASE}/${documentId}/collaboration/changes`, { params: { limit } }).then(r => r.data);
  },
  getActiveUsers(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/collaboration/users`).then(r => r.data);
  },
  undo(documentId: string) {
    return apiClient.post(`${BASE}/${documentId}/collaboration/undo`).then(r => r.data);
  },
  redo(documentId: string) {
    return apiClient.post(`${BASE}/${documentId}/collaboration/redo`).then(r => r.data);
  },
  getStackStatus(documentId: string) {
    return apiClient.get(`${BASE}/${documentId}/collaboration/stack-status`).then(r => r.data);
  },
};

export default adminDocumentsAdvancedAPI;
