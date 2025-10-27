import { Router } from "express";
import * as documentController from "../controllers/documentController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

// Document CRUD
router.post("/", documentController.createDocument);
router.get("/:id", documentController.getDocument);
router.put("/:id", documentController.updateDocument);
router.delete(
  "/:id",
  requireRole(["admin"]),
  documentController.deleteDocument
);

// Version control
router.get("/:id/versions", documentController.getVersions);
router.post("/:id/versions", documentController.createVersion);

export default router;
