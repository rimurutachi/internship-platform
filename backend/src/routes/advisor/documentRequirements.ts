import { Router, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthRequest } from '../../middleware/auth';
import { documentRequirementsService } from '../../services/documentRequirementsService';
import { documentSubmissionsService } from '../../services/documentSubmissionsService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const router = Router();

// ============================================================================
// Document Requirements CRUD Routes (Advisor)
// ============================================================================

/**
 * POST /advisor/document-requirements
 * Create a new document requirement
 */
router.post('/document-requirements', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const { title, description, due_date, is_mandatory, target_audience, metadata } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Title is required and must be at least 3 characters',
      });
    }

    const requirement = await documentRequirementsService.createRequirement(advisorId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      due_date: due_date || undefined,
      is_mandatory: is_mandatory ?? true,
      target_audience: target_audience || 'all_students',
      metadata: metadata || undefined,
    });

    console.log(`📋 Advisor ${advisorId} created requirement: ${requirement.id}`);

    return res.status(201).json({
      success: true,
      data: requirement,
      message: 'Document requirement created successfully',
    });
  } catch (error) {
    console.error('Error creating document requirement:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create document requirement',
    });
  }
});

/**
 * GET /advisor/document-requirements
 * Get all requirements created by the advisor
 */
router.get('/document-requirements', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const { status, page, limit } = req.query;

    const statusValue = status as 'active' | 'archived' | undefined;

    const result = await documentRequirementsService.getAdvisorRequirements(advisorId, {
      status: statusValue,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return res.json({
      success: true,
      data: result.requirements,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 20)),
      },
    });
  } catch (error) {
    console.error('Error fetching document requirements:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch document requirements',
    });
  }
});

/**
 * GET /advisor/document-requirements/:id
 * Get a single requirement by ID
 */
