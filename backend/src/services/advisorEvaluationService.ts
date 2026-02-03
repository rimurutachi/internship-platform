import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Get pending evaluations for an advisor
 */
export async function getPendingEvaluations(advisorId: string) {
  try {
    // Get all internships for this advisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('advisor_id', advisorId);

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Get evaluations
    const { data: evaluations, error: evalsError } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        student:users!student_id(id, first_name, last_name, student_number),
        supervisor:users!supervisor_id(id, first_name, last_name),
        internship:internships(
          id,
          position,
          department,
          start_date,
          end_date,
          companies(name)
        )
      `)
      .in('internship_id', internshipIds)
      .eq('status', 'submitted')
      .eq('evaluation_type', 'final')
      .order('submitted_at', { ascending: true });

    if (evalsError) {
      throw new Error(`Failed to fetch evaluations: ${evalsError.message}`);
    }

    return {
      success: true,
      data: evaluations || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get evaluations by status for advisor
 */
export async function getEvaluationsByStatus(
  advisorId: string,
  status: 'submitted' | 'revision_requested' | 'approved'
) {
  try {
    // Get all internships for this advisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('advisor_id', advisorId);

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Get evaluations
    const { data: evaluations, error: evalsError } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        student:users!student_id(id, first_name, last_name, student_number),
        supervisor:users!supervisor_id(id, first_name, last_name),
        internship:internships(
          id,
          position,
          department,
          companies(name)
        )
      `)
      .in('internship_id', internshipIds)
      .eq('status', status)
      .eq('evaluation_type', 'final')
      .order('submitted_at', { ascending: false });

    if (evalsError) {
      throw new Error(`Failed to fetch evaluations: ${evalsError.message}`);
    }

    return {
      success: true,
      data: evaluations || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Approve evaluation
 * Optionally override final grade with justification
 * Optionally set grade reveal date for scheduled visibility
 * AI analytics will be triggered AFTER approval
 */
export async function approveEvaluation(
  evaluationId: string,
  advisorId: string,
  approvalData: {
    approval_comments?: string;
    grade_override?: number;
    grade_override_reason?: string;
    grade_reveal_date?: string; // ISO date string for scheduled grade visibility
  }
) {
  try {
    const { approval_comments, grade_override, grade_override_reason, grade_reveal_date } = approvalData;

    // Get evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select(`
        *,
        internship:internships(advisor_id, student_id, supervisor_id, university_id)
      `)
      .eq('id', evaluationId)
      .single();

    if (fetchError || !evaluation) {
      throw new Error('Evaluation not found');
    }

    // Verify advisor is assigned
    if (evaluation.internship.advisor_id !== advisorId) {
      throw new Error('You are not authorized to approve this evaluation');
    }

    if (evaluation.evaluation_type !== 'final') {
      throw new Error('Only final evaluations can be released to students');
    }

    if (evaluation.status !== 'submitted' && evaluation.status !== 'revision_requested') {
      throw new Error('Evaluation is not in a state that can be released');
    }

    // Validate grade override if provided
    if (grade_override !== undefined) {
      if (!grade_override_reason || grade_override_reason.trim().length < 10) {
        throw new Error('Grade override requires a reason (minimum 10 characters)');
      }
      if (grade_override < 1 || grade_override > 100) {
        throw new Error('Grade override must be between 1 and 100');
      }
    }

    // Prepare update data
    const updates: any = {
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: advisorId,
      advisor_comments: approval_comments?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Handle grade override
    if (grade_override !== undefined) {
      updates.advisor_grade_override = grade_override;
      updates.advisor_override_reason = grade_override_reason?.trim();
      updates.final_grade = grade_override; // Apply override to final grade
    }

    // Handle grade reveal date (for scheduled visibility to student)
    if (grade_reveal_date) {
      const revealDate = new Date(grade_reveal_date);
      if (isNaN(revealDate.getTime())) {
        throw new Error('Invalid grade reveal date format');
      }
      updates.grade_reveal_date = revealDate.toISOString();
    }

    // Update evaluation
    const { data: approvedEval, error: updateError } = await supabase
      .from('evaluations')
      .update(updates)
      .eq('id', evaluationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to approve evaluation: ${updateError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: advisorId,
      action: 'evaluation_approved',
      entity_type: 'evaluation',
      entity_id: evaluationId,
      details: {
        internship_id: evaluation.internship_id,
        student_id: evaluation.student_id,
        final_grade: updates.final_grade || evaluation.final_grade,
        grade_override: grade_override || null,
        grade_reveal_date: updates.grade_reveal_date || null,
        released_by_advisor: true,
      },
    });

    // Notify supervisor
    await supabase.from('notifications').insert({
      user_id: evaluation.internship.supervisor_id,
      type: 'evaluation_approved',
      title: 'Evaluation Approved',
      message: 'Your evaluation has been approved by the advisor',
      data: {
        evaluation_id: evaluationId,
        comments: approval_comments?.trim() || null,
      },
    });

    // Notify student
    await supabase.from('notifications').insert({
      user_id: evaluation.internship.student_id,
      type: 'evaluation_approved',
      title: 'Final Evaluation Approved',
      message: `Your final evaluation has been released by your advisor. Grade: ${evaluation.final_grade}`,
      data: {
        evaluation_id: evaluationId,
        final_grade: evaluation.final_grade,
      },
    });

    // NOTE: AI trend analysis removed from approval flow in v2.0.0
    // Admin can now trigger trend analysis on-demand from the analytics dashboard
    // This improves approval performance and allows more comprehensive batch analysis

    console.log(`✅ Evaluation ${evaluationId} approved successfully`);

    return {
      success: true,
      data: approvedEval,
      message: 'Evaluation approved successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Request revision on evaluation
 * Sends evaluation back to supervisor for changes
 */
export async function requestRevision(
  evaluationId: string,
  advisorId: string,
  revisionReason: string
) {
  try {
    if (!revisionReason || revisionReason.trim().length < 20) {
      throw new Error('Revision reason must be at least 20 characters');
    }

    // Get evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select(`
        *,
        internship:internships(advisor_id, student_id, supervisor_id)
      `)
      .eq('id', evaluationId)
      .single();

    if (fetchError || !evaluation) {
      throw new Error('Evaluation not found');
    }

    // Verify advisor is assigned
    if (evaluation.internship.advisor_id !== advisorId) {
      throw new Error('You are not authorized to request revision on this evaluation');
    }

    if (evaluation.status === 'approved') {
      throw new Error('Cannot request revision on approved evaluation');
    }

    // Update evaluation
    const { data: updatedEval, error: updateError } = await supabase
      .from('evaluations')
      .update({
        status: 'revision_requested',
        revision_requested_at: new Date().toISOString(),
        revision_requested_by: advisorId,
        revision_reason: revisionReason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', evaluationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to request revision: ${updateError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: advisorId,
      action: 'evaluation_revision_requested',
      entity_type: 'evaluation',
      entity_id: evaluationId,
      details: {
        internship_id: evaluation.internship_id,
        supervisor_id: evaluation.supervisor_id,
        revision_reason: revisionReason.trim(),
      },
    });

    // Notify supervisor with detailed feedback
    await supabase.from('notifications').insert({
      user_id: evaluation.internship.supervisor_id,
      type: 'evaluation_revision_requested',
      title: 'Evaluation Revision Requested',
      message: `The advisor has requested revisions on your evaluation: ${revisionReason}`,
      data: {
        evaluation_id: evaluationId,
        revision_reason: revisionReason.trim(),
      },
    });

    return {
      success: true,
      data: updatedEval,
      message: 'Revision requested. Supervisor has been notified.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get weekly reports for context
 * Advisor can view alongside evaluation
 */
export async function getWeeklyReportsForContext(internshipId: string) {
  try {
    const { data: reports, error } = await supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        student:users!student_id(first_name, last_name)
      `)
      .eq('internship_id', internshipId)
      .order('week_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch weekly reports: ${error.message}`);
    }

    return {
      success: true,
      data: reports || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get evaluation statistics for advisor dashboard
 */
export async function getEvaluationStatistics(advisorId: string) {
  try {
    // Get all internships for this advisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('advisor_id', advisorId);

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          pending: 0,
          revision_requested: 0,
          approved: 0,
        },
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Get counts by status
    const [totalResult, pendingResult, revisionResult, approvedResult] = await Promise.all([
      supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds),
      supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'submitted'),
      supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'revision_requested'),
      supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'approved'),
    ]);

    return {
      success: true,
      data: {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        revision_requested: revisionResult.count || 0,
        approved: approvedResult.count || 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// NOTE: triggerAIAnalytics function removed in v2.0.0
// AI trend analysis is now triggered on-demand by admin from the analytics dashboard
// See: backend/src/routes/admin/analytics.routes.ts for new implementation

/**
 * Get evaluation with full context (for advisor review)
 */
export async function getEvaluationWithContext(evaluationId: string, advisorId: string) {
  try {
    // Get evaluation
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        student:users!student_id(id, first_name, last_name, student_number),
        supervisor:users!supervisor_id(id, first_name, last_name),
        internship:internships(
          *,
          companies(name),
          advisor_id
        )
      `)
      .eq('id', evaluationId)
      .single();

    if (evalError || !evaluation) {
      throw new Error('Evaluation not found');
    }

    // Verify advisor authorization
    if (evaluation.internship.advisor_id !== advisorId) {
      throw new Error('Not authorized to view this evaluation');
    }

    // Get weekly reports for context
    const { data: weeklyReports } = await supabase
      .from('student_weekly_accomplishments')
      .select('*')
      .eq('internship_id', evaluation.internship_id)
      .order('week_number', { ascending: true });

    return {
      success: true,
      data: {
        evaluation,
        weekly_reports: weeklyReports || [],
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all weekly reports for students under an advisor
 * Standalone endpoint for advisor weekly reports page
 */
export async function getAllWeeklyReportsForAdvisor(
  advisorId: string,
  options: {
    status?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const { status, studentId, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    // Get all internships for this advisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id, student_id')
      .eq('advisor_id', advisorId)
      .or('is_archived.is.null,is_archived.eq.false');

    if (internshipsError) {
      throw new Error(`Failed to fetch internships: ${internshipsError.message}`);
    }

    if (!internships || internships.length === 0) {
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        statistics: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Build query for weekly reports
    let query = supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        student:users!student_id(id, first_name, last_name, email),
        internship:internships(
          id,
          position,
          company:companies(name)
        )
      `, { count: 'exact' })
      .in('internship_id', internshipIds)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error: reportsError, count } = await query;

    if (reportsError) {
      throw new Error(`Failed to fetch weekly reports: ${reportsError.message}`);
    }

    // Get statistics
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      supabase
        .from('student_weekly_accomplishments')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'pending_approval'),
      supabase
        .from('student_weekly_accomplishments')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'approved'),
      supabase
        .from('student_weekly_accomplishments')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds)
        .eq('status', 'rejected'),
    ]);

    return {
      success: true,
      data: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: (pendingCount.count || 0) + (approvedCount.count || 0) + (rejectedCount.count || 0),
        pending: pendingCount.count || 0,
        approved: approvedCount.count || 0,
        rejected: rejectedCount.count || 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
