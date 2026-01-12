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

export default router;
