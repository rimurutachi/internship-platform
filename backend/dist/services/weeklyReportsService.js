"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWeeklyReport = createWeeklyReport;
exports.getMyWeeklyReports = getMyWeeklyReports;
exports.updateWeeklyReport = updateWeeklyReport;
exports.getWeeklyReportsByInternship = getWeeklyReportsByInternship;
exports.getWeeklyReportById = getWeeklyReportById;
exports.getNextReportDeadline = getNextReportDeadline;
exports.deleteWeeklyReport = deleteWeeklyReport;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Create a new weekly accomplishment report
 */
async function createWeeklyReport(studentId, reportData) {
    try {
        const { internship_id, week_number, accomplishments, hours_rendered, challenges, learnings } = reportData;
        // Validate internship belongs to student
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
        // Validate week number based on internship dates
        const startDate = new Date(internship.start_date);
        const endDate = new Date(internship.end_date);
        const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (week_number < 1 || week_number > totalWeeks) {
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
            throw new Error('A report for this week already exists');
        }
        // Validate accomplishments
        if (!accomplishments || accomplishments.trim().length < 50) {
            throw new Error('Accomplishments must be at least 50 characters');
        }
        // Validate hours
        if (hours_rendered < 0 || hours_rendered > 168) { // Max 24*7 hours per week
            throw new Error('Hours rendered must be between 0 and 168');
        }
        // Calculate week start and end dates
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + (week_number - 1) * 7);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        // Create the report
        const { data: report, error: createError } = await supabase
            .from('student_weekly_accomplishments')
            .insert({
            student_id: studentId,
            internship_id,
            week_number,
            week_start_date: weekStartDate.toISOString(),
            week_end_date: weekEndDate.toISOString(),
            accomplishments: accomplishments.trim(),
            hours_rendered,
            challenges: challenges?.trim() || null,
            learnings: learnings?.trim() || null,
            status: 'pending_approval',
            submitted_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (createError) {
            throw new Error(`Failed to create report: ${createError.message}`);
        }
        // Get supervisor for notification
        const { data: supervisor } = await supabase
            .from('internships')
            .select('supervisor_id')
            .eq('id', internship_id)
            .single();
        if (supervisor?.supervisor_id) {
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
        }
        return {
            success: true,
            data: report,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get all weekly reports for a student
 */
async function getMyWeeklyReports(studentId, internshipId) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Update a weekly report (only if pending or rejected)
 */
async function updateWeeklyReport(reportId, studentId, updates) {
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
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (updates.accomplishments) {
            if (updates.accomplishments.trim().length < 50) {
                throw new Error('Accomplishments must be at least 50 characters');
            }
            updateData.accomplishments = updates.accomplishments.trim();
        }
        if (updates.hours_rendered !== undefined) {
            if (updates.hours_rendered < 0 || updates.hours_rendered > 168) {
                throw new Error('Hours rendered must be between 0 and 168');
            }
            updateData.hours_rendered = updates.hours_rendered;
        }
        if (updates.challenges !== undefined) {
            updateData.challenges = updates.challenges?.trim() || null;
        }
        if (updates.learnings !== undefined) {
            updateData.learnings = updates.learnings?.trim() || null;
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get weekly reports by internship (for supervisor/advisor view)
 */
async function getWeeklyReportsByInternship(internshipId, filters) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get single weekly report by ID
 */
async function getWeeklyReportById(reportId) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get next report deadline for a student
 */
async function getNextReportDeadline(studentId, internshipId) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Delete a weekly report (only if pending)
 */
async function deleteWeeklyReport(reportId, studentId) {
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
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
//# sourceMappingURL=weeklyReportsService.js.map