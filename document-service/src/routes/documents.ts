import { Router } from "express";
import * as documentController from "../controllers/documentController";
import { authenticateToken, requireRole } from "../middleware/auth";
import * as fileController from "../controllers/fileController";
import multer from "multer";
import { uploadLimiter } from "../middleware/rateLimiter";

const router = Router();

// =============================================================================
// SECURITY: File Upload Configuration (OWASP Best Practice)
// =============================================================================

/**
 * Allowed MIME types for document uploads
 * Whitelist approach - only explicitly allowed types are accepted
 */
const ALLOWED_MIME_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Maximum file size: 50MB
 * Adjustable via UPLOAD_MAX_SIZE_MB environment variable
 */
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE_MB || "50") * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file per request
  },
  fileFilter: (req, file, cb) => {
    // SECURITY: Validate MIME type against whitelist
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      // SECURITY: Sanitize filename to prevent path traversal
      const sanitizedName = file.originalname
        .replace(/\.\./g, "") // Remove path traversal
        .replace(/[/\\]/g, "") // Remove slashes
        .replace(/[\x00-\x1f\x80-\x9f]/g, ""); // Remove control characters
      
      file.originalname = sanitizedName;
      cb(null, true);
    } else {
      console.warn(`⚠️ SECURITY: Rejected file upload with MIME type: ${file.mimetype}`);
      cb(new Error(`File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, images (JPEG, PNG, GIF, WebP), text files.`));
    }
  }
});

// Multer error handler middleware
const handleUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
};

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

// Files - SECURITY: Apply upload rate limiter and file validation
router.post("/:id/files", uploadLimiter, upload.single("file"), handleUploadError, fileController.uploadFile);
router.get("/:id/files", fileController.listFiles);
router.get("/files/:fileId/signed-url", fileController.getSignedUrl);
router.delete("/files/:fileId", fileController.deleteFile);

export default router;
