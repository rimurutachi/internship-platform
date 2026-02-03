import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "./notificationService";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const notificationService = new NotificationService();

// Types
export interface DocumentRequirement {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  university_id: string | null;
  due_date: string | null;
  is_mandatory: boolean;
  target_audience: "all_students" | "specific_internship" | "specific_student";
  metadata: {
    internship_ids?: string[];
    student_ids?: string[];
    file_requirements?: {
      max_size?: number;
      allowed_types?: string[];
    };
  };
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  submission_stats?: {
    total_submissions: number;
    pending: number;
    approved: number;
    rejected: number;
    revision_requested: number;
  };
}

export interface CreateRequirementDTO {
  title: string;
  description?: string;
  due_date?: string;
  is_mandatory?: boolean;
  target_audience?: "all_students" | "specific_internship" | "specific_student";
  metadata?: {
    internship_ids?: string[];
    student_ids?: string[];
    file_requirements?: {
      max_size?: number;
      allowed_types?: string[];
    };
  };
}

export interface UpdateRequirementDTO {
  title?: string;
  description?: string;
  due_date?: string;
  is_mandatory?: boolean;
  target_audience?: "all_students" | "specific_internship" | "specific_student";
  metadata?: {
    internship_ids?: string[];
    student_ids?: string[];
    file_requirements?: {
      max_size?: number;
      allowed_types?: string[];
    };
  };
  status?: "active" | "archived";
}

export class DocumentRequirementsService {
  /**
   * Create a new document requirement (Advisor only)
   */
  async createRequirement(
    advisorId: string,
    data: CreateRequirementDTO
  ): Promise<DocumentRequirement> {
    // Get advisor's university if exists
    const { data: advisor } = await supabase
      .from("users")
      .select("id, profile_data")
      .eq("id", advisorId)
      .single();

    const universityId = advisor?.profile_data?.university_id || null;

    const requirementData = {
      title: data.title,
      description: data.description || null,
      created_by: advisorId,
      university_id: universityId,
      due_date: data.due_date || null,
      is_mandatory: data.is_mandatory ?? true,
      target_audience: data.target_audience || "all_students",
      metadata: data.metadata || {},
      status: "active",
    };

    const { data: requirement, error } = await supabase
      .from("document_requirements")
      .insert(requirementData)
      .select()
      .single();

    if (error) {
      console.error("Error creating requirement:", error);
      throw new Error(`Failed to create requirement: ${error.message}`);
    }

    // Notify target students
    await this.notifyStudentsAboutRequirement(requirement);

    return requirement;
  }

  /**
   * Get all requirements created by an advisor
   */
  async getAdvisorRequirements(
    advisorId: string,
    options: {
      status?: "active" | "archived";
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ requirements: DocumentRequirement[]; total: number }> {
    const { status = "active", page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("document_requirements")
      .select("*", { count: "exact" })
      .eq("created_by", advisorId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching requirements:", error);
      throw new Error(`Failed to fetch requirements: ${error.message}`);
    }

    // Get submission stats for each requirement
    const requirementsWithStats = await Promise.all(
      (data || []).map(async (req) => {
        const stats = await this.getSubmissionStats(req.id);
        return { ...req, submission_stats: stats };
      })
    );

    return {
      requirements: requirementsWithStats,
      total: count || 0,
    };
  }

  /**
   * Get a single requirement by ID
   */
  async getRequirementById(
    requirementId: string,
    userId: string,
    userRole: string
  ): Promise<DocumentRequirement | null> {
    const { data: requirement, error } = await supabase
      .from("document_requirements")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, email)
      `
      )
      .eq("id", requirementId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch requirement: ${error.message}`);
    }

    // Check access permissions
    if (userRole === "advisor" && requirement.created_by !== userId) {
      throw new Error("You can only view your own requirements");
    }

