"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
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
 * @route   GET /api/admin/documents/:id/collaboration-info
 * @desc    Get active collaborators from collaboration sessions
 * @access  Admin
 */
router.get('/:id/collaboration-info', documentsController_1.getCollaborators);
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
exports.default = router;
//# sourceMappingURL=documents.js.map