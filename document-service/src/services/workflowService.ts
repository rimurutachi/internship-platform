import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

interface ApprovalCondition {
  approver_role?: string;
  approver_user_id?: string;
  condition_type?: "all" | "any";
  metadata?: Record<string, any>;
}

interface WorkflowDefinition {
  stages: {
    name: string;
    required_approvers: ApprovalCondition[];
    auto_progress_condition?: string;
    timeout_days?: number;
  }[];
  metadata?: Record<string, any>;
}

interface WorkflowState {
  current_stage: string;
  stage_index: number;
  approvals: { [key: string]: string }; // approver_id -> status (pending/approved/rejected)
  transitions: { from_stage: string; to_stage: string; at: string; by_user_id: string }[];
}

export const workflowService = {
  /**
   * Determine required approvers for a workflow stage
   */
  async getRequiredApprovers(
    documentId: string,
    workflowId: string,
    stageIndex: number
  ): Promise<{ userId: string; role: string }[]> {
    console.log("🔍 [Workflow] Getting required approvers", {
      documentId: documentId.substring(0, 8),
      stageIndex,
    });

    try {
      const { data: workflow, error } = await supabase
        .from("document_workflows")
        .select("workflow_definition")
        .eq("id", workflowId)
        .single();

      if (error || !workflow) {
        console.error("❌ [Workflow] Workflow not found");
        return [];
      }

      const definition: WorkflowDefinition = workflow.workflow_definition;
      if (!definition.stages || stageIndex >= definition.stages.length) {
        console.warn("⚠️ [Workflow] Invalid stage index", { stageIndex });
        return [];
      }

      const stage = definition.stages[stageIndex];
      const approvers: { userId: string; role: string }[] = [];

      // Process each approver condition
      for (const condition of stage.required_approvers || []) {
        if (condition.approver_role) {
          // Get all users with this role for the document's internship
          const { data: users, error: userError } = await supabase
            .from("users")
            .select("id, role")
            .eq("role", condition.approver_role);

          if (!userError && users) {
            approvers.push(
              ...users.map((u) => ({
                userId: u.id,
                role: u.role,
              }))
            );
          }
        } else if (condition.approver_user_id) {
          // Specific user as approver
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, role")
            .eq("id", condition.approver_user_id)
            .single();

          if (!userError && user) {
            approvers.push({
              userId: user.id,
              role: user.role,
            });
          }
        }
      }

      console.log("✅ [Workflow] Found approvers", { count: approvers.length });
      return approvers;
    } catch (error) {
      console.error("❌ [Workflow] Get approvers error", error);
      return [];
    }
  },

  /**
   * Create approval records for a workflow stage
   */
  async createApprovals(workflowId: string, requiredApprovers: { userId: string; role: string }[]) {
    console.log("📋 [Workflow] Creating approval records", {
      workflowId: workflowId.substring(0, 8),
      approverCount: requiredApprovers.length,
    });

    try {
      const approvalRecords = requiredApprovers.map((approver) => ({
        workflow_id: workflowId,
        approver_id: approver.userId,
        approver_role: approver.role,
        status: "pending",
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("document_approvals").insert(approvalRecords);

      if (error) {
        console.error("❌ [Workflow] Create approvals error", error);
        throw error;
      }

      console.log("✅ [Workflow] Approval records created");
    } catch (error) {
      console.error("❌ [Workflow Service] Create approvals error", error);
      throw error;
    }
  },

  /**
   * Check if stage auto-progression conditions are met
   */
  async checkAutoProgressionConditions(
    workflowId: string,
    documentId: string,
    currentStageIndex: number
  ): Promise<boolean> {
    console.log("⚙️ [Workflow] Checking auto-progression", {
      workflowId: workflowId.substring(0, 8),
      stageIndex: currentStageIndex,
    });

    try {
      const { data: workflow, error: wfError } = await supabase
        .from("document_workflows")
        .select("workflow_definition, metadata")
        .eq("id", workflowId)
        .single();

      if (wfError || !workflow) {
        console.warn("⚠️ [Workflow] Workflow not found for auto-progression check");
        return false;
      }

      const definition: WorkflowDefinition = workflow.workflow_definition;
      if (!definition.stages || currentStageIndex >= definition.stages.length) {
        return false;
      }

      const stage = definition.stages[currentStageIndex];
      if (!stage.auto_progress_condition) {
        console.log("ℹ️ [Workflow] No auto-progression condition defined");
        return false;
      }

      // Evaluate auto-progression condition
      let shouldProgress = false;

      if (stage.auto_progress_condition === "all_approved") {
        // Check if all approvals are approved
        const { data: approvals, error: appError } = await supabase
          .from("document_approvals")
          .select("status")
          .eq("workflow_id", workflowId);

        if (!appError && approvals) {
          shouldProgress = approvals.every((a) => a.status === "approved");
        }
      } else if (stage.auto_progress_condition === "any_approved") {
        // Check if at least one approval is approved
        const { data: approvals, error: appError } = await supabase
          .from("document_approvals")
          .select("status")
          .eq("workflow_id", workflowId);

        if (!appError && approvals && approvals.length > 0) {
          shouldProgress = approvals.some((a) => a.status === "approved");
        }
      } else if (stage.auto_progress_condition === "no_rejections") {
        // Check if no approvals are rejected
        const { data: approvals, error: appError } = await supabase
          .from("document_approvals")
          .select("status")
          .eq("workflow_id", workflowId);

        if (!appError && approvals) {
          shouldProgress = !approvals.some((a) => a.status === "rejected");
        }
      }

      if (shouldProgress) {
        console.log("✅ [Workflow] Auto-progression condition met");
      } else {
        console.log("⏳ [Workflow] Auto-progression condition not met");
      }

      return shouldProgress;
    } catch (error) {
      console.error("❌ [Workflow] Auto-progression check error", error);
      return false;
    }
  },

  /**
   * Transition workflow to next stage
   */
  async transitionToNextStage(
    workflowId: string,
    documentId: string,
    currentStageIndex: number,
    userId: string
  ): Promise<boolean> {
    console.log("🔄 [Workflow] Transitioning stage", {
      workflowId: workflowId.substring(0, 8),
      from: currentStageIndex,
    });

    try {
      const { data: workflow, error: wfError } = await supabase
        .from("document_workflows")
        .select("workflow_definition, metadata")
        .eq("id", workflowId)
        .single();

      if (wfError || !workflow) {
        console.error("❌ [Workflow] Workflow not found");
        return false;
      }

      const definition: WorkflowDefinition = workflow.workflow_definition;
      const nextStageIndex = currentStageIndex + 1;

      if (nextStageIndex >= definition.stages.length) {
        console.log("✅ [Workflow] Workflow completed (last stage)");
        // Mark workflow as completed
        await supabase
          .from("document_workflows")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            metadata: {
              ...workflow.metadata,
              final_stage_index: currentStageIndex,
            },
          })
          .eq("id", workflowId);

        return true;
      }

      // Get required approvers for next stage
      const nextApprovers = await this.getRequiredApprovers(documentId, workflowId, nextStageIndex);

      // Create new approval records for next stage
      if (nextApprovers.length > 0) {
        await this.createApprovals(workflowId, nextApprovers);
      }

      // Update workflow to next stage
      const { error: updateError } = await supabase
        .from("document_workflows")
        .update({
          current_stage: definition.stages[nextStageIndex].name,
          metadata: {
            ...workflow.metadata,
            current_stage_index: nextStageIndex,
            previous_stage_index: currentStageIndex,
            transitioned_at: new Date().toISOString(),
            transitioned_by: userId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflowId);

      if (updateError) {
        console.error("❌ [Workflow] Stage transition error", updateError);
        return false;
      }

      console.log("✅ [Workflow] Transitioned to stage", {
        to: definition.stages[nextStageIndex].name,
      });

      return true;
    } catch (error) {
      console.error("❌ [Workflow Service] Transition error", error);
      return false;
    }
  },

  /**
   * Submit approval for a workflow
   */
  async submitApproval(
    approvalId: string,
    status: "approved" | "rejected",
    comments: string,
    userId: string
  ): Promise<boolean> {
    console.log("📝 [Workflow] Submitting approval", {
      approvalId: approvalId.substring(0, 8),
      status,
    });

    try {
      const { error } = await supabase
        .from("document_approvals")
        .update({
          status,
          comments,
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .eq("id", approvalId);

      if (error) {
        console.error("❌ [Workflow] Submit approval error", error);
        throw error;
      }

      console.log("✅ [Workflow] Approval submitted", { status });

      // Get workflow to check for auto-progression
      const { data: approval, error: appError } = await supabase
        .from("document_approvals")
        .select("workflow_id")
        .eq("id", approvalId)
        .single();

      if (!appError && approval) {
        const { data: wf } = await supabase
          .from("document_workflows")
          .select("document_id, metadata")
          .eq("id", approval.workflow_id)
          .single();

        if (wf && wf.metadata?.current_stage_index !== undefined) {
          const shouldAutoProgress = await this.checkAutoProgressionConditions(
            approval.workflow_id,
            wf.document_id,
            wf.metadata.current_stage_index
          );

          if (shouldAutoProgress) {
            await this.transitionToNextStage(
              approval.workflow_id,
              wf.document_id,
              wf.metadata.current_stage_index,
              userId
            );
          }
        }
      }

      return true;
    } catch (error) {
      console.error("❌ [Workflow Service] Submit approval error", error);
      return false;
    }
  },

  /**
   * Get workflow progress metrics
   */
  async getWorkflowProgress(workflowId: string): Promise<{
    total_stages: number;
    current_stage_index: number;
    total_approvals: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    progress_percentage: number;
  } | null> {
    console.log("📊 [Workflow] Getting progress metrics", {
      workflowId: workflowId.substring(0, 8),
    });

    try {
      const { data: workflow, error: wfError } = await supabase
        .from("document_workflows")
        .select("workflow_definition, metadata")
        .eq("id", workflowId)
        .single();

      if (wfError || !workflow) {
        return null;
      }

      const definition: WorkflowDefinition = workflow.workflow_definition;
      const currentStageIndex = workflow.metadata?.current_stage_index || 0;

      const { data: approvals, error: appError } = await supabase
        .from("document_approvals")
        .select("status")
        .eq("workflow_id", workflowId);

      if (appError || !approvals) {
        return null;
      }

      const approved = approvals.filter((a) => a.status === "approved").length;
      const rejected = approvals.filter((a) => a.status === "rejected").length;
      const pending = approvals.filter((a) => a.status === "pending").length;
      const progressPercentage = approvals.length > 0 ? (approved / approvals.length) * 100 : 0;

      const metrics = {
        total_stages: definition.stages?.length || 0,
        current_stage_index: currentStageIndex,
        total_approvals: approvals.length,
        approved_count: approved,
        rejected_count: rejected,
        pending_count: pending,
        progress_percentage: Math.round(progressPercentage),
      };

      console.log("✅ [Workflow] Progress metrics calculated", metrics);
      return metrics;
    } catch (error) {
      console.error("❌ [Workflow Service] Get progress error", error);
      return null;
    }
  },

  /**
   * Validate workflow definition structure
   */
  validateWorkflowDefinition(definition: any): { valid: boolean; errors: string[] } {
    console.log("✔️ [Workflow] Validating definition structure");

    const errors: string[] = [];

    if (!definition.stages || !Array.isArray(definition.stages)) {
      errors.push("workflow_definition.stages must be an array");
      return { valid: false, errors };
    }

    if (definition.stages.length === 0) {
      errors.push("workflow_definition.stages must not be empty");
      return { valid: false, errors };
    }

    for (let i = 0; i < definition.stages.length; i++) {
      const stage = definition.stages[i];

      if (!stage.name) {
        errors.push(`Stage ${i} must have a name`);
      }

      if (!Array.isArray(stage.required_approvers)) {
        errors.push(`Stage ${i} required_approvers must be an array`);
      }

      if (stage.required_approvers && stage.required_approvers.length > 0) {
        for (const approver of stage.required_approvers) {
          if (!approver.approver_role && !approver.approver_user_id) {
            errors.push(
              `Stage ${i}: Each approver must have either approver_role or approver_user_id`
            );
          }
        }
      }
    }

    if (errors.length === 0) {
      console.log("✅ [Workflow] Definition validation passed");
    } else {
      console.warn("⚠️ [Workflow] Definition validation errors", errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default workflowService;
