import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "../middleware/auth";
import { env } from "../config/env";
import auditService from "../services/auditService";
import workflowService from "../services/workflowService";

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
