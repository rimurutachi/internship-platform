import { Router } from "express";
import * as workflowController from "../controllers/workflowController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Create workflow for a document
router.post("/:documentId/workflows", authenticateToken, workflowController.createWorkflow);

// Get specific workflow
router.get("/workflows/:workflowId", authenticateToken, workflowController.getWorkflow);

// Update workflow stage/status
router.patch("/:workflowId/workflows", authenticateToken, workflowController.updateWorkflowStage);

// List all workflows for a document
router.get("/:documentId/workflows", authenticateToken, workflowController.listDocumentWorkflows);

// Get workflow approvals
router.get("/:workflowId/workflows/approvals", authenticateToken, workflowController.getWorkflowApprovals);

// Submit approval for a workflow (new)
router.post("/:approvalId/approvals/submit", authenticateToken, workflowController.submitApproval);

// Get workflow progress metrics (new)
router.get("/:workflowId/workflows/progress", authenticateToken, workflowController.getWorkflowProgress);

// Pre-approve a draft document (locks content editing, generates content hash)
router.post("/:documentId/workflows/pre-approve", authenticateToken, workflowController.preApproveDraft);

// Revert a pre-approved document back to draft (unlocks content editing)
router.post("/:documentId/workflows/revert-pre-approval", authenticateToken, workflowController.revertPreApproval);

// Upload and AI-scan a physically signed document to finalize approval
router.post("/:documentId/workflows/upload-signed", authenticateToken, workflowController.uploadSignedDocument);

export default router;

