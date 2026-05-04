import { createClient } from '@supabase/supabase-js';
import notificationService from './notificationService';
import { dtrSubmissionService } from './dtrSubmissionService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ============================================================================
// Interfaces
// ============================================================================

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  reviewed_by: string | null;
  feedback: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionDTO {
  requirement_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface ReviewSubmissionDTO {
  status: 'approved' | 'rejected' | 'revision_requested';
  feedback?: string;
  manual_hours_override?: number;
}

export interface SubmissionFilters {
  requirement_id?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Document Submissions Service
// ============================================================================

export class DocumentSubmissionsService {
  /**
   * Submit a document for a requirement
   */
  async submitDocument(
    studentId: string,
    data: CreateSubmissionDTO
  ): Promise<DocumentSubmission> {
    // 1. Verify the requirement exists and is active
    const { data: requirement, error: reqError } = await supabase
      .from('document_requirements')
      .select('id, title, created_by, target_audience, metadata, due_date, status')
      .eq('id', data.requirement_id)
      .eq('status', 'active')
      .single();

    if (reqError || !requirement) {
      throw new Error('Document requirement not found or inactive');
    }

    // 2. Check if student is targeted by this requirement
    const isTargeted = this.isStudentTargeted(studentId, requirement.target_audience, requirement.metadata);
    if (!isTargeted) {
      throw new Error('You are not assigned to this document requirement');
    }

    // 3. Check if due date has passed
    if (requirement.due_date && new Date(requirement.due_date) < new Date()) {
      throw new Error('The due date for this requirement has passed');
    }

    // 4. Get the current version number (for resubmissions)
    const { data: existingSubmissions } = await supabase
      .from('document_submissions')
      .select('version')
      .eq('requirement_id', data.requirement_id)
      .eq('student_id', studentId)
      .order('version', { ascending: false })
      .limit(1);

    const currentVersion = existingSubmissions?.[0]?.version || 0;

    // 5. Create the submission
    const { data: submission, error: submitError } = await supabase
      .from('document_submissions')
      .insert({
        requirement_id: data.requirement_id,
        student_id: studentId,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size,
        mime_type: data.mime_type,
        version: currentVersion + 1,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submitError) {
      console.error('Error creating submission:', submitError);
      throw new Error('Failed to create submission');
    }

    // 6. Notify the advisor about the new submission
    await this.notifyAdvisorAboutSubmission(requirement.created_by, submission, requirement.title);

    console.log(`📄 Document submitted: ${submission.id} by student ${studentId}`);
    return submission;
  }

  /**
   * Resubmit a document after revision request
   */
  async resubmitDocument(
    submissionId: string,
    studentId: string,
    data: Omit<CreateSubmissionDTO, 'requirement_id'>
  ): Promise<DocumentSubmission> {
    // 1. Get the original submission
    const { data: original, error: origError } = await supabase
      .from('document_submissions')
      .select(`
        id, requirement_id, student_id, version, status,
        requirement:document_requirements(id, title, created_by, due_date, status)
      `)
      .eq('id', submissionId)
      .eq('student_id', studentId)
      .single();

    if (origError || !original) {
      throw new Error('Original submission not found');
    }

    // 2. Can only resubmit if status is revision_requested
    if (original.status !== 'revision_requested') {
      throw new Error('Resubmission is only allowed for documents with revision requested');
    }

    // 3. Check if requirement is still active
    const requirement = original.requirement as any;
    if (!requirement || requirement.status !== 'active') {
      throw new Error('The document requirement is no longer active');
    }

    // 4. Create new submission with incremented version
    const { data: submission, error: submitError } = await supabase
      .from('document_submissions')
      .insert({
        requirement_id: original.requirement_id,
        student_id: studentId,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size,
        mime_type: data.mime_type,
        version: original.version + 1,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (submitError) {
      console.error('Error creating resubmission:', submitError);
      throw new Error('Failed to create resubmission');
    }

    // 5. Notify the advisor
    await this.notifyAdvisorAboutSubmission(
      requirement.created_by,
      submission,
      requirement.title,
      true
    );

    console.log(`📄 Document resubmitted: ${submission.id} (v${submission.version}) by student ${studentId}`);
    return submission;
  }

  /**
   * Get submissions for a student
   */
  async getStudentSubmissions(
    studentId: string,
    filters: SubmissionFilters = {}
  ): Promise<{ submissions: any[]; total: number }> {
    const { requirement_id, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('document_submissions')
      .select(`
        id, file_url, file_name, file_size, mime_type, version,
        status, feedback, reviewed_at, submitted_at, created_at,
        requirement:document_requirements(
          id, title, description, due_date
        )
      `, { count: 'exact' })
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (requirement_id) {
      query = query.eq('requirement_id', requirement_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching student submissions:', error);
      throw new Error('Failed to fetch submissions');
    }

    return {
      submissions: submissions || [],
      total: count || 0,
    };
  }

  /**
   * Get submissions for a requirement (advisor view)
   */
  async getRequirementSubmissions(
    requirementId: string,
    advisorId: string,
    filters: SubmissionFilters = {}
  ): Promise<{ submissions: any[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 1. Verify advisor owns this requirement
    const { data: requirements, error: reqError } = await supabase
      .from('document_requirements')
      .select('id')
      .eq('id', requirementId)
      .eq('created_by', advisorId);

    if (reqError) {
      console.error('Error verifying requirement ownership:', reqError);
      throw new Error('Failed to verify requirement access');
    }

    if (!requirements || requirements.length === 0) {
      console.log(`Requirement ${requirementId} not found or not owned by advisor ${advisorId}`);
      throw new Error('Requirement not found or access denied');
    }

    // 2. Fetch submissions with student info
    let query = supabase
      .from('document_submissions')
      .select(`
        id, file_url, file_name, file_size, mime_type, version,
        status, reviewed_by, feedback, reviewed_at, submitted_at, created_at,
        student:users!document_submissions_student_id_fkey(
          id, first_name, last_name, email
        )
      `, { count: 'exact' })
      .eq('requirement_id', requirementId)
      .order('submitted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching requirement submissions:', error);
      throw new Error('Failed to fetch submissions');
    }

    return {
      submissions: submissions || [],
      total: count || 0,
    };
  }

  /**
   * Get a single submission by ID
   */
  async getSubmissionById(
    submissionId: string,
    userId: string,
    role: string
  ): Promise<any> {
    const { data: submission, error } = await supabase
      .from('document_submissions')
      .select(`
        id, file_url, file_name, file_size, mime_type, version,
        status, reviewed_by, feedback, reviewed_at, submitted_at, created_at, student_id,
        student:users!document_submissions_student_id_fkey(
          id, first_name, last_name, email
        ),
        requirement:document_requirements(
          id, title, description, due_date, created_by
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      throw new Error('Submission not found');
    }

    // Access control - using student_id directly since student relation may be array
    const requirement = submission.requirement as any;
    const studentData = submission.student as any;
    const studentId = studentData?.id || submission.student_id;

    if (role === 'student' && studentId !== userId) {
      throw new Error('Access denied');
    }

    if (role === 'advisor' && requirement?.created_by !== userId) {
      throw new Error('Access denied');
    }

    return submission;
  }

  /**
   * Review a submission (advisor only)
   */
  /**
   * Check if a requirement title indicates a DTR (Daily Time Record) requirement
   */
  private isDTRRequirement(title: string): boolean {
    const lower = title.toLowerCase();
    return lower.includes('daily time record') || lower.includes('dtr');
  }

  /**
   * Extract week number from a requirement title like "Weekly Daily Time Record - Week 3"
   * Returns the number or 1 as fallback
   */
  private extractWeekNumber(title: string): number {
    const match = title.match(/week\s*(\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  async reviewSubmission(
    submissionId: string,
    advisorId: string,
    review: ReviewSubmissionDTO
  ): Promise<DocumentSubmission> {
    // 1. Get the submission and verify ownership
    const { data: submission, error: subError } = await supabase
      .from('document_submissions')
      .select(`
        id, student_id, status, file_url, file_name, file_size, mime_type,
        requirement:document_requirements(id, title, created_by, due_date)
      `)
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      throw new Error('Submission not found');
    }

    const requirement = submission.requirement as any;
    if (!requirement || requirement.created_by !== advisorId) {
      throw new Error('Access denied - you do not own this requirement');
    }

    // 2. Can only review pending submissions
    if (submission.status !== 'pending') {
      throw new Error('Only pending submissions can be reviewed');
    }

    // 3. Update the submission
    const { data: updated, error: updateError } = await supabase
      .from('document_submissions')
      .update({
        status: review.status,
        reviewed_by: advisorId,
        feedback: review.feedback || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reviewing submission:', updateError);
      throw new Error('Failed to update submission status');
    }

    // 4. If this is a DTR requirement and it was approved, process DTR hours
    if (review.status === 'approved' && this.isDTRRequirement(requirement.title)) {
      console.log(`📋 [DTR] Detected DTR requirement: "${requirement.title}"`);
      await this.processDTRApproval(
        submission,
        requirement,
        advisorId,
        review.manual_hours_override
      );
    }

    // 5. Notify the student about the review result
    await this.notifyStudentAboutReview(submission.student_id, updated, requirement.title);

    console.log(`📝 Submission ${submissionId} reviewed: ${review.status}`);
    return updated;
  }

  /**
   * Process a DTR approval: create weekly_dtr_submissions record,
   * trigger AI scan or apply manual hours, recalculate total.
   */
  private async processDTRApproval(
    submission: any,
    requirement: any,
    advisorId: string,
    manualHoursOverride?: number
  ): Promise<void> {
    try {
      const weekNumber = this.extractWeekNumber(requirement.title);
      const studentId = submission.student_id;

      // 1. Find the student's active internship
      const { data: internship } = await supabase
        .from('internships')
        .select('id, start_date, end_date')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

      if (!internship) {
        console.warn(`⚠️ [DTR] No active internship found for student ${studentId}, skipping hours`);
        return;
      }

      // 2. Calculate week dates from the due date or internship dates
      const dueDate = requirement.due_date ? new Date(requirement.due_date) : new Date();
      // Week end = due date, Week start = 7 days before
      const weekEnd = dueDate.toISOString().split('T')[0];
      const weekStartDate = new Date(dueDate);
      weekStartDate.setDate(weekStartDate.getDate() - 6);
      const weekStart = weekStartDate.toISOString().split('T')[0];

      // 3. Check if a DTR record already exists for this week
      const { data: existingDTR } = await supabase
        .from('weekly_dtr_submissions')
        .select('id')
        .eq('internship_id', internship.id)
        .eq('requirement_id', requirement.id)
        .maybeSingle();

      let dtrId: string;

      if (existingDTR) {
        // Update existing record
        const { data: updatedDTR, error: updateErr } = await supabase
          .from('weekly_dtr_submissions')
          .update({
            file_url: submission.file_url,
            file_name: submission.file_name,
            file_size: submission.file_size || null,
            mime_type: submission.mime_type || null,
            status: 'approved',
            reviewed_by: advisorId,
            reviewed_at: new Date().toISOString(),
            manual_hours_override: manualHoursOverride ?? null,
            extracted_hours: manualHoursOverride ?? 0,
            ai_scan_status: manualHoursOverride ? 'manual' : 'pending',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDTR.id)
          .select('id')
          .single();

        if (updateErr) {
          console.error('❌ [DTR] Failed to update DTR record:', updateErr.message);
          return;
        }
        dtrId = updatedDTR!.id;
      } else {
        // Create new DTR record
        const { data: newDTR, error: insertErr } = await supabase
          .from('weekly_dtr_submissions')
          .insert({
            internship_id: internship.id,
            student_id: studentId,
            requirement_id: requirement.id,
            week_number: weekNumber,
            week_start_date: weekStart,
            week_end_date: weekEnd,
            file_url: submission.file_url,
            file_name: submission.file_name,
            file_size: submission.file_size || null,
            mime_type: submission.mime_type || null,
            status: 'approved',
            reviewed_by: advisorId,
            reviewed_at: new Date().toISOString(),
            manual_hours_override: manualHoursOverride ?? null,
            extracted_hours: manualHoursOverride ?? 0,
            ai_scan_status: manualHoursOverride ? 'manual' : 'pending',
            version: 1,
            submitted_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertErr) {
          console.error('❌ [DTR] Failed to create DTR record:', insertErr.message);
          return;
        }
        dtrId = newDTR!.id;
      }

      console.log(`✅ [DTR] Created/updated DTR record ${dtrId} for week ${weekNumber}`);

      // 4. If manual hours provided, recalculate immediately
      if (manualHoursOverride !== undefined && manualHoursOverride !== null) {
        await dtrSubmissionService.recalculateDTRHours(internship.id);
        console.log(`✅ [DTR] Manual hours ${manualHoursOverride} applied, total recalculated`);
      } else {
        // 5. Trigger AI scan (fire-and-forget)
        (dtrSubmissionService as any).triggerAIScan(dtrId, submission.file_url, internship.id).catch((err: any) => {
          console.error('❌ [DTR] AI scan failed (non-blocking):', err.message);
        });
      }
    } catch (error: any) {
      console.error('❌ [DTR] Error processing DTR approval:', error.message);
      // Non-blocking: don't fail the review if DTR processing fails
    }
  }

  /**
   * Get submission history for a student + requirement (all versions)
   */
  async getSubmissionHistory(
    requirementId: string,
    studentId: string
  ): Promise<DocumentSubmission[]> {
    const { data: submissions, error } = await supabase
      .from('document_submissions')
      .select('*')
      .eq('requirement_id', requirementId)
      .eq('student_id', studentId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching submission history:', error);
      throw new Error('Failed to fetch submission history');
    }

    return submissions || [];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Notify advisor about a new/resubmitted document
   */
  private async notifyAdvisorAboutSubmission(
    advisorId: string,
    submission: DocumentSubmission,
    requirementTitle: string,
    isResubmission: boolean = false
  ): Promise<void> {
    try {
      // Get student name
      const { data: student } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', submission.student_id)
        .single();

      const studentName = student
        ? `${student.first_name} ${student.last_name}`
        : 'A student';

      const title = isResubmission
        ? 'Document Resubmitted'
        : 'New Document Submission';

      const message = isResubmission
        ? `${studentName} has resubmitted "${requirementTitle}" (Version ${submission.version})`
        : `${studentName} has submitted "${requirementTitle}"`;

      await notificationService.createNotification({
        user_id: advisorId,
        type: 'document_submitted',
        title,
        message,
        action_url: `/dashboard/advisor/requirements/${submission.requirement_id}`,
        reference_type: 'document_submission',
      });
    } catch (error) {
      console.error('Error notifying advisor about submission:', error);
      // Don't throw - notification failure shouldn't break the flow
    }
  }

  /**
   * Notify student about review result
   */
  private async notifyStudentAboutReview(
    studentId: string,
    submission: DocumentSubmission,
    requirementTitle: string
  ): Promise<void> {
    try {
      let title: string;
      let message: string;

      switch (submission.status) {
        case 'approved':
          title = 'Document Approved';
          message = `Your submission for "${requirementTitle}" has been approved`;
          break;
        case 'rejected':
          title = 'Document Rejected';
          message = `Your submission for "${requirementTitle}" has been rejected`;
          break;
        case 'revision_requested':
          title = 'Revision Requested';
          message = `Please revise and resubmit "${requirementTitle}"`;
          break;
        default:
          return;
      }

      if (submission.feedback) {
        message += `. Feedback: ${submission.feedback}`;
      }

      await notificationService.createNotification({
        user_id: studentId,
        type: 'document_reviewed',
        title,
        message,
        action_url: `/dashboard/student/requirements/${submission.requirement_id}`,
        reference_type: 'document_submission',
      });
    } catch (error) {
      console.error('Error notifying student about review:', error);
      // Don't throw - notification failure shouldn't break the flow
    }
  }

  /**
   * Helper method to check if a student is targeted by a requirement
   */
  private isStudentTargeted(
    studentId: string,
    targetAudience: string,
    metadata: any
  ): boolean {
    // If targeting all students, always return true
    if (targetAudience === 'all_students') {
      return true;
    }

    // If targeting specific students, check the student_ids array
    if (targetAudience === 'specific_student') {
      const studentIds = metadata?.student_ids || [];
      return studentIds.includes(studentId);
    }

    // If targeting specific internship, we'd need to query internships table
    // For now, assume true (this check is done in getStudentRequirements)
    if (targetAudience === 'specific_internship') {
      return true;
    }

    return false;
  }

  /**
   * Generate a signed URL for a submission file using service key (bypasses RLS)
   * Tries multiple path variations to handle legacy data
   */
  async getSignedUrlForSubmission(
    submissionId: string,
    userId: string,
    role: 'student' | 'advisor'
  ): Promise<{ signedUrl: string; expiresIn: number }> {
    // Get the submission first
    const { data: submission, error: fetchError } = await supabase
      .from('document_submissions')
      .select(`
        id, file_url, student_id, requirement_id,
        requirement:document_requirements!inner(id, created_by)
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error('Submission not found');
    }

    // Authorization check
    if (role === 'student' && submission.student_id !== userId) {
      throw new Error('Access denied: you can only access your own submissions');
    }

    if (role === 'advisor') {
      const requirement = submission.requirement as any;
      if (requirement?.created_by !== userId) {
        throw new Error('Access denied: you can only access submissions for your requirements');
      }
    }

    const fileUrl = submission.file_url;
    console.log(`📁 Generating signed URL for submission ${submissionId}, file: ${fileUrl}`);

    // Generate possible paths to try
    const pathsToTry: string[] = [];
    
    // Extract path from URL if it's a full URL
    let basePath = fileUrl;
    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/(?:object\/(?:public|sign)\/)?documents\/(.+)$/);
        if (pathMatch) {
          basePath = pathMatch[1];
        }
      } catch {
        // Keep basePath as fileUrl
      }
    }
    
    // Decode URL-encoded characters
    try {
      basePath = decodeURIComponent(basePath);
    } catch {
      // Keep as-is if decoding fails
    }
    
    // 1. Original path
    pathsToTry.push(basePath);
    
    // 2. Without document-submissions prefix
    if (basePath.startsWith('document-submissions/')) {
      const withoutPrefix = basePath.replace('document-submissions/', '');
      pathsToTry.push(withoutPrefix);
      
      // 3. Swap first two path components (student_id/requirement_id -> requirement_id/student_id)
      const parts = withoutPrefix.split('/');
      if (parts.length >= 3) {
        const swapped = [parts[1], parts[0], ...parts.slice(2)].join('/');
        pathsToTry.push(swapped);
      }
    }
    
    // 4. Try using submission metadata (student_id/requirement_id/filename)
    if (submission.student_id && submission.requirement_id && fileUrl.includes('/')) {
      const fileName = fileUrl.split('/').pop() || '';
      if (fileName) {
        // New format: student_id/requirement_id/filename
        pathsToTry.push(`${submission.student_id}/${submission.requirement_id}/${fileName}`);
        // Old format variation: requirement_id/student_id/filename
        pathsToTry.push(`${submission.requirement_id}/${submission.student_id}/${fileName}`);
      }
    }
    
    // Remove duplicates
    const uniquePaths = [...new Set(pathsToTry)];
    
    // Try each path
    for (const pathToTry of uniquePaths) {
      console.log(`🔄 Trying path: ${pathToTry}`);
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(pathToTry, 3600); // 1 hour validity
        
        if (!error && data) {
          console.log(`✅ Successfully generated signed URL with path: ${pathToTry}`);
          return { signedUrl: data.signedUrl, expiresIn: 3600 };
        }
        
        if (error && !error.message.includes('not found')) {
          console.error(`❌ Non-recoverable error for path ${pathToTry}:`, error.message);
        }
      } catch (e) {
        console.error(`❌ Exception for path ${pathToTry}:`, e);
      }
    }
    
    console.error(`❌ All path variations failed for submission ${submissionId}`);
    throw new Error('Could not generate signed URL: file not found in storage');
  }
}

// Export singleton instance
export const documentSubmissionsService = new DocumentSubmissionsService();
