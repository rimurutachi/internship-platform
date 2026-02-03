import { Router } from "express";
import * as collaborationController from "../controllers/collaborationController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Initialize collaboration session
router.post("/:documentId/sessions", authenticateToken, collaborationController.initializeSession);

// End collaboration session
router.delete("/:documentId/sessions/:sessionId", authenticateToken, collaborationController.endSession);

// Record document change
router.post("/:documentId/changes", authenticateToken, collaborationController.recordChange);

// Get change history
router.get("/:documentId/changes", authenticateToken, collaborationController.getChangeHistory);

// Update user presence (cursor, editing state)
router.patch("/:documentId/presence", authenticateToken, collaborationController.updatePresence);

// Get active users in document
router.get("/:documentId/users", authenticateToken, collaborationController.getActiveUsers);

// Undo operation
router.post("/:documentId/undo", authenticateToken, collaborationController.undoChange);

// Redo operation
router.post("/:documentId/redo", authenticateToken, collaborationController.redoChange);

// Get undo/redo stack status
router.get("/:documentId/stack-status", authenticateToken, collaborationController.getStackStatus);

// Get collaboration activity statistics
router.get("/:documentId/activity-stats", authenticateToken, collaborationController.getActivityStats);

export default router;
