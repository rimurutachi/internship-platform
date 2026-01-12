import { Router } from "express";
import * as signatureController from "../controllers/signatureController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Public endpoint (no auth) - QR code verification
router.get("/verify-public/:signatureId", signatureController.verifySignaturePublic);

// All other routes require authentication
router.use(authenticateToken);

// Generate RSA keypair + self-signed certificate for current user
router.post("/generate-certificate", signatureController.generateCertificate);

// Sign a document (requires private key)
router.post("/:documentId/sign", signatureController.signDocument);

// Verify a signature (requires public key)
router.post("/:signatureId/verify", signatureController.verifySignature);

// Get all signatures for a document
router.get("/:documentId/signatures", signatureController.getDocumentSignatures);

// Revoke a signature (signer or admin only)
router.delete("/:signatureId", signatureController.revokeSignature);

export default router;
