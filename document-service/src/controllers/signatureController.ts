import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import signatureService from "../services/signatureService";
import deviceFingerprintService from "../services/deviceFingerprintService";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function ensureDocumentAccess(documentId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, owner_id")
    .eq("id", documentId)
    .single();

  if (docError || !doc) return false;
  if (doc.owner_id === userId) return true;

  const { data: dac, error: dacError } = await supabase
    .from("document_access_control")
    .select("permission_level, expires_at, revoked_at")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (dacError) return false;
  if (!dac) return false;
  if (dac.expires_at && new Date(dac.expires_at) < new Date()) return false;

  return true;
}

export async function signDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { version_id, content, private_key } = req.body;

    if (!content || !private_key) {
      return res.status(400).json({
        success: false,
        error: "content and private_key are required.",
      });
    }

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to sign this document." });
    }

    // Verify private key format
    if (!private_key.includes("-----BEGIN")) {
      return res.status(400).json({ success: false, error: "Invalid private key format." });
    }

    const signatureData = signatureService.signContent({
      content,
      privateKey: private_key,
    });

    // Get signer info for certificate
    const { data: signerUser, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", req.user.id)
      .single();

    if (userError || !signerUser) {
      return res.status(404).json({ success: false, error: "Signer profile not found." });
    }

    const certificateData = {
      signer_id: req.user.id,
      signer_name: `${signerUser.first_name} ${signerUser.last_name}`,
      signer_email: signerUser.email,
      signed_at: new Date().toISOString(),
    };

    // Phase A: Capture device metadata for enhanced security
    console.log("🔵 [Signature] Capturing device fingerprint metadata");
    const fingerprint = await deviceFingerprintService.createFingerprint(req);

    const signature = await signatureService.storeSignature({
      documentId,
      documentVersionId: version_id,
      signerId: req.user.id,
      signatureData,
      certificateData,
      metadata: { 
        content_preview: (content as string).substring(0, 100),
        captured_at: fingerprint.timestamp,
      },
      // Phase A: Enhanced metadata
      ipAddress: fingerprint.ip_address,
      deviceFingerprint: fingerprint.device_fingerprint,
      geolocation: fingerprint.geolocation,
      physicalVerificationStatus: 'pending', // Invalid until admin verifies scanned copy
    });

    return res.status(201).json({ success: true, data: signature });
  } catch (error) {
    console.error("❌ [Signature Controller] Sign error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function verifySignature(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { signatureId } = req.params;
    const { content, public_key } = req.body;

    if (!content || !public_key) {
      return res.status(400).json({
        success: false,
        error: "content and public_key are required.",
      });
    }

    const { data: sig, error: sigError } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("id", signatureId)
      .single();

    if (sigError || !sig) {
      return res.status(404).json({ success: false, error: "Signature not found." });
    }

    const hasAccess = await ensureDocumentAccess(
      sig.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to verify." });
    }

    // Verify if signature is revoked
    if (sig.verification_status === "revoked") {
      return res.json({
        success: true,
        data: {
          signature_id: signatureId,
          is_valid: false,
          reason: "Signature is revoked",
          verified_at: new Date().toISOString(),
        },
      });
    }

    const isValid = signatureService.verifySignature({
      content,
      signature: sig.signature_data,
      publicKey: public_key,
    });

    // Update verification status if invalid
    if (!isValid) {
      await supabase
        .from("document_signatures")
        .update({ verification_status: "invalid" })
        .eq("id", signatureId);
    }

    return res.json({
      success: true,
      data: {
        signature_id: signatureId,
        is_valid: isValid,
        verification_status: isValid ? "valid" : "invalid",
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [Signature Controller] Verify error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * Public signature verification endpoint (no auth required)
 * Used by QR codes for anyone to verify document authenticity
 */
export async function verifySignaturePublic(req: Request, res: Response) {
  try {
    const { signatureId } = req.params;

    console.log("🔍 [Signature] Public verification request", { 
      signatureId: signatureId.substring(0, 8) 
    });

    const { data: sig, error: sigError } = await supabase
      .from("document_signatures")
      .select(`
        *,
        signer:users!signer_id(first_name, last_name, email),
        document:documents!document_id(name, file_url)
      `)
      .eq("id", signatureId)
      .single();

    if (sigError || !sig) {
      console.warn("⚠️ [Signature] Signature not found for public verification");
      return res.status(404).json({ 
        success: false, 
        error: "Signature not found." 
      });
    }

    // Check if signature is revoked
    if (sig.verification_status === "revoked") {
      return res.json({
        success: true,
        data: {
          signature_id: signatureId,
          is_valid: false,
          status: "revoked",
          reason: "This signature has been revoked",
          document_name: sig.document?.name,
          signer_name: `${sig.signer?.first_name} ${sig.signer?.last_name}`,
          signed_at: sig.signed_at,
          physical_verification_status: sig.physical_verification_status || 'unknown',
        },
      });
    }

    // Check physical verification status (Phase A)
    const physicalStatus = sig.physical_verification_status || 'unknown';
    const isPhysicallyVerified = physicalStatus === 'verified';

    // Signature is digitally valid but might need physical verification
    const overallStatus = isPhysicallyVerified 
      ? 'verified' 
      : physicalStatus === 'pending' 
        ? 'pending_verification' 
        : physicalStatus;

    console.log("✅ [Signature] Public verification completed", {
      signatureId: signatureId.substring(0, 8),
      digitalStatus: sig.verification_status,
      physicalStatus,
      overallStatus,
    });

    return res.json({
      success: true,
      data: {
        signature_id: signatureId,
        is_valid: sig.verification_status === 'valid',
        digital_status: sig.verification_status,
        physical_verification_status: physicalStatus,
        overall_status: overallStatus,
        document_name: sig.document?.name,
        signer_name: `${sig.signer?.first_name} ${sig.signer?.last_name}`,
        signer_email: sig.signer?.email,
        signed_at: sig.signed_at,
        verified_at: sig.verified_at,
        certificate_data: sig.certificate_data,
        ip_address: sig.ip_address,
        geolocation: sig.geolocation,
        verification_message: isPhysicallyVerified
          ? "Signature is digitally valid and physically verified"
          : physicalStatus === 'pending'
            ? "Signature is digitally valid but awaiting physical verification"
            : physicalStatus === 'rejected'
              ? "Signature verification was rejected"
              : "Signature verification status unknown",
      },
    });
  } catch (error) {
    console.error("❌ [Signature Controller] Public verify error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getDocumentSignatures(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to view signatures." });
    }

    const signatures = await signatureService.getDocumentSignatures(documentId);

    return res.json({ success: true, data: signatures });
  } catch (error) {
    console.error("❌ [Signature Controller] Get signatures error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function revokeSignature(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { signatureId } = req.params;

    const { data: sig, error: sigError } = await supabase
      .from("document_signatures")
      .select("signer_id, document_id")
      .eq("id", signatureId)
      .single();

    if (sigError || !sig) {
      return res.status(404).json({ success: false, error: "Signature not found." });
    }

    // Only signer or admin can revoke
    const isAdmin = req.user.role === "admin";
    const isSigner = sig.signer_id === req.user.id;

    if (!isAdmin && !isSigner) {
      return res.status(403).json({ success: false, error: "No permission to revoke this signature." });
    }

    const revoked = await signatureService.revokeSignature(signatureId);

    return res.json({ success: true, data: revoked });
  } catch (error) {
    console.error("❌ [Signature Controller] Revoke error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function generateCertificate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, error: "User profile not found." });
    }

    const cert = signatureService.createCertificate({
      userId: req.user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    console.log("🎯 [Signature] Certificate generation endpoint called", {
      userId: req.user.id.substring(0, 8),
    });

    return res.json({
      success: true,
      data: {
        certificate: cert.certificate,
        public_key: cert.publicKey,
        private_key: cert.privateKey,
        note: "⚠️ Store private_key securely. It cannot be recovered if lost.",
      },
    });
  } catch (error) {
    console.error("❌ [Signature Controller] Certificate generation error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
