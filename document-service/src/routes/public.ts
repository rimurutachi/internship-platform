import express, { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const router = express.Router();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

/**
 * @route   GET /api/public/verify/:documentId
 * @desc    Verify document authenticity and retrieve public verification data
 * @access  Public (No authentication required)
 */
router.get("/verify/:documentId", async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;

    console.log(`🔍 [Public] Verifying document integrity for ${documentId}`);

    // 1. Fetch the document using service key (bypasses RLS)
    const { data: document, error } = await supabase
      .from("documents")
      .select(`
        id,
        title,
        status,
        owner_id,
        metadata
      `)
      .eq("id", documentId)
      .single();

    if (error || !document) {
      console.warn(`⚠️ [Public] Verification failed: Document ${documentId} not found`);
      return res.status(404).json({
        success: false,
        error: "Document not found or invalid QR code",
      });
    }

    // 2. Only allow verification for pre_approved or approved documents
    if (document.status !== "pre_approved" && document.status !== "approved") {
      console.warn(`⚠️ [Public] Verification failed: Document ${documentId} is in status ${document.status}`);
      return res.status(400).json({
        success: false,
        error: "Document is not finalized and cannot be verified",
        status: document.status
      });
    }

    // 3. Extract the verification details
    const metadata = document.metadata || {};
    const contentHash = metadata.content_hash;
    const securePdfUrl = metadata.secure_pdf_url;
    const lockedAt = metadata.pre_approved_at || metadata.updated_at;

    if (!contentHash) {
      console.warn(`⚠️ [Public] Verification failed: No content hash for document ${documentId}`);
      return res.status(400).json({
        success: false,
        error: "Document is missing integrity signatures",
      });
    }

    // 4. Fetch owner details
    const { data: owner } = await supabase
      .from("users")
      .select("first_name, last_name, role")
      .eq("id", document.owner_id)
      .single();

    const ownerName = owner 
      ? `${owner.first_name} ${owner.last_name}`.trim() 
      : "Unknown User";

    console.log(`✅ [Public] Verification successful for document ${documentId}`);

    // 5. Return safe public verification details
    return res.json({
      success: true,
      data: {
        documentId: document.id,
        title: document.title,
        status: document.status,
        content_hash: contentHash,
        locked_at: lockedAt,
        secure_pdf_url: securePdfUrl,
        owner: {
          name: ownerName,
          role: owner?.role
        }
      },
    });

  } catch (error: any) {
    console.error(`❌ [Public] Error verifying document:`, error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during verification",
    });
  }
});

export default router;