router.get('/document-requirements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    const requirement = await documentRequirementsService.getRequirementById(
      id,
      advisorId,
      'advisor'
    );

    return res.json({
      success: true,
      data: requirement,
    });
  } catch (error) {
    console.error('Error fetching document requirement:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch requirement';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PATCH /advisor/document-requirements/:id
 * Update a document requirement
 */
router.patch('/document-requirements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;
    const { title, description, due_date, is_mandatory, target_audience, metadata, status } = req.body;

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (is_mandatory !== undefined) updateData.is_mandatory = is_mandatory;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    const requirement = await documentRequirementsService.updateRequirement(
      id,
      advisorId,
      updateData
    );

    console.log(`📋 Advisor ${advisorId} updated requirement: ${id}`);

    return res.json({
      success: true,
      data: requirement,
      message: 'Document requirement updated successfully',
    });
  } catch (error) {
    console.error('Error updating document requirement:', error);
    const message = error instanceof Error ? error.message : 'Failed to update requirement';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * DELETE /advisor/document-requirements/:id
 * Archive (soft delete) a document requirement
 */
router.delete('/document-requirements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    await documentRequirementsService.deleteRequirement(id, advisorId);

    console.log(`📋 Advisor ${advisorId} archived requirement: ${id}`);

    return res.json({
      success: true,
      message: 'Document requirement archived successfully',
    });
  } catch (error) {
    console.error('Error archiving document requirement:', error);
    const message = error instanceof Error ? error.message : 'Failed to archive requirement';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// ============================================================================
// Submission Management Routes (Advisor)
// ============================================================================

/**
 * GET /advisor/document-requirements/:id/submissions
 * Get all submissions for a requirement
 */
router.get('/document-requirements/:id/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;
    const { status, page, limit } = req.query;

    const result = await documentSubmissionsService.getRequirementSubmissions(id, advisorId, {
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    return res.json({
      success: true,
      data: result.submissions,
      pagination: {
        total: result.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 20)),
      },
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch submissions';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /advisor/submissions/:id
 * Get a single submission by ID
 */
router.get('/submissions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    const submission = await documentSubmissionsService.getSubmissionById(
      id,
      advisorId,
      'advisor'
    );

    return res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch submission';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PATCH /advisor/submissions/:id/review
 * Review a submission (approve/reject/request revision)
 */
router.patch('/submissions/:id/review', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;
    const { status, feedback, manual_hours_override } = req.body;

    // Validation
    const validStatuses = ['approved', 'rejected', 'revision_requested'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const submission = await documentSubmissionsService.reviewSubmission(id, advisorId, {
      status,
      feedback: feedback?.trim() || undefined,
      manual_hours_override: manual_hours_override !== undefined && manual_hours_override !== null
        ? parseFloat(manual_hours_override)
        : undefined,
    });

    console.log(`📝 Advisor ${advisorId} reviewed submission ${id}: ${status}`);

    return res.json({
      success: true,
      data: submission,
      message: `Submission ${status.replace('_', ' ')} successfully`,
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    const message = error instanceof Error ? error.message : 'Failed to review submission';
    const status = message.includes('not found') || message.includes('denied') ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /advisor/submissions/:id/signed-url
 * Generate a signed URL for a submission file (uses service key to bypass RLS)
 */
router.get('/submissions/:id/signed-url', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    const result = await documentSubmissionsService.getSignedUrlForSubmission(
      id,
      advisorId,
      'advisor'
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate signed URL';
    const status = message.includes('not found') ? 404 : 
                   message.includes('denied') ? 403 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

// ============================================================================
// Document Tracker for Student Details
// ============================================================================

/**
 * GET /advisor/students/:studentId/document-tracker
 * Get all non-DTR document requirements created by this advisor,
 * paired with the student's latest submission for each requirement.
 * Used in the Student Details modal on the My Students page.
 */
router.get('/students/:studentId/document-tracker', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const studentId = req.params.studentId as string;

    // 1. Verify advisor has access to this student (via internship)
    const { data: internship, error: intError } = await supabase
      .from('internships')
      .select('id')
      .eq('student_id', studentId)
      .eq('advisor_id', advisorId)
      .neq('is_archived', true)
      .maybeSingle();

    if (intError || !internship) {
      return res.json({
        success: true,
        data: [],
        message: 'No internship found for this student',
      });
    }

    // 2. Fetch all active requirements created by this advisor
    const { data: requirements, error: reqError } = await supabase
      .from('document_requirements')
      .select('id, title, description, is_mandatory, due_date, status, created_at')
      .eq('created_by', advisorId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (reqError) {
      throw new Error('Failed to fetch document requirements');
    }

    // 3. Filter out DTR requirements (they have their own section in student details)
    const isDTR = (title: string) => {
      const lower = title.toLowerCase();
      return lower.includes('daily time record') || lower.includes('dtr');
    };

    const nonDtrRequirements = (requirements || []).filter(
      (r: any) => !isDTR(r.title)
    );

    if (nonDtrRequirements.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // 4. Fetch latest submissions for this student across all non-DTR requirements
    const requirementIds = nonDtrRequirements.map((r: any) => r.id);

    const { data: submissions, error: subError } = await supabase
      .from('document_submissions')
      .select('id, requirement_id, status, file_name, submitted_at, reviewed_at, feedback, version')
      .eq('student_id', studentId)
      .in('requirement_id', requirementIds)
      .order('version', { ascending: false });

    if (subError) {
      throw new Error('Failed to fetch document submissions');
    }

    // 5. Group submissions by requirement_id and pick the latest (highest version)
    const latestSubmissionMap: Record<string, any> = {};
    for (const sub of submissions || []) {
      if (!latestSubmissionMap[sub.requirement_id]) {
        latestSubmissionMap[sub.requirement_id] = sub;
      }
    }

    // 6. Build the response: each requirement + its latest submission (or null)
    const trackerData = nonDtrRequirements.map((req: any) => ({
      requirement_id: req.id,
      title: req.title,
      description: req.description,
      is_mandatory: req.is_mandatory,
      due_date: req.due_date,
      submission: latestSubmissionMap[req.id]
        ? {
            id: latestSubmissionMap[req.id].id,
            status: latestSubmissionMap[req.id].status,
            file_name: latestSubmissionMap[req.id].file_name,
            submitted_at: latestSubmissionMap[req.id].submitted_at,
            reviewed_at: latestSubmissionMap[req.id].reviewed_at,
            feedback: latestSubmissionMap[req.id].feedback,
            version: latestSubmissionMap[req.id].version,
          }
        : null,
    }));

    return res.json({
      success: true,
      data: trackerData,
    });
  } catch (error) {
    console.error('Error fetching document tracker:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch document tracker',
    });
  }
});

// ============================================================================
// DTR History for Student Details
// ============================================================================

/**
 * GET /advisor/students/:studentId/dtr-history
 * Get weekly DTR submission history for a student (for MyStudents detail modal)
 */
router.get('/students/:studentId/dtr-history', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const studentId = req.params.studentId as string;

    // Verify advisor has access to this student (via internship)
    const { data: internship, error: intError } = await supabase
      .from('internships')
      .select('id')
      .eq('student_id', studentId)
      .eq('advisor_id', advisorId)
      .eq('status', 'active')
      .maybeSingle();

    if (intError || !internship) {
      return res.json({
        success: true,
        data: [],
        message: 'No active internship found for this student',
      });
    }

    // Get all weekly DTR submissions for this internship
    const { data: dtrSubmissions, error: dtrError } = await supabase
      .from('weekly_dtr_submissions')
      .select('*')
      .eq('internship_id', internship.id)
      .order('week_number', { ascending: true });

    if (dtrError) {
      throw new Error('Failed to fetch DTR history');
    }

    return res.json({
      success: true,
      data: dtrSubmissions || [],
    });
  } catch (error) {
    console.error('Error fetching DTR history:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DTR history',
    });
  }
});

export default router;
