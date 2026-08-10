import { Request, Response } from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import auditService from "../services/auditService";
import workflowService from "../services/workflowService";
import { pdfExportService } from "../services/pdfExportService";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function ensureDocumentOwnerOrAdmin(documentId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true;

  const { data: doc, error } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  if (error || !doc) return false;
  return doc.owner_id === userId;
}

export async function createWorkflow(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { workflow_definition, initial_stage } = req.body;

    if (!workflow_definition) {
      return res.status(400).json({ success: false, error: "workflow_definition is required." });
    }

    // Validate workflow definition
    const validation = workflowService.validateWorkflowDefinition(workflow_definition);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: "Invalid workflow definition", details: validation.errors });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to create workflow." });
    }

    console.log("📋 [Workflow] Creating workflow", {
      documentId: documentId.substring(0, 8),
    });

    const { data, error } = await supabase
      .from("document_workflows")
      .insert({
        document_id: documentId,
        workflow_definition,
        current_stage: initial_stage || workflow_definition.stages[0].name,
        status: "in_progress",
        started_at: new Date().toISOString(),
        metadata: {
          current_stage_index: 0,
          created_by: req.user.id,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [Workflow] Create error", error);
      throw error;
    }

    // Get required approvers for initial stage and create approval records
    const requiredApprovers = await workflowService.getRequiredApprovers(documentId, data.id, 0);
    if (requiredApprovers.length > 0) {
      await workflowService.createApprovals(data.id, requiredApprovers);
    }

    await auditService.logAction({
      documentId,
      userId: req.user.id,
      action: "workflow_created",
      metadata: { workflow_id: data.id, stage: workflow_definition.stages[0].name },
    });

    console.log("✅ [Workflow] Created", { workflowId: data.id.substring(0, 8) });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("❌ [Workflow Controller] Create error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getWorkflow(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { workflowId } = req.params;

    const { data: workflow, error } = await supabase
      .from("document_workflows")
      .select("*")
      .eq("id", workflowId)
      .single();

    if (error || !workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found." });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(
      workflow.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view workflow." });
    }

    return res.json({ success: true, data: workflow });
  } catch (error) {
    console.error("❌ [Workflow Controller] Get error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function updateWorkflowStage(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { workflowId } = req.params;
    const { current_stage, status } = req.body;

    if (!current_stage && !status) {
      return res.status(400).json({
        success: false,
        error: "current_stage or status is required.",
      });
    }

    const { data: workflow, error: wfError } = await supabase
      .from("document_workflows")
      .select("document_id")
      .eq("id", workflowId)
      .single();

    if (wfError || !workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found." });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(
      workflow.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to update workflow." });
    }

    console.log("🔄 [Workflow] Updating stage", {
      workflowId: workflowId.substring(0, 8),
      stage: current_stage,
      status,
    });

    const updates: any = { updated_at: new Date().toISOString() };
    if (current_stage) updates.current_stage = current_stage;
    if (status) {
      updates.status = status;
      if (status === "completed") updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("document_workflows")
      .update(updates)
      .eq("id", workflowId)
      .select()
      .single();

    if (error) {
      console.error("❌ [Workflow] Update error", error);
      throw error;
    }

    await auditService.logAction({
      documentId: workflow.document_id,
      userId: req.user.id,
      action: "workflow_updated",
      metadata: { workflow_id: workflowId, stage: current_stage, status },
    });

    console.log("✅ [Workflow] Updated");

    return res.json({ success: true, data });
  } catch (error) {
    console.error("❌ [Workflow Controller] Update error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
export async function submitApproval(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { approvalId } = req.params;
    const { status, comments } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "Status must be 'approved' or 'rejected'." });
    }

    const { data: approval, error: appError } = await supabase
      .from("document_approvals")
      .select("*, workflow:workflow_id(*)")
      .eq("id", approvalId)
      .single();

    if (appError || !approval) {
      return res.status(404).json({ success: false, error: "Approval not found." });
    }

    // Check if user is the approver or admin
    if (approval.approver_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "No permission to submit this approval." });
    }

    console.log("✍️ [Workflow] Submitting approval", {
      approvalId: approvalId.substring(0, 8),
      status,
    });

    const success = await workflowService.submitApproval(approvalId, status, comments || "", req.user.id);

    if (!success) {
      return res.status(500).json({ success: false, error: "Failed to submit approval." });
    }

    const { data: updatedApproval } = await supabase
      .from("document_approvals")
      .select("*")
      .eq("id", approvalId)
      .single();

    console.log("✅ [Workflow] Approval submitted", { status });

    return res.json({ success: true, data: updatedApproval });
  } catch (error) {
    console.error("❌ [Workflow Controller] Submit approval error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getWorkflowProgress(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { workflowId } = req.params;

    const { data: workflow, error: wfError } = await supabase
      .from("document_workflows")
      .select("document_id")
      .eq("id", workflowId)
      .single();

    if (wfError || !workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found." });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(
      workflow.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view workflow progress." });
    }

    console.log("📊 [Workflow] Getting progress", {
      workflowId: workflowId.substring(0, 8),
    });

    const metrics = await workflowService.getWorkflowProgress(workflowId);

    if (!metrics) {
      return res.status(500).json({ success: false, error: "Failed to get workflow progress." });
    }

    console.log("✅ [Workflow] Progress retrieved", metrics);

    return res.json({ success: true, data: metrics });
  } catch (error) {
    console.error("❌ [Workflow Controller] Get progress error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
export async function listDocumentWorkflows(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, req.user.id, req.user.role === "admin");
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to list workflows." });
    }

    const { data, error } = await supabase
      .from("document_workflows")
      .select("*")
      .eq("document_id", documentId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("❌ [Workflow] List error", error);
      throw error;
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("❌ [Workflow Controller] List error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getWorkflowApprovals(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { workflowId } = req.params;

    const { data: workflow, error: wfError } = await supabase
      .from("document_workflows")
      .select("document_id")
      .eq("id", workflowId)
      .single();

    if (wfError || !workflow) {
      return res.status(404).json({ success: false, error: "Workflow not found." });
    }

    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(
      workflow.document_id,
      req.user.id,
      req.user.role === "admin"
    );
    if (!isOwnerOrAdmin) {
      return res.status(403).json({ success: false, error: "No permission to view approvals." });
    }

    const { data, error } = await supabase
      .from("document_approvals")
      .select("*, approver:users!approver_id(id, first_name, last_name, email)")
      .eq("workflow_id", workflowId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [Workflow] Get approvals error", error);
      throw error;
    }

    return res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("❌ [Workflow Controller] Get approvals error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * Pre-approve a draft document:
 * 1. Validates the document is in 'draft' status
 * 2. Generates SHA-256 hash of the document content
 * 3. Transitions the document to 'pre_approved' status (locks editing)
 * 4. Stores the content hash in document metadata for verification
 * 5. Creates an audit log entry
 */
export async function preApproveDraft(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Step 1: Fetch the document and validate ownership
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, status, content, owner_id, title, metadata, file_url")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ success: false, error: "Document not found." });
    }

    // Only document owner, assigned advisor, or admin can pre-approve
    const isOwnerOrAdmin = await ensureDocumentOwnerOrAdmin(documentId, userId, isAdmin);

    // Also check if user has 'edit' access via document_access_control
    let hasEditAccess = false;
    let isAssignedAdvisor = false;

    if (!isOwnerOrAdmin) {
      const { data: accessRecord } = await supabase
        .from("document_access_control")
        .select("permission_level")
        .eq("document_id", documentId)
        .eq("user_id", userId)
        .is("revoked_at", null)
        .in("permission_level", ["edit", "admin"])
        .limit(1)
        .maybeSingle();

      hasEditAccess = !!accessRecord;

      // Check if the user is the assigned advisor for the document owner
      const { data: internship } = await supabase
        .from("internships")
        .select("id")
        .eq("student_id", doc.owner_id)
        .eq("advisor_id", userId)
        .in("status", ["active", "pending"])
        .limit(1)
        .maybeSingle();
        
      isAssignedAdvisor = !!internship;
    }

    if (!isOwnerOrAdmin && !hasEditAccess && !isAssignedAdvisor) {
      return res.status(403).json({ success: false, error: "No permission to pre-approve this document." });
    }

    // Step 2: Validate document is in 'draft' or 'in_review' status
    if (doc.status !== "draft" && doc.status !== "in_review") {
      return res.status(409).json({
        success: false,
        error: `Document cannot be pre-approved. Current status is '${doc.status}', expected 'draft' or 'in_review'.`,
      });
    }

    // Step 3: Generate SHA-256 hash of the document content
    const contentString = typeof doc.content === "string"
      ? doc.content
      : JSON.stringify(doc.content);
    const contentHash = crypto
      .createHash("sha256")
      .update(contentString, "utf8")
      .digest("hex");

    console.log("🔒 [Workflow] Pre-approving document", {
      documentId: documentId.substring(0, 8),
      contentHash: contentHash.substring(0, 16) + "...",
      userId: userId.substring(0, 8),
    });

    // Step 4: Update document status to 'pre_approved' and store content hash
    const updatedMetadata = {
      ...(doc.metadata || {}),
      content_hash: contentHash,
      pre_approved_at: new Date().toISOString(),
      pre_approved_by: userId,
    };

    // Step 4.1: Generate the secure PDF using pdfExportService
    const user = req.user as any;
    const ownerName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : "Intern-Galing User";

    const pdfExportResult = await pdfExportService.generateSecurePDF({
      documentId,
      documentTitle: doc.title || "Document",
      content: doc.content,
      contentHash,
      ownerName,
      fileUrl: doc.file_url,
    });

    updatedMetadata.secure_pdf_url = pdfExportResult.signedUrl;
    updatedMetadata.secure_pdf_storage_path = pdfExportResult.storagePath;

    // Step 4.2: Update document status to 'pre_approved' and store content hash
    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "pre_approved",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [Workflow] Pre-approve update error", updateError);
      throw updateError;
    }

    // Step 5: Create audit log entry
    await auditService.logAction({
      documentId,
      userId,
      action: "document_pre_approved",
      ipAddress: req.ip,
      metadata: {
        content_hash: contentHash,
        secure_pdf_path: pdfExportResult.storagePath,
        previous_status: "draft",
        new_status: "pre_approved",
      },
    });

    console.log("✅ [Workflow] Document pre-approved, locked, and PDF generated", {
      documentId: documentId.substring(0, 8),
      pdfPath: pdfExportResult.storagePath,
    });

    return res.json({
      success: true,
      data: {
        document: updatedDoc,
        content_hash: contentHash,
        locked_at: updatedMetadata.pre_approved_at,
        secure_pdf_url: pdfExportResult.signedUrl,
      },
    });
  } catch (error) {
    console.error("❌ [Workflow Controller] Pre-approve error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * Revert a pre-approved document back to 'draft' status.
 * This unlocks the document for further collaborative editing.
 * Only the original pre-approver or admin can revert.
 */
export async function revertPreApproval(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { documentId } = req.params;
    const { reason } = req.body || {};
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Fetch document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, status, metadata")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ success: false, error: "Document not found." });
    }

    // Validate document is in 'pre_approved' status
    if (doc.status !== "pre_approved") {
      return res.status(409).json({
        success: false,
        error: `Document is not pre-approved. Current status is '${doc.status}'.`,
      });
    }

    // Only original pre-approver or admin can revert
    const preApprovedBy = doc.metadata?.pre_approved_by;
    if (!isAdmin && preApprovedBy !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only the original pre-approver or admin can revert this document.",
      });
    }

    console.log("🔓 [Workflow] Reverting pre-approval", {
      documentId: documentId.substring(0, 8),
      userId: userId.substring(0, 8),
    });

    // Remove pre-approval metadata and revert status
    const updatedMetadata = { ...(doc.metadata || {}) };
    delete updatedMetadata.content_hash;
    delete updatedMetadata.pre_approved_at;
    delete updatedMetadata.pre_approved_by;

    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "draft",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ [Workflow] Revert pre-approval error", updateError);
      throw updateError;
    }

    // Audit log
    await auditService.logAction({
      documentId,
      userId,
      action: "pre_approval_reverted",
      ipAddress: req.ip,
      metadata: {
        reason: reason || "No reason provided",
        previous_status: "pre_approved",
        new_status: "draft",
      },
    });

    console.log("✅ [Workflow] Pre-approval reverted, document unlocked", {
      documentId: documentId.substring(0, 8),
    });

    return res.json({
      success: true,
      data: { document: updatedDoc },
      message: "Document reverted to draft. Collaborative editing is now re-enabled.",
    });
  } catch (error) {
    console.error("❌ [Workflow Controller] Revert pre-approval error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

/**
 * Upload and AI-Scan Physically Signed Document
 * (Phase 4 of Hybrid Workflow)
 */
export const uploadSignedDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const { file_url } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ success: false, error: "Authentication required" });
    if (!file_url) return res.status(400).json({ success: false, error: "file_url is required" });

    // 1. Fetch document and ensure it's pre-approved
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, status, metadata")
      .eq("id", documentId)
      .single();

    if (docError || !doc) return res.status(404).json({ success: false, error: "Document not found" });

    if (doc.status !== "pre_approved") {
      return res.status(400).json({ 
        success: false, 
        error: "Document must be pre-approved before uploading the final signed version",
        status: doc.status
      });
    }

    // 2. Call AI Service to scan for signatures
    console.log(`🤖 [Workflow] Triggering AI signature scan for document ${documentId}`);
    const axios = require('axios');
    let aiResult;
    try {
      const response = await axios.post(`${env.AI_SERVICE_URL}/api/scan-signatures`, {
        file_url,
        document_id: documentId
      });
      aiResult = response.data;
    } catch (err: any) {
      console.error("❌ [Workflow] AI Service call failed:", err.message);
      return res.status(503).json({
        success: false,
        error: "AI signature verification service is currently unavailable",
      });
    }

    // 3. Check AI verification results
    if (!aiResult.has_signature) {
      console.warn(`⚠️ [Workflow] AI rejected document ${documentId}: No wet signatures detected.`);
      return res.status(400).json({
        success: false,
        error: "AI Signature Verification Failed: No handwritten signatures detected on the document.",
        ai_analysis: aiResult
      });
    }

    // 4. Update document to approved
    console.log(`✅ [Workflow] AI verified signatures for ${documentId}. Approving document.`);
    const updatedMetadata = {
      ...(doc.metadata || {}),
      signed_document_url: file_url,
      ai_scan_result: aiResult,
      approved_at: new Date().toISOString(),
      approved_by: userId
    };

    const { data: updatedDoc, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "approved",
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Create audit log entry
    await auditService.logAction({
      documentId,
      userId,
      action: "document_approved",
      ipAddress: req.ip,
      metadata: {
        ai_confidence: aiResult.confidence_score,
        previous_status: "pre_approved",
        new_status: "approved",
      },
    });

    return res.json({
      success: true,
      message: "Document successfully verified and finalized.",
      data: updatedDoc,
      ai_analysis: aiResult
    });

  } catch (error: any) {
    console.error("❌ [Workflow] Error in uploadSignedDocument:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
