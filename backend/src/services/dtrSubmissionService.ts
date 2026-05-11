/**
 * DTR (Daily Time Record) Submission Service
 * 
 * Handles the full weekly DTR lifecycle:
 * - Student submits weekly DTR file (PDF/image)
 * - Advisor reviews (approve or request revision)
 * - On approval: AI scans DTR for hours extraction
 * - Extracted hours update internship total_hours_worked
 * 
 * Key design decisions:
 * - Revision = edit in place (update existing record, no duplication)
 * - One consolidated file per week
 * - AI scanning is primary, manual override as backup
 * - Daily reports remain but no longer affect total_hours_worked
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationService } from './notificationService';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const notificationService = new NotificationService();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ============================================================================
// Interfaces
// ============================================================================

export interface DTRSubmission {
  id: string;
  internship_id: string;
  student_id: string;
  requirement_id: string | null;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: 'pending' | 'approved' | 'revision_requested';
  reviewed_by: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  extracted_hours: number;
  ai_scan_status: 'pending' | 'scanning' | 'completed' | 'failed' | 'manual';
  ai_scan_result: Record<string, any>;
  manual_hours_override: number | null;
  version: number;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitDTRData {
  internship_id: string;
  requirement_id?: string;
  week_number: number;
  week_start_date: string;
  week_end_date: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface ReviewDTRData {
  status: 'approved' | 'revision_requested';
  feedback?: string;
  manual_hours_override?: number;
  manual_week_start_date?: string;
  manual_week_end_date?: string;
}

export interface DTRFilters {
  internship_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// DTR Submission Service
// ============================================================================

export class DTRSubmissionService {

  /**
   * Submit a weekly DTR (Student)
   */
  async submitDTR(
    studentId: string,
    data: SubmitDTRData
  ): Promise<DTRSubmission> {
    console.log(`📋 [DTR] Student ${studentId} submitting DTR for week ${data.week_number}`);

    // 1. Verify internship belongs to student and is active
    const { data: internship, error: intError } = await supabase
      .from('internships')
      .select('id, student_id, advisor_id, status, start_date, end_date')
      .eq('id', data.internship_id)
      .eq('student_id', studentId)
      .single();

    if (intError || !internship) {
      throw new Error('Internship not found or does not belong to student');
    }

    if (internship.status !== 'active') {
      throw new Error('Cannot submit DTR for inactive internships');
    }

    // 2. Validate week dates are within internship period
    const weekStart = new Date(data.week_start_date);
    const weekEnd = new Date(data.week_end_date);
    const intStart = new Date(internship.start_date);
    const intEnd = new Date(internship.end_date);

    if (weekStart < intStart || weekEnd > intEnd) {
      throw new Error('Week dates must be within the internship period');
    }

    if (weekEnd < weekStart) {
      throw new Error('Week end date must be after week start date');
    }

    // 3. Check for existing submission for this week
    const { data: existing } = await supabase
      .from('weekly_dtr_submissions')
      .select('id, status')
      .eq('internship_id', data.internship_id)
      .eq('week_number', data.week_number)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'approved') {
        throw new Error('DTR for this week has already been approved');
      }
      if (existing.status === 'pending') {
        throw new Error('A pending DTR submission already exists for this week. Please wait for advisor review.');
      }
    }

    // 4. Create the DTR submission
    const { data: dtr, error: createError } = await supabase
      .from('weekly_dtr_submissions')
      .insert({
        internship_id: data.internship_id,
        student_id: studentId,
        requirement_id: data.requirement_id || null,
        week_number: data.week_number,
        week_start_date: data.week_start_date,
        week_end_date: data.week_end_date,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size || null,
        mime_type: data.mime_type || null,
        status: 'pending',
        version: 1,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [DTR] Failed to create submission:', createError.message);
      throw new Error(`Failed to submit DTR: ${createError.message}`);
    }

    // 5. Notify the advisor
    await this.notifyAdvisorNewDTR(internship.advisor_id, dtr, studentId);

    console.log(`✅ [DTR] Submitted: ${dtr.id} for week ${data.week_number}`);
    return dtr;
  }

  /**
   * Edit/Resubmit a DTR after revision request (Student)
   * Updates the existing submission in place to avoid duplication
   */
  async resubmitDTR(
    dtrId: string,
    studentId: string,
    data: {
      file_url: string;
      file_name: string;
      file_size?: number;
      mime_type?: string;
    }
  ): Promise<DTRSubmission> {
    console.log(`📋 [DTR] Student ${studentId} resubmitting DTR ${dtrId}`);

    // 1. Get existing submission
    const { data: existing, error: fetchError } = await supabase
      .from('weekly_dtr_submissions')
      .select('*, internship:internships(advisor_id)')
      .eq('id', dtrId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !existing) {
      throw new Error('DTR submission not found');
    }

    // 2. Can only resubmit if status is revision_requested
    if (existing.status !== 'revision_requested') {
      throw new Error('Can only resubmit DTR that has revision requested');
    }

    // 3. Update in place (edit existing record)
    const { data: updated, error: updateError } = await supabase
      .from('weekly_dtr_submissions')
      .update({
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size || null,
        mime_type: data.mime_type || null,
        status: 'pending',
        feedback: null,         // Clear previous feedback
        reviewed_by: null,      // Clear previous reviewer
        reviewed_at: null,
        extracted_hours: 0,     // Reset AI extraction
        ai_scan_status: 'pending',
        ai_scan_result: {},
        manual_hours_override: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dtrId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [DTR] Failed to resubmit:', updateError.message);
      throw new Error(`Failed to resubmit DTR: ${updateError.message}`);
    }

    // 4. Notify advisor
    const advisorId = (existing.internship as any)?.advisor_id;
    if (advisorId) {
      await this.notifyAdvisorNewDTR(advisorId, updated, studentId, true);
    }

    console.log(`✅ [DTR] Resubmitted: ${dtrId}`);
    return updated;
  }

  /**
   * Get student's DTR submissions
   */
  async getStudentDTRs(
    studentId: string,
    filters: DTRFilters = {}
  ): Promise<{ submissions: DTRSubmission[]; total: number }> {
    const { internship_id, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('weekly_dtr_submissions')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .order('week_number', { ascending: false });

    if (internship_id) {
      query = query.eq('internship_id', internship_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [DTR] Failed to fetch student DTRs:', error.message);
      throw new Error('Failed to fetch DTR submissions');
    }

    return {
      submissions: data || [],
      total: count || 0,
    };
  }

  /**
   * Get a single DTR submission by ID with access control
   */
  async getDTRById(
    dtrId: string,
    userId: string,
    role: string
  ): Promise<DTRSubmission> {
    const { data: dtr, error } = await supabase
      .from('weekly_dtr_submissions')
      .select(`
        *,
        student:users!weekly_dtr_submissions_student_id_fkey(id, first_name, last_name, email),
        internship:internships(id, advisor_id, company_id, position)
      `)
      .eq('id', dtrId)
      .single();

    if (error || !dtr) {
      throw new Error('DTR submission not found');
    }

    // Access control
    if (role === 'student' && dtr.student_id !== userId) {
      throw new Error('Access denied');
    }

    if (role === 'advisor') {
      const internship = dtr.internship as any;
      if (internship?.advisor_id !== userId) {
        throw new Error('Access denied');
      }
    }

    return dtr;
  }

  /**
   * Get all DTR submissions for advisor's students
   */
  async getAdvisorDTRSubmissions(
    advisorId: string,
    filters: DTRFilters = {}
  ): Promise<{ submissions: any[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // Get internship IDs for this advisor
    const { data: internships } = await supabase
      .from('internships')
      .select('id')
      .eq('advisor_id', advisorId)
      .eq('status', 'active');

    const internshipIds = internships?.map(i => i.id) || [];

    if (internshipIds.length === 0) {
      return { submissions: [], total: 0 };
    }

    let query = supabase
      .from('weekly_dtr_submissions')
      .select(`
        *,
        student:users!weekly_dtr_submissions_student_id_fkey(id, first_name, last_name, email),
        internship:internships(id, position, company_id, companies:companies(name))
      `, { count: 'exact' })
      .in('internship_id', internshipIds)
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [DTR] Failed to fetch advisor DTRs:', error.message);
      throw new Error('Failed to fetch DTR submissions');
    }

    return {
      submissions: data || [],
      total: count || 0,
    };
  }

  /**
   * Review a DTR submission (Advisor)
   * On approval: triggers AI scan for hours extraction
   */
  async reviewDTR(
    dtrId: string,
    advisorId: string,
    review: ReviewDTRData
  ): Promise<DTRSubmission> {
    console.log(`📝 [DTR] Advisor ${advisorId} reviewing DTR ${dtrId}: ${review.status}`);

    // 1. Get the DTR and verify advisor owns the internship
    const { data: dtr, error: fetchError } = await supabase
      .from('weekly_dtr_submissions')
      .select('*, internship:internships(id, advisor_id, student_id)')
      .eq('id', dtrId)
      .single();

    if (fetchError || !dtr) {
      throw new Error('DTR submission not found');
    }

    const internship = dtr.internship as any;
    if (!internship || internship.advisor_id !== advisorId) {
      throw new Error('Access denied - you do not advise this internship');
    }

    // 2. Can only review pending submissions
    if (dtr.status !== 'pending') {
      throw new Error('Only pending DTR submissions can be reviewed');
    }

    // 3. Update the submission
    const updateData: any = {
      status: review.status,
      reviewed_by: advisorId,
      reviewed_at: new Date().toISOString(),
      feedback: review.feedback || null,
      updated_at: new Date().toISOString(),
    };

    // If advisor provides manual hours override
    if (review.manual_hours_override !== undefined && review.manual_hours_override !== null) {
      updateData.manual_hours_override = review.manual_hours_override;
      updateData.ai_scan_status = 'manual';
      updateData.extracted_hours = review.manual_hours_override;
    }

    // If advisor provides manual date override (e.g., when AI fails to extract dates)
    if (review.manual_week_start_date) {
      updateData.week_start_date = review.manual_week_start_date;
    }
    if (review.manual_week_end_date) {
      updateData.week_end_date = review.manual_week_end_date;
    }

    const { data: updated, error: updateError } = await supabase
      .from('weekly_dtr_submissions')
      .update(updateData)
      .eq('id', dtrId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [DTR] Failed to update review:', updateError.message);
      throw new Error('Failed to review DTR submission');
    }

    // 4. If approved and no manual override, trigger AI scan
    if (review.status === 'approved' && !review.manual_hours_override) {
      // Fire-and-forget AI scan (non-blocking)
      this.triggerAIScan(dtrId, updated.file_url, dtr.internship_id).catch(err => {
        console.error('❌ [DTR] AI scan failed (non-blocking):', err.message);
      });
    }

    // 5. If approved with manual hours, recalculate total immediately
    if (review.status === 'approved' && review.manual_hours_override) {
      await this.recalculateDTRHours(dtr.internship_id);
    }

    // 6. Notify the student
    await this.notifyStudentReview(dtr.student_id, updated);

    console.log(`✅ [DTR] Review complete: ${dtrId} → ${review.status}`);
    return updated;
  }

  /**
   * Trigger AI scan for DTR hours extraction
   */
  private async triggerAIScan(
    dtrId: string,
    fileUrl: string,
    internshipId: string
  ): Promise<void> {
    console.log(`🤖 [DTR] Triggering AI scan for DTR ${dtrId}`);

    // 1. Mark as scanning
    await supabase
      .from('weekly_dtr_submissions')
      .update({ ai_scan_status: 'scanning', updated_at: new Date().toISOString() })
      .eq('id', dtrId);

    try {
      // 2. Generate a signed URL for the file
      const signedUrl = await this.generateSignedUrl(fileUrl);

      // 3. Call AI service
      const response = await axios.post(`${AI_SERVICE_URL}/api/scan-dtr`, {
        file_url: signedUrl,
        dtr_id: dtrId,
      }, { timeout: 60000 });

      const scanResult = response.data;
      const extractedHours = scanResult.total_hours || 0;

      console.log(`🤖 [DTR] AI scan result: ${extractedHours} hours (confidence: ${scanResult.confidence_score})`);

      // 4. Update DTR with scan results
      await supabase
        .from('weekly_dtr_submissions')
        .update({
          extracted_hours: extractedHours,
          ai_scan_status: 'completed',
          ai_scan_result: scanResult,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dtrId);

      // 5. Recalculate total hours for the internship
      await this.recalculateDTRHours(internshipId);

      console.log(`✅ [DTR] AI scan complete: ${extractedHours} hours extracted`);
    } catch (error: any) {
      console.error('❌ [DTR] AI scan error:', error.message);

      // Mark as failed
      await supabase
        .from('weekly_dtr_submissions')
        .update({
          ai_scan_status: 'failed',
          ai_scan_result: { error: error.message },
          updated_at: new Date().toISOString(),
        })
        .eq('id', dtrId);
    }
  }

  /**
   * Generate a signed URL for a DTR file
   */
  private async generateSignedUrl(fileUrl: string): Promise<string> {
    // Extract path from URL or use as-is
    let storagePath = fileUrl;

    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/(?:object\/(?:public|sign)\/)?documents\/(.+)$/);
        if (pathMatch) {
          storagePath = pathMatch[1];
        }
      } catch {
        // Keep as-is
      }
    }

    try {
      storagePath = decodeURIComponent(storagePath);
    } catch {
      // Keep as-is
    }

    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 3600);

    if (error || !data) {
      throw new Error(`Failed to generate signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Generate a signed URL for a DTR submission file (public-facing, with access control)
   */
  async getSignedUrlForDTR(
    dtrId: string,
    userId: string,
    role: 'student' | 'advisor'
  ): Promise<{ signedUrl: string; expiresIn: number }> {
    // Get the submission with access check
    const { data: dtr, error: fetchError } = await supabase
      .from('weekly_dtr_submissions')
      .select('id, file_url, student_id, internship_id, internship:internships(advisor_id)')
      .eq('id', dtrId)
      .single();

    if (fetchError || !dtr) {
      throw new Error('DTR submission not found');
    }

    // Authorization check
    if (role === 'student' && dtr.student_id !== userId) {
      throw new Error('Access denied');
    }

    if (role === 'advisor') {
      const internship = dtr.internship as any;
      if (internship?.advisor_id !== userId) {
        throw new Error('Access denied');
      }
    }

    const signedUrl = await this.generateSignedUrl(dtr.file_url);
    return { signedUrl, expiresIn: 3600 };
  }

  /**
   * Recalculate total_hours_worked from approved DTR submissions
   * This is the single source of truth for student progress
   */
  async recalculateDTRHours(internshipId: string): Promise<{ total: number }> {
    console.log(`🔵 [DTR] Recalculating hours for internship ${internshipId}`);

    const { data: approvedDTRs } = await supabase
      .from('weekly_dtr_submissions')
      .select('extracted_hours, manual_hours_override')
      .eq('internship_id', internshipId)
      .eq('status', 'approved');

    const totalHours = (approvedDTRs || []).reduce((sum, dtr) => {
      // Use manual override if available, otherwise use AI-extracted hours
      const hours = dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
      return sum + Number(hours);
    }, 0);

    // Update internship total_hours_worked
    const { error } = await supabase
      .from('internships')
      .update({
        total_hours_worked: totalHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', internshipId);

    if (error) {
      console.error('❌ [DTR] Failed to update total hours:', error.message);
    }

    console.log(`✅ [DTR] Total hours for internship ${internshipId}: ${totalHours}`);
    return { total: totalHours };
  }

  // ============================================================================
  // Notification Helpers
  // ============================================================================

  private async notifyAdvisorNewDTR(
    advisorId: string,
    dtr: DTRSubmission,
    studentId: string,
    isResubmission: boolean = false
  ): Promise<void> {
    try {
      const { data: student } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', studentId)
        .single();

      const studentName = student
        ? `${student.first_name} ${student.last_name}`
        : 'A student';

      await notificationService.createNotification({
        user_id: advisorId,
        type: 'document_submitted',
        title: isResubmission ? 'DTR Resubmitted' : 'New Weekly DTR Submission',
        message: isResubmission
          ? `${studentName} has resubmitted their Weekly DTR for Week ${dtr.week_number}`
          : `${studentName} has submitted their Weekly DTR for Week ${dtr.week_number}`,
        action_url: `/dashboard/advisor/dtr-submissions`,
        reference_type: 'weekly_dtr',
      });
    } catch (error) {
      console.error('⚠️ [DTR] Failed to notify advisor:', error);
    }
  }

  private async notifyStudentReview(
    studentId: string,
    dtr: DTRSubmission
  ): Promise<void> {
    try {
      let title: string;
      let message: string;

      if (dtr.status === 'approved') {
        const hours = dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
        title = 'Weekly DTR Approved';
        message = `Your Weekly DTR for Week ${dtr.week_number} has been approved${hours > 0 ? `. ${hours} hours added to your progress.` : '.'}`;
      } else if (dtr.status === 'revision_requested') {
        title = 'DTR Revision Requested';
        message = `Please revise and resubmit your Weekly DTR for Week ${dtr.week_number}`;
        if (dtr.feedback) {
          message += `. Feedback: ${dtr.feedback}`;
        }
      } else {
        return;
      }

      await notificationService.createNotification({
        user_id: studentId,
        type: 'document_reviewed',
        title,
        message,
        action_url: `/dashboard/student/dtr`,
        reference_type: 'weekly_dtr',
      });
    } catch (error) {
      console.error('⚠️ [DTR] Failed to notify student:', error);
    }
  }
}

// Export singleton instance
export const dtrSubmissionService = new DTRSubmissionService();
