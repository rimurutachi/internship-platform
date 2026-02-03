import express from 'express';
import { authenticateToken } from '../../middleware/auth';
import documentServiceProxy from '../../services/documentServiceProxy';
import {
  getAllDocuments,
  getDocument,
  getVersions,
  getComments,
  getWorkflow,
  updateStatus,
  updateWorkflow,
  getCollaborators,
  archiveDocument,
  deleteDocument,
  getDocumentStats
} from '../../controllers/admin/documentsController';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }

  next();
};

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/documents/stats/overview
 * @desc    Get document statistics
 * @access  Admin
 */
router.get('/stats/overview', getDocumentStats);

/**
 * @route   GET /api/admin/documents
 * @desc    Get all documents with filtering, sorting, and pagination
 * @query   type, status, owner_id, search, sort_by, sort_order, page, limit
 * @access  Admin
 */
router.get('/', getAllDocuments);

/**
 * @route   GET /api/admin/documents/:id
 * @desc    Get single document with full details (versions, comments, workflow, collaborators)
 * @access  Admin
 */
router.get('/:id', getDocument);

/**
 * @route   GET /api/admin/documents/:id/versions
 * @desc    Get document version history with semantic version sorting
 * @access  Admin
 */
router.get('/:id/versions', getVersions);

/**
 * @route   GET /api/admin/documents/:id/comments
 * @desc    Get document comments with threading
 * @access  Admin
 */
router.get('/:id/comments', getComments);

/**
 * @route   GET /api/admin/documents/:id/workflow
 * @desc    Get document workflow and approvals
 * @access  Admin
 */
router.get('/:id/workflow', getWorkflow);

/**
 * @route   GET /api/admin/documents/:id/collaboration-info
 * @desc    Get active collaborators from collaboration sessions
 * @access  Admin
 */
router.get('/:id/collaboration-info', getCollaborators);

/**
 * @route   PATCH /api/admin/documents/:id/status
 * @desc    Update document status with validation
 * @body    { status: DocumentStatus }
 * @access  Admin
 */
router.patch('/:id/status', updateStatus);

/**
 * @route   PATCH /api/admin/documents/:id/workflow
 * @desc    Update workflow (approve/reject/advance)
 * @body    { action: 'approve' | 'reject' | 'advance', comments?: string }
 * @access  Admin
 */
router.patch('/:id/workflow', updateWorkflow);

/**
 * @route   PATCH /api/admin/documents/:id/archive
 * @desc    Archive a document
 * @access  Admin
 */
router.patch('/:id/archive', archiveDocument);

/**
 * @route   DELETE /api/admin/documents/:id
 * @desc    Delete a document
 * @access  Admin
 */
router.delete('/:id', deleteDocument);

// ===== BLOCKCHAIN OPERATIONS =====

/**
 * @route   POST /api/admin/documents/:id/blockchain/record
 * @desc    Record blockchain entry for document
 * @access  Admin
 */
