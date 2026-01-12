import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import blockchainService from "../services/blockchainService";

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

export async function recordBlockchainEntry(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { action_type, content, metadata } = req.body;

    if (!action_type || !content) {
      return res.status(400).json({
        success: false,
        error: "action_type and content are required.",
      });
    }

    const validActions = ["created", "updated", "signed", "approved"];
    if (!validActions.includes(action_type)) {
      return res.status(400).json({
        success: false,
        error: `action_type must be one of: ${validActions.join(", ")}`,
      });
    }

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res
        .status(403)
        .json({ success: false, error: "No permission to record blockchain entry." });
    }

    const block = await blockchainService.recordBlock({
      documentId,
      actionType: action_type,
      actionBy: req.user.id,
      content,
      metadata,
    });

    return res.status(201).json({ success: true, data: block });
  } catch (error) {
    console.error("❌ [Blockchain Controller] Record entry error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getDocumentLedger(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to view ledger." });
    }

    const ledger = await blockchainService.getLedger(documentId);

    return res.json({ success: true, data: ledger });
  } catch (error) {
    console.error("❌ [Blockchain Controller] Get ledger error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function verifyDocumentIntegrity(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to verify." });
    }

    const isValid = await blockchainService.verifyChainIntegrity(documentId);

    return res.json({
      success: true,
      data: {
        document_id: documentId,
        integrity_valid: isValid,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [Blockchain Controller] Verify integrity error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function verifyBlock(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { blockId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: "content is required for verification." });
    }

    const isValid = await blockchainService.verifyBlock(blockId, content);

    return res.json({
      success: true,
      data: {
        block_id: blockId,
        is_valid: isValid,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [Blockchain Controller] Verify block error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function calculateMerkleRoot(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const hasAccess = await ensureDocumentAccess(documentId, req.user.id, req.user.role === "admin");
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: "No permission to calculate root." });
    }

    const merkleRoot = await blockchainService.calculateMerkleRoot(documentId);

    return res.json({
      success: true,
      data: {
        document_id: documentId,
        merkle_root: merkleRoot,
        calculated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [Blockchain Controller] Calculate merkle root error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
