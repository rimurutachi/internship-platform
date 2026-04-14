"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const documentServiceProxy_1 = __importDefault(require("../../services/documentServiceProxy"));
const documentsController_1 = require("../../controllers/admin/documentsController");
const router = express_1.default.Router();
// Middleware to check admin role
const requireAdmin = (req, res, next) => {
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
router.use(auth_1.authenticateToken);
router.use(requireAdmin);
/**
 * @route   GET /api/admin/documents/stats/overview
 * @desc    Get document statistics
 * @access  Admin
 */
router.get('/stats/overview', documentsController_1.getDocumentStats);
/**
 * @route   GET /api/admin/documents
 * @desc    Get all documents with filtering, sorting, and pagination
 * @query   type, status, owner_id, search, sort_by, sort_order, page, limit
 * @access  Admin
 */
router.get('/', documentsController_1.getAllDocuments);
/**
 * @route   GET /api/admin/documents/:id
 * @desc    Get single document with full details (versions, comments, workflow, collaborators)
 * @access  Admin
 */
router.get('/:id', documentsController_1.getDocument);
/**
 * @route   GET /api/admin/documents/:id/versions
 * @desc    Get document version history with semantic version sorting
 * @access  Admin
 */
router.get('/:id/versions', documentsController_1.getVersions);
/**
 * @route   GET /api/admin/documents/:id/comments
 * @desc    Get document comments with threading
 * @access  Admin
 */
router.get('/:id/comments', documentsController_1.getComments);
/**
 * @route   GET /api/admin/documents/:id/workflow
 * @desc    Get document workflow and approvals
 * @access  Admin
 */
router.get('/:id/workflow', documentsController_1.getWorkflow);
/**
 * @route   PATCH /api/admin/documents/:id/status
 * @desc    Update document status with validation
 * @body    { status: DocumentStatus }
 * @access  Admin
 */
router.patch('/:id/status', documentsController_1.updateStatus);
/**
 * @route   PATCH /api/admin/documents/:id/workflow
 * @desc    Update workflow (approve/reject/advance)
 * @body    { action: 'approve' | 'reject' | 'advance', comments?: string }
 * @access  Admin
 */
router.patch('/:id/workflow', documentsController_1.updateWorkflow);
/**
 * @route   PATCH /api/admin/documents/:id/archive
 * @desc    Archive a document
 * @access  Admin
 */
router.patch('/:id/archive', documentsController_1.archiveDocument);
/**
 * @route   DELETE /api/admin/documents/:id
 * @desc    Delete a document
 * @access  Admin
 */
router.delete('/:id', documentsController_1.deleteDocument);
// ===== ACCESS CONTROL OPERATIONS =====
/**
 * @route   POST /api/admin/documents/:id/access/grant
 * @desc    Grant document access to user
 * @access  Admin
 */
router.post('/:id/access/grant', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.grantAccess(req.params.id, req.body, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/access
 * @desc    List document access permissions
 * @access  Admin
 */
router.get('/:id/access', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.listDocumentAccess(req.params.id, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/admin/documents/:id/access/:accessId
 * @desc    Revoke document access
 * @access  Admin
 */
router.delete('/:id/access/:accessId', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.revokeAccess(req.params.accessId, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/audit
 * @desc    Get document audit log
 * @access  Admin
 */
router.get('/:id/audit', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const result = await documentServiceProxy_1.default.getDocumentAudit(req.params.id, limit, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/audit/stats
 * @desc    Get document audit statistics
 * @access  Admin
 */
router.get('/:id/audit/stats', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.getAuditStats(req.params.id, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
// ===== WORKFLOW OPERATIONS =====
/**
 * @route   POST /api/admin/documents/:id/workflows
 * @desc    Create workflow for document
 * @access  Admin
 */
router.post('/:id/workflows', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.createWorkflow(req.params.id, req.body, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/workflows
 * @desc    List document workflows
 * @access  Admin
 */
router.get('/:id/workflows', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.listDocumentWorkflows(req.params.id, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/workflows/:workflowId/approvals
 * @desc    Get workflow approvals
 * @access  Admin
 */
router.get('/:id/workflows/:workflowId/approvals', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.getWorkflowApprovals(req.params.workflowId, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/:id/workflows/:workflowId/progress
 * @desc    Get workflow progress
 * @access  Admin
 */
router.get('/:id/workflows/:workflowId/progress', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.getWorkflowProgress(req.params.workflowId, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
// ===== TEMPLATE OPERATIONS =====
/**
 * @route   POST /api/admin/documents/templates
 * @desc    Create document template
 * @access  Admin
 */
router.post('/templates', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.createTemplate(req.body, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/templates
 * @desc    List templates with filters
 * @access  Admin
 */
router.get('/templates', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.listTemplates(req.query, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   GET /api/admin/documents/templates/:templateId
 * @desc    Get template details
 * @access  Admin
 */
router.get('/templates/:templateId', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.getTemplate(req.params.templateId, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   PATCH /api/admin/documents/templates/:templateId
 * @desc    Update template
 * @access  Admin
 */
router.patch('/templates/:templateId', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.updateTemplate(req.params.templateId, req.body, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
/**
 * @route   DELETE /api/admin/documents/templates/:templateId
 * @desc    Delete template
 * @access  Admin
 */
router.delete('/templates/:templateId', async (req, res) => {
    try {
        const result = await documentServiceProxy_1.default.deleteTemplate(req.params.templateId, req.headers.authorization?.split(' ')[1]);
        res.json(result);
    }
    catch (error) {
        res.status(error.response?.status || 500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map