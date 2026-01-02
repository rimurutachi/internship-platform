import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface ReportFilters {
  internship_id?: string;
  student_id?: string;
  status?: 'pending_approval' | 'approved' | 'rejected';
  week_number?: number;
}

/**
 * Get all student reports for a supervisor
 * Returns reports from all internships supervised by this supervisor
 */
export async function getStudentReports(
  supervisorId: string,
  filters?: ReportFilters
) {
  try {
    // Get all internships supervised by this supervisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('supervisor_id', supervisorId);

    if (internshipsError) {
      throw new Error(`Failed to fetch internships: ${internshipsError.message}`);
    }

    if (!internships || internships.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Build query for reports
    console.log('🔵 [SupervisorReportsService] Fetching reports for supervisor:', supervisorId);

    let query = supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        student:users!student_id(
          id,
          first_name,
          last_name,
          email
        ),
        internship:internships(
          id,
          position,
          department,
          company_id,
          start_date,
          end_date,
          companies(name)
        )
      `)
      .in('internship_id', internshipIds)
      .order('created_at', { ascending: false });

    console.log('🔵 [SupervisorReportsService] Querying reports for', internshipIds.length, 'internships');

    // Apply filters
    if (filters?.internship_id) {
      query = query.eq('internship_id', filters.internship_id);
    }

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.week_number) {
      query = query.eq('week_number', filters.week_number);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('❌ [SupervisorReportsService] Query error:', reportsError);
      throw new Error(`Failed to fetch reports: ${reportsError.message}`);
    }

    console.log('✅ [SupervisorReportsService] Fetched', reports?.length || 0, 'reports');

    return {
      success: true,
      data: reports,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get pending reports count for a supervisor
 */
export async function getPendingReportsCount(supervisorId: string) {
  try {
    // Get all internships supervised by this supervisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('supervisor_id', supervisorId);

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: { count: 0 },
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Count pending reports
    const { count, error: countError } = await supabase
      .from('student_weekly_accomplishments')
      .select('id', { count: 'exact', head: true })
      .in('internship_id', internshipIds)
      .eq('status', 'pending_approval');

    if (countError) {
      throw new Error(`Failed to count pending reports: ${countError.message}`);
    }

    return {
      success: true,
      data: { count: count || 0 },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Approve a weekly report
 */
export async function approveWeeklyReport(
  reportId: string,
  supervisorId: string,
  comments?: string
) {
  try {
    // Get the report with internship info
    const { data: report, error: fetchError } = await supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        internship:internships(
          id,
          supervisor_id,
          student_id,
          advisor_id
        )
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    // Verify supervisor is assigned to this internship
    if (report.internship.supervisor_id !== supervisorId) {
      throw new Error('You are not authorized to approve this report');
    }

    // Check if already approved
    if (report.status === 'approved') {
      throw new Error('Report is already approved');
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('student_weekly_accomplishments')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        supervisor_comments: comments?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to approve report: ${updateError.message}`);
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: report.student_id,
      type: 'weekly_report_approved',
      title: 'Weekly Report Approved',
      message: `Your weekly report for week ${report.week_number} has been approved${comments ? ': ' + comments : '.'}`,
      data: {
        report_id: reportId,
        week_number: report.week_number,
        comments: comments || null,
      },
    });

    // Optionally notify advisor
    if (report.internship.advisor_id) {
      await supabase.from('notifications').insert({
        user_id: report.internship.advisor_id,
        type: 'weekly_report_approved',
        title: 'Weekly Report Approved',
        message: `A weekly report for week ${report.week_number} has been approved by the supervisor`,
        data: {
          report_id: reportId,
          week_number: report.week_number,
          student_id: report.student_id,
        },
      });
    }

    return {
      success: true,
      data: updatedReport,
      message: 'Report approved successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Reject a weekly report
 */
export async function rejectWeeklyReport(
  reportId: string,
  supervisorId: string,
  rejectionReason: string
) {
  try {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // Get the report with internship info
    const { data: report, error: fetchError } = await supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        internship:internships(
          id,
          supervisor_id,
          student_id,
          advisor_id
        )
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    // Verify supervisor is assigned to this internship
    if (report.internship.supervisor_id !== supervisorId) {
      throw new Error('You are not authorized to reject this report');
    }

    // Check if already rejected or approved
    if (report.status === 'approved') {
      throw new Error('Cannot reject an approved report');
    }

    // Update report status
    const { data: updatedReport, error: updateError } = await supabase
      .from('student_weekly_accomplishments')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        supervisor_comments: rejectionReason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reject report: ${updateError.message}`);
    }

    // Notify student with rejection reason
    await supabase.from('notifications').insert({
      user_id: report.student_id,
      type: 'weekly_report_rejected',
      title: 'Weekly Report Needs Revision',
      message: `Your weekly report for week ${report.week_number} needs revision: ${rejectionReason}`,
      data: {
        report_id: reportId,
        week_number: report.week_number,
        rejection_reason: rejectionReason,
      },
    });

    return {
      success: true,
      data: updatedReport,
      message: 'Report rejected. Student has been notified.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get report statistics for supervisor
 */
export async function getReportStatistics(supervisorId: string) {
  try {
    // Get all internships supervised by this supervisor
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id')
      .eq('supervisor_id', supervisorId);

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        },
      };
    }

    const internshipIds = internships.map(i => i.id);

    // Get report counts by status
    const [totalResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
      supabase
        .from('student_weekly_accomplishments')
        .select('id', { count: 'exact', head: true })
        .in('internship_id', internshipIds),
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
      data: {
        total: totalResult.count || 0,
        pending: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0,
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
 * Get reports summary by student
 */
export async function getReportsSummaryByStudent(
  supervisorId: string,
  internshipId?: string
) {
  try {
    // Get internships
    let internshipsQuery = supabase
      .from('internships')
      .select('id, student_id')
      .eq('supervisor_id', supervisorId);

    if (internshipId) {
      internshipsQuery = internshipsQuery.eq('id', internshipId);
    }

    const { data: internships, error: internshipsError } = await internshipsQuery;

    if (internshipsError || !internships || internships.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const summaries = await Promise.all(
      internships.map(async (internship) => {
        const { data: reports } = await supabase
          .from('student_weekly_accomplishments')
          .select('id, status, week_number')
          .eq('internship_id', internship.id);

        const { data: student } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', internship.student_id)
          .single();

        return {
          student,
          internship_id: internship.id,
          total_reports: reports?.length || 0,
          pending: reports?.filter(r => r.status === 'pending_approval').length || 0,
          approved: reports?.filter(r => r.status === 'approved').length || 0,
          rejected: reports?.filter(r => r.status === 'rejected').length || 0,
        };
      })
    );

    return {
      success: true,
      data: summaries,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Add comment to existing report (without changing status)
 */
export async function addCommentToReport(
  reportId: string,
  supervisorId: string,
  comment: string
) {
  try {
    if (!comment || comment.trim().length === 0) {
      throw new Error('Comment cannot be empty');
    }

    // Get the report with internship info
    const { data: report, error: fetchError } = await supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        internship:internships(supervisor_id, student_id)
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found');
    }

    // Verify supervisor is assigned to this internship
    if (report.internship.supervisor_id !== supervisorId) {
      throw new Error('You are not authorized to comment on this report');
    }

    // Append comment to existing comments
    const existingComments = report.supervisor_comments || '';
    const newComments = existingComments
      ? `${existingComments}\n\n[${new Date().toISOString()}] ${comment.trim()}`
      : comment.trim();

    // Update report with new comment
    const { data: updatedReport, error: updateError } = await supabase
      .from('student_weekly_accomplishments')
      .update({
        supervisor_comments: newComments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to add comment: ${updateError.message}`);
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: report.student_id,
      type: 'weekly_report_comment',
      title: 'New Comment on Weekly Report',
      message: `Your supervisor added a comment on week ${report.week_number}: ${comment.trim()}`,
      data: {
        report_id: reportId,
        week_number: report.week_number,
        comment: comment.trim(),
      },
    });

    return {
      success: true,
      data: updatedReport,
      message: 'Comment added successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
