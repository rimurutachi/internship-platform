import { Router } from "express";
import * as accessController from "../controllers/accessController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Grant access to a document
router.post("/:documentId/access/grant", authenticateToken, accessController.grantAccess);

// Revoke access
router.delete("/:accessId/revoke", authenticateToken, accessController.revokeAccess);

// List document access grants
router.get("/:documentId/access", authenticateToken, accessController.listDocumentAccess);

// Get document audit log
router.get("/:documentId/audit", authenticateToken, accessController.getDocumentAudit);

// Get audit statistics
router.get("/:documentId/audit/stats", authenticateToken, accessController.getAuditStats);

export default router;
