import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface DailyReportData {
  internship_id: string;
  report_date: string; // YYYY-MM-DD
  activities: string;
  learnings?: string;
  hours_worked: number;
}

export interface DailyReportFilters {
  internship_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Create a new daily report
 */
export async function createDailyReport(
  studentId: string,
  reportData: DailyReportData
) {
  try {
    const { internship_id, report_date, activities, learnings, hours_worked } = reportData;

    console.log('🔵 [DailyReports] Creating report:', { studentId, internship_id, report_date });

    // Validate internship belongs to student and is active
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('id, start_date, end_date, status')
      .eq('id', internship_id)
      .eq('student_id', studentId)
      .single();

    if (internshipError || !internship) {
      throw new Error('Internship not found or does not belong to student');
    }

    if (internship.status !== 'active' && internship.status !== 'ongoing') {
      throw new Error('Cannot submit reports for inactive internships');
    }

    // Validate report_date is within internship period
    const reportDateObj = new Date(report_date);
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    // Set all to midnight for a clean comparison
    reportDateObj.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (reportDateObj < startDate || reportDateObj > endDate) {
      throw new Error('Report date must be within the internship period');
    }

    // Validate report_date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reportDateObj > today) {
      throw new Error('Cannot submit a report for a future date');
    }

    // Validate activities
    if (!activities || activities.trim().length < 10) {
      throw new Error('Activities must be at least 10 characters');
    }

    // Validate hours
    if (hours_worked < 0 || hours_worked > 24) {
      throw new Error('Hours worked must be between 0 and 24');
    }

    // Insert daily report
    const { data: report, error: createError } = await supabase
      .from('student_daily_reports')
      .insert({
        student_id: studentId,
        internship_id,
        report_date,
        activities: activities.trim(),
        learnings: learnings?.trim() || null,
        hours_worked,
      })
      .select()
      .single();

    if (createError) {
      if (createError.message.includes('unique') || createError.message.includes('duplicate')) {
        throw new Error('A report for this date already exists');
      }
      throw new Error(`Failed to create report: ${createError.message}`);
    }

    console.log('✅ [DailyReports] Report created:', report.id);

    // NOTE: Daily reports no longer affect total_hours_worked.
    // Hours are now tracked exclusively via approved weekly DTR submissions.

    return { success: true, data: report };
  } catch (error: any) {
    console.error('❌ [DailyReports] Error creating report:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all daily reports for a student's internship
 */
export async function getMyDailyReports(
  studentId: string,
  internshipId?: string,
  filters?: { start_date?: string; end_date?: string }
) {
  try {
    let query = supabase
      .from('student_daily_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('report_date', { ascending: false });

    if (internshipId) {
      query = query.eq('internship_id', internshipId);
    }
    if (filters?.start_date) {
      query = query.gte('report_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('report_date', filters.end_date);
    }

    const { data: reports, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return { success: true, data: reports || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update a daily report
 */
export async function updateDailyReport(
  reportId: string,
  studentId: string,
  updates: Partial<DailyReportData>
) {
  try {
    // Get current report - verify ownership
    const { data: report, error: fetchError } = await supabase
      .from('student_daily_reports')
      .select('*')
      .eq('id', reportId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found or does not belong to student');
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.activities !== undefined) {
      if (updates.activities.trim().length < 10) {
        throw new Error('Activities must be at least 10 characters');
      }
      updateData.activities = updates.activities.trim();
    }

    if (updates.learnings !== undefined) {
      updateData.learnings = updates.learnings?.trim() || null;
    }

    if (updates.hours_worked !== undefined) {
      if (updates.hours_worked < 0 || updates.hours_worked > 24) {
        throw new Error('Hours worked must be between 0 and 24');
      }
      updateData.hours_worked = updates.hours_worked;
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('student_daily_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`);
    }

    // NOTE: Daily reports no longer affect total_hours_worked.
    // Hours are tracked exclusively via approved weekly DTR submissions.

    return { success: true, data: updatedReport };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete a daily report
 */
export async function deleteDailyReport(
  reportId: string,
  studentId: string
) {
  try {
    const { data: report, error: fetchError } = await supabase
      .from('student_daily_reports')
      .select('internship_id')
      .eq('id', reportId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found or does not belong to student');
    }

    const { error: deleteError } = await supabase
      .from('student_daily_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      throw new Error(`Failed to delete report: ${deleteError.message}`);
    }

    // NOTE: Daily reports no longer affect total_hours_worked.
    // Hours are tracked exclusively via approved weekly DTR submissions.

    return { success: true, message: 'Report deleted successfully' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a single daily report by ID (student-only)
 */
export async function getDailyReportById(reportId: string, studentId: string) {
  try {
    const { data: report, error } = await supabase
      .from('student_daily_reports')
      .select('*')
      .eq('id', reportId)
      .eq('student_id', studentId)
      .single();

    if (error || !report) {
      throw new Error('Report not found');
    }

    return { success: true, data: report };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Recalculate and update total_hours_worked on the internship
 */
async function recalculateTotalHours(internshipId: string) {
  try {
    const { data: reports } = await supabase
      .from('student_daily_reports')
      .select('hours_worked')
      .eq('internship_id', internshipId);

    const totalHours = reports?.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0) || 0;

    await supabase
      .from('internships')
      .update({ total_hours_worked: totalHours })
      .eq('id', internshipId);

    console.log(`✅ [DailyReports] Updated total_hours_worked for internship ${internshipId}: ${totalHours}`);
  } catch (error: any) {
    console.error('⚠️ [DailyReports] Failed to recalculate hours:', error.message);
  }
}

/**
 * Get progress summary for an internship (used by advisors/admins for progress view only)
 * Does NOT expose individual report content
 */
export async function getProgressSummary(internshipId: string) {
  try {
    const { data: reports, error } = await supabase
      .from('student_daily_reports')
      .select('hours_worked, report_date')
      .eq('internship_id', internshipId)
      .order('report_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    const totalHours = reports?.reduce((sum, r) => sum + (Number(r.hours_worked) || 0), 0) || 0;
    const totalDaysReported = reports?.length || 0;
    const firstDate = reports?.[0]?.report_date || null;
    const lastDate = reports?.[reports.length - 1]?.report_date || null;

    return {
      success: true,
      data: {
        total_hours: totalHours,
        total_days_reported: totalDaysReported,
        first_report_date: firstDate,
        last_report_date: lastDate,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
