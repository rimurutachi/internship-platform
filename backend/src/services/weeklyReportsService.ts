import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface WeeklyReportData {
  internship_id: string;
  week_number: number;
  accomplishments: string;
  hours_rendered: number;
  challenges?: string;
  learnings?: string;
}

export interface WeeklyReportFilters {
  internship_id?: string;
  student_id?: string;
  status?: 'pending_approval' | 'approved' | 'rejected';
  week_number?: number;
}

/**
 * Create a new weekly accomplishment report
 */
export async function createWeeklyReport(
  studentId: string,
  reportData: WeeklyReportData
) {
  try {
    const { internship_id, week_number, accomplishments, hours_rendered, challenges, learnings } = reportData;

    console.log('🔵 [WeeklyReportsService] Creating report:', {
      studentId,
      internship_id,
      week_number,
      accomplishmentsLength: accomplishments?.length || 0,
      hours_rendered
    });

    // Validate internship belongs to student
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('id, start_date, end_date, status')
      .eq('id', internship_id)
      .eq('student_id', studentId)
      .single();

    if (internshipError || !internship) {
      console.error('❌ [WeeklyReportsService] Internship validation failed:', {
        internship_id,
        studentId,
        error: internshipError?.message
      });
      throw new Error('Internship not found or does not belong to student');
    }

    console.log('✅ [WeeklyReportsService] Internship validated:', {
      internshipId: internship.id,
      status: internship.status
    });

    if (internship.status !== 'active' && internship.status !== 'ongoing') {
      console.error('❌ [WeeklyReportsService] Internship not active:', {
        internshipId: internship.id,
        status: internship.status
      });
      throw new Error('Cannot submit reports for inactive internships');
    }

    // Validate week number based on internship dates
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    console.log('🔵 [WeeklyReportsService] Week validation:', {
      totalWeeks,
      requestedWeek: week_number,
      startDate: internship.start_date,
      endDate: internship.end_date
    });

    if (week_number < 1 || week_number > totalWeeks) {
      console.error('❌ [WeeklyReportsService] Invalid week number:', {
        week_number,
        totalWeeks
      });
      throw new Error(`Week number must be between 1 and ${totalWeeks}`);
    }

    // Check if report already exists for this week
    const { data: existingReport } = await supabase
      .from('student_weekly_accomplishments')
      .select('id')
      .eq('internship_id', internship_id)
      .eq('week_number', week_number)
      .single();

    if (existingReport) {
      console.error('❌ [WeeklyReportsService] Report already exists for week:', week_number);
      throw new Error('A report for this week already exists');
    }

    // Validate accomplishments
    if (!accomplishments || accomplishments.trim().length < 50) {
      console.error('❌ [WeeklyReportsService] Accomplishments too short:', accomplishments?.length || 0);
      throw new Error('Accomplishments must be at least 50 characters');
    }

    // Validate hours
    if (hours_rendered < 0 || hours_rendered > 168) { // Max 24*7 hours per week
      console.error('❌ [WeeklyReportsService] Invalid hours:', hours_rendered);
      throw new Error('Hours rendered must be between 0 and 168');
    }

    // Combine optional fields into accomplishments to match DB schema
    const accomplishmentsBody = buildAccomplishmentBody(
      accomplishments,
      challenges,
      learnings
    );

    console.log('✅ [WeeklyReportsService] Validations passed, creating report...');

    console.log('🔵 [WeeklyReportsService] Inserting report into database...');

    // Create the report (use only existing columns in schema)
    const { data: report, error: createError } = await supabase
      .from('student_weekly_accomplishments')
      .insert({
        student_id: studentId,
        internship_id,
        week_number,
        accomplishments: accomplishmentsBody,
        hours_rendered,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [WeeklyReportsService] Database error:', createError);
      throw new Error(`Failed to create report: ${createError.message}`);
    }

    console.log('✅ [WeeklyReportsService] Report created:', report.id);

    // Get supervisor for notification
    const { data: supervisor } = await supabase
      .from('internships')
      .select('supervisor_id')
      .eq('id', internship_id)
      .single();

    if (supervisor?.supervisor_id) {
      console.log('📢 [WeeklyReportsService] Sending notification to supervisor:', supervisor.supervisor_id);
      
      // Notify supervisor
      await supabase.from('notifications').insert({
        user_id: supervisor.supervisor_id,
        type: 'weekly_report_submitted',
        title: 'New Weekly Report',
        message: `A student has submitted a weekly report for week ${week_number}`,
        data: {
          report_id: report.id,
          internship_id,
          week_number,
        },
      });
      
      console.log('✅ [WeeklyReportsService] Notification sent');
    }

    return {
      success: true,
      data: report,
    };
  } catch (error: any) {
    console.error('❌ [WeeklyReportsService] Error in createWeeklyReport:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all weekly reports for a student
 */
export async function getMyWeeklyReports(
  studentId: string,
  internshipId?: string
) {
  try {
    let query = supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        internship:internships(
          id,
          company_id,
          position,
          companies(name)
        )
      `)
      .eq('student_id', studentId)
      .order('week_number', { ascending: true });

    if (internshipId) {
      query = query.eq('internship_id', internshipId);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

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
 * Update a weekly report (only if pending or rejected)
 */
export async function updateWeeklyReport(
  reportId: string,
  studentId: string,
  updates: Partial<WeeklyReportData>
) {
  try {
    // Get current report
    const { data: report, error: fetchError } = await supabase
      .from('student_weekly_accomplishments')
      .select('*')
      .eq('id', reportId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found or does not belong to student');
    }

    // Check if editable
    if (report.status === 'approved') {
      throw new Error('Cannot edit approved reports');
    }

    // Validate updates
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    const shouldUpdateAccomplishments =
      updates.accomplishments !== undefined ||
      updates.challenges !== undefined ||
      updates.learnings !== undefined;

    if (shouldUpdateAccomplishments) {
      const baseAccomplishments = updates.accomplishments ?? report.accomplishments ?? '';
      if (baseAccomplishments.trim().length < 50) {
        throw new Error('Accomplishments must be at least 50 characters');
      }

      updateData.accomplishments = buildAccomplishmentBody(
        baseAccomplishments,
        updates.challenges,
        updates.learnings
      );
    }

    if (updates.hours_rendered !== undefined) {
      if (updates.hours_rendered < 0 || updates.hours_rendered > 168) {
        throw new Error('Hours rendered must be between 0 and 168');
      }
      updateData.hours_rendered = updates.hours_rendered;
    }

    // If report was rejected, reset to pending on update
    if (report.status === 'rejected') {
      updateData.status = 'pending_approval';
      updateData.supervisor_comments = null;
      updateData.rejected_at = null;
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabase
      .from('student_weekly_accomplishments')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    return {
      success: true,
      data: updatedReport,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get weekly reports by internship (for supervisor/advisor view)
 */
export async function getWeeklyReportsByInternship(
  internshipId: string,
  filters?: WeeklyReportFilters
) {
  try {
    let query = supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        student:users!student_id(
          id,
          first_name,
          last_name,
          email,
          student_number
        )
      `)
      .eq('internship_id', internshipId)
      .order('week_number', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.week_number) {
      query = query.eq('week_number', filters.week_number);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

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
 * Get single weekly report by ID
 */
export async function getWeeklyReportById(reportId: string) {
  try {
    const { data: report, error } = await supabase
      .from('student_weekly_accomplishments')
      .select(`
        *,
        student:users!student_id(
          id,
          first_name,
          last_name,
          email,
          student_number
        ),
        internship:internships(
          id,
          position,
          company_id,
          companies(name)
        )
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new Error('Report not found');
    }

    return {
      success: true,
      data: report,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get next report deadline for a student
 */
export async function getNextReportDeadline(
  studentId: string,
  internshipId: string
) {
  try {
    // Get internship details
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('start_date, end_date')
      .eq('id', internshipId)
      .eq('student_id', studentId)
      .single();

    if (internshipError || !internship) {
      throw new Error('Internship not found');
    }

    // Get submitted reports
    const { data: reports } = await supabase
      .from('student_weekly_accomplishments')
      .select('week_number')
      .eq('internship_id', internshipId)
      .eq('student_id', studentId);

    const submittedWeeks = new Set(reports?.map(r => r.week_number) || []);

    // Calculate current week
    const startDate = new Date(internship.start_date);
    const currentDate = new Date();
    const weeksPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    // Find next missing week
    for (let week = 1; week <= weeksPassed; week++) {
      if (!submittedWeeks.has(week)) {
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
        
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);

        return {
          success: true,
          data: {
            next_week: week,
            week_start: weekStartDate.toISOString(),
            week_end: weekEndDate.toISOString(),
            is_overdue: week < weeksPassed,
          },
        };
      }
    }

    return {
      success: true,
      data: null, // All reports submitted
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a weekly report (only if pending)
 */
export async function deleteWeeklyReport(
  reportId: string,
  studentId: string
) {
  try {
    // Get current report
    const { data: report, error: fetchError } = await supabase
      .from('student_weekly_accomplishments')
      .select('status')
      .eq('id', reportId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found or does not belong to student');
    }

    // Check if deletable
    if (report.status !== 'pending_approval') {
      throw new Error('Can only delete pending reports');
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('student_weekly_accomplishments')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      throw new Error(`Failed to delete report: ${deleteError.message}`);
    }

    return {
      success: true,
      message: 'Report deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

function buildAccomplishmentBody(
  accomplishments: string,
  challenges?: string,
  learnings?: string
): string {
  const lines: string[] = [accomplishments.trim()];

  if (challenges && challenges.trim().length > 0) {
    lines.push(`\n\nChallenges: ${challenges.trim()}`);
  }

  if (learnings && learnings.trim().length > 0) {
    lines.push(`\n\nLearnings: ${learnings.trim()}`);
  }

  return lines.join('');
}