    // Add submission stats
    const stats = await this.getSubmissionStats(requirementId);
    return { ...requirement, submission_stats: stats };
  }

  /**
   * Update a requirement
   */
  async updateRequirement(
    requirementId: string,
    advisorId: string,
    data: UpdateRequirementDTO
  ): Promise<DocumentRequirement> {
    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("document_requirements")
      .select("id, created_by")
      .eq("id", requirementId)
      .single();

    if (checkError || !existing) {
      throw new Error("Requirement not found");
    }

    if (existing.created_by !== advisorId) {
      throw new Error("You can only update your own requirements");
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.due_date !== undefined) updateData.due_date = data.due_date;
    if (data.is_mandatory !== undefined) updateData.is_mandatory = data.is_mandatory;
    if (data.target_audience !== undefined) updateData.target_audience = data.target_audience;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await supabase
      .from("document_requirements")
      .update(updateData)
      .eq("id", requirementId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update requirement: ${error.message}`);
    }

    return updated;
  }

  /**
   * Delete (archive) a requirement
   */
  async deleteRequirement(
    requirementId: string,
    advisorId: string
  ): Promise<void> {
    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("document_requirements")
      .select("id, created_by")
      .eq("id", requirementId)
      .single();

    if (checkError || !existing) {
      throw new Error("Requirement not found");
    }

    if (existing.created_by !== advisorId) {
      throw new Error("You can only delete your own requirements");
    }

    // Soft delete by archiving
    const { error } = await supabase
      .from("document_requirements")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", requirementId);

    if (error) {
      throw new Error(`Failed to delete requirement: ${error.message}`);
    }
  }

  /**
   * Get requirements assigned to a student
   */
  async getStudentRequirements(
    studentId: string,
    options: {
      status?: "pending" | "completed" | "all";
      internshipId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ requirements: any[]; total: number }> {
    const { status = "all", internshipId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Get student's internship IDs
    const { data: internships } = await supabase
      .from("internships")
      .select("id")
      .eq("student_id", studentId);

    const studentInternshipIds = internships?.map((i) => i.id) || [];

    // Build query for requirements targeting this student
    let query = supabase
      .from("document_requirements")
      .select(
        `
        *,
        creator:users!created_by(id, first_name, last_name, email)
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .order("due_date", { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: allRequirements, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch requirements: ${error.message}`);
    }

    // Filter requirements based on target audience
    const filteredRequirements = (allRequirements || []).filter((req) => {
      if (req.target_audience === "all_students") return true;
      
      if (req.target_audience === "specific_student") {
        const studentIds = req.metadata?.student_ids || [];
        return studentIds.includes(studentId);
      }
      
      if (req.target_audience === "specific_internship") {
        const reqInternshipIds = req.metadata?.internship_ids || [];
        return reqInternshipIds.some((id: string) => studentInternshipIds.includes(id));
      }
      
      return false;
    });

    // Filter by specific internship if provided
    let requirements = filteredRequirements;
    if (internshipId) {
      requirements = filteredRequirements.filter((req) => {
        if (req.target_audience === "all_students") return true;
        if (req.target_audience === "specific_internship") {
          const reqInternshipIds = req.metadata?.internship_ids || [];
          return reqInternshipIds.includes(internshipId);
        }
        return true;
      });
    }

    // Get student's submissions for each requirement
    const requirementsWithSubmissions = await Promise.all(
      requirements.map(async (req) => {
        const { data: submission } = await supabase
          .from("document_submissions")
          .select("*")
          .eq("requirement_id", req.id)
          .eq("student_id", studentId)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        const submissionStatus = submission?.status || "not_submitted";
        
        return {
          ...req,
          my_submission: submission,
          submission_status: submissionStatus,
          is_overdue: req.due_date && new Date(req.due_date) < new Date() && submissionStatus !== "approved",
        };
      })
    );

    // Filter by completion status if specified
    let finalRequirements = requirementsWithSubmissions;
    if (status === "pending") {
      finalRequirements = requirementsWithSubmissions.filter(
        (r) => r.submission_status !== "approved"
      );
    } else if (status === "completed") {
      finalRequirements = requirementsWithSubmissions.filter(
        (r) => r.submission_status === "approved"
      );
    }

    return {
      requirements: finalRequirements,
      total: finalRequirements.length,
    };
  }

  /**
   * Get submission statistics for a requirement
   */
  private async getSubmissionStats(requirementId: string): Promise<{
    total_submissions: number;
    pending: number;
    approved: number;
    rejected: number;
    revision_requested: number;
  }> {
    const { data: submissions } = await supabase
      .from("document_submissions")
      .select("status")
      .eq("requirement_id", requirementId);

    const stats = {
      total_submissions: submissions?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      revision_requested: 0,
    };

    submissions?.forEach((sub) => {
      if (sub.status === "pending") stats.pending++;
      else if (sub.status === "approved") stats.approved++;
      else if (sub.status === "rejected") stats.rejected++;
      else if (sub.status === "revision_requested") stats.revision_requested++;
    });

    return stats;
  }

  /**
   * Notify students about a new requirement
   */
  private async notifyStudentsAboutRequirement(
    requirement: DocumentRequirement
  ): Promise<void> {
    try {
      let studentIds: string[] = [];

      if (requirement.target_audience === "all_students") {
        // Get all students with active internships
        const { data: internships } = await supabase
          .from("internships")
          .select("student_id")
          .eq("status", "active");
        
        studentIds = [...new Set(internships?.map((i) => i.student_id) || [])];
      } else if (requirement.target_audience === "specific_student") {
        studentIds = requirement.metadata?.student_ids || [];
      } else if (requirement.target_audience === "specific_internship") {
        const internshipIds = requirement.metadata?.internship_ids || [];
        const { data: internships } = await supabase
          .from("internships")
          .select("student_id")
          .in("id", internshipIds);
        
        studentIds = [...new Set(internships?.map((i) => i.student_id) || [])];
      }

      // Create notifications for each student
      for (const studentId of studentIds) {
        await notificationService.createNotification({
          user_id: studentId,
          type: "document_required",
          title: "New Document Requirement",
          message: `You have a new document requirement: "${requirement.title}"${
            requirement.due_date
              ? ` - Due: ${new Date(requirement.due_date).toLocaleDateString()}`
              : ""
          }`,
          action_url: `/dashboard/student/requirements/${requirement.id}`,
          reference_type: "document_requirement",
        });
      }

      console.log(`Notified ${studentIds.length} students about requirement: ${requirement.title}`);
    } catch (error) {
      console.error("Error notifying students:", error);
      // Don't throw - notification failure shouldn't block requirement creation
    }
  }
}

export const documentRequirementsService = new DocumentRequirementsService();