router.post('/:id/blockchain/record', async (req: any, res: any) => {
  try {
    console.log('📡 [Backend Route] Recording blockchain entry for document:', req.params.id);
    const result = await documentServiceProxy.recordBlockchainEntry(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    console.error('❌ [Backend Route] Blockchain record failed:', error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/blockchain/ledger
 * @desc    Get blockchain ledger for document
 * @access  Admin
 */
router.get('/:id/blockchain/ledger', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getDocumentLedger(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/documents/:id/blockchain/verify
 * @desc    Verify document blockchain integrity
 * @access  Admin
 */
router.post('/:id/blockchain/verify', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.verifyDocumentIntegrity(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ===== SIGNATURE OPERATIONS =====

/**
 * @route   POST /api/admin/documents/:id/signatures/sign
 * @desc    Sign document with digital signature
 * @access  Admin
 */
router.post('/:id/signatures/sign', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.signDocument(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/signatures
 * @desc    Get document signatures
 * @access  Admin
 */
router.get('/:id/signatures', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getDocumentSignatures(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/documents/:id/signatures/:signatureId/verify
 * @desc    Verify a signature
 * @access  Admin
 */
router.post('/:id/signatures/:signatureId/verify', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.verifySignature(
      req.params.signatureId,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ===== ACCESS CONTROL OPERATIONS =====

/**
 * @route   POST /api/admin/documents/:id/access/grant
 * @desc    Grant document access to user
 * @access  Admin
 */
router.post('/:id/access/grant', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.grantAccess(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/access
 * @desc    List document access permissions
 * @access  Admin
 */
router.get('/:id/access', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.listDocumentAccess(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/documents/:id/access/:accessId
 * @desc    Revoke document access
 * @access  Admin
 */
router.delete('/:id/access/:accessId', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.revokeAccess(
      req.params.accessId,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/audit
 * @desc    Get document audit log
 * @access  Admin
 */
router.get('/:id/audit', async (req: any, res: any) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await documentServiceProxy.getDocumentAudit(
      req.params.id,
      limit,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/audit/stats
 * @desc    Get document audit statistics
 * @access  Admin
 */
router.get('/:id/audit/stats', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getAuditStats(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ===== WORKFLOW OPERATIONS =====

/**
 * @route   POST /api/admin/documents/:id/workflows
 * @desc    Create workflow for document
 * @access  Admin
 */
router.post('/:id/workflows', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.createWorkflow(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/workflows
 * @desc    List document workflows
 * @access  Admin
 */
router.get('/:id/workflows', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.listDocumentWorkflows(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/workflows/:workflowId/approvals
 * @desc    Get workflow approvals
 * @access  Admin
 */
router.get('/:id/workflows/:workflowId/approvals', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getWorkflowApprovals(
      req.params.workflowId,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/workflows/:workflowId/progress
 * @desc    Get workflow progress
 * @access  Admin
 */
router.get('/:id/workflows/:workflowId/progress', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getWorkflowProgress(
      req.params.workflowId,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ===== TEMPLATE OPERATIONS =====

/**
 * @route   POST /api/admin/documents/templates
 * @desc    Create document template
 * @access  Admin
 */
router.post('/templates', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.createTemplate(
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/templates
 * @desc    List templates with filters
 * @access  Admin
 */
router.get('/templates', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.listTemplates(
      req.query,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/templates/:templateId
 * @desc    Get template details
 * @access  Admin
 */
router.get('/templates/:templateId', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getTemplate(
      req.params.templateId,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   PATCH /api/admin/documents/templates/:templateId
 * @desc    Update template
 * @access  Admin
 */
router.patch('/templates/:templateId', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.updateTemplate(
      req.params.templateId,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/documents/templates/:templateId
 * @desc    Delete template
 * @access  Admin
 */
router.delete('/templates/:templateId', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.deleteTemplate(
      req.params.templateId,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// ===== COLLABORATION OPERATIONS =====

/**
 * @route   POST /api/admin/documents/:id/collaboration/sessions
 * @desc    Initialize collaboration session
 * @access  Admin
 */
router.post('/:id/collaboration/sessions', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.initializeSession(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/documents/:id/collaboration/changes
 * @desc    Record collaboration change
 * @access  Admin
 */
router.post('/:id/collaboration/changes', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.recordChange(
      req.params.id,
      req.body,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/collaboration/changes
 * @desc    Get change history
 * @access  Admin
 */
router.get('/:id/collaboration/changes', async (req: any, res: any) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await documentServiceProxy.getChangeHistory(
      req.params.id,
      limit,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/collaboration/users
 * @desc    Get active collaborators
 * @access  Admin
 */
router.get('/:id/collaboration/users', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getActiveUsers(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/documents/:id/collaboration/undo
 * @desc    Undo last change
 * @access  Admin
 */
router.post('/:id/collaboration/undo', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.undoChange(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/documents/:id/collaboration/redo
 * @desc    Redo last change
 * @access  Admin
 */
router.post('/:id/collaboration/redo', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.redoChange(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/documents/:id/collaboration/stack-status
 * @desc    Get undo/redo stack status
 * @access  Admin
 */
router.get('/:id/collaboration/stack-status', async (req: any, res: any) => {
  try {
    const result = await documentServiceProxy.getStackStatus(
      req.params.id,
      req.headers.authorization?.split(' ')[1]
    );
    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

export default router;
