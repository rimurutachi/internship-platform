import { Router } from "express";
import * as documentController from "../controllers/documentController";
import { authenticateToken, requireRole } from "../middleware/auth";
import * as fileController from "../controllers/fileController";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Document CRUD
router.get("/", documentController.getDocuments);
router.post("/", documentController.createDocument);
router.get("/:id", documentController.getDocument);
router.put("/:id", documentController.updateDocument);
router.delete("/:id", documentController.deleteDocument); // Allow owners to delete

// Version control
router.get("/:id/versions", documentController.getVersions);
router.post("/:id/versions", documentController.createVersion);
router.get("/:id/versions/:versionId/download", documentController.getVersionDownloadUrl);

// Files
router.post("/:id/files", upload.single("file"), fileController.uploadFile);
router.get("/:id/files", fileController.listFiles);
router.get("/files/:fileId/signed-url", fileController.getSignedUrl);
router.delete("/files/:fileId", fileController.deleteFile);

export default router;
