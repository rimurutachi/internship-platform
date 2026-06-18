"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController = __importStar(require("../controllers/documentController"));
const auth_1 = require("../middleware/auth");
const fileController = __importStar(require("../controllers/fileController"));
const multer_1 = __importDefault(require("multer"));
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
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
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
        }
        else {
            console.warn(`⚠️ SECURITY: Rejected file upload with MIME type: ${file.mimetype}`);
            cb(new Error(`File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, images (JPEG, PNG, GIF, WebP), text files.`));
        }
    }
});
// Multer error handler middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
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
    }
    else if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};
router.use(auth_1.authenticateToken);
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
router.post("/:id/files", rateLimiter_1.uploadLimiter, upload.single("file"), handleUploadError, fileController.uploadFile);
router.get("/:id/files", fileController.listFiles);
router.get("/files/:fileId/signed-url", fileController.getSignedUrl);
router.delete("/files/:fileId", fileController.deleteFile);
exports.default = router;
