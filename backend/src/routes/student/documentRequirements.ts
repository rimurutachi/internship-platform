import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { documentRequirementsService } from '../../services/documentRequirementsService';
import { documentSubmissionsService } from '../../services/documentSubmissionsService';

const router = Router();

// ============================================================================
// Document Requirements Routes (Student View)
// ============================================================================

/**
 * GET /student/document-requirements
 * Get all document requirements assigned to the student
 */
router.get('/document-requirements', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { status, page, limit } = req.query;

    const statusValue = status as 'pending' | 'completed' | 'all' | undefined;

    const result = await documentRequirementsService.getStudentRequirements(studentId, {
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
 * GET /student/document-requirements/:id
 * Get a single document requirement by ID
 */
router.get('/document-requirements/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    const requirement = await documentRequirementsService.getRequirementById(
      id,
      studentId,
      'student'
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
 * GET /student/document-requirements/:id/history
 * Get submission history for a specific requirement
 */
router.get('/document-requirements/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    const history = await documentSubmissionsService.getSubmissionHistory(id, studentId);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching submission history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch submission history',
    });
  }
});

// ============================================================================
// Document Submissions Routes (Student)
// ============================================================================

/**
 * GET /student/document-submissions
 * Get all submissions made by the student
 */
router.get('/document-submissions', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { requirement_id, status, page, limit } = req.query;

    const result = await documentSubmissionsService.getStudentSubmissions(studentId, {
      requirement_id: requirement_id as string,
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
    console.error('Error fetching document submissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch document submissions',
    });
  }
});

/**
 * GET /student/document-submissions/:id
 * Get a single submission by ID
 */
router.get('/document-submissions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    const submission = await documentSubmissionsService.getSubmissionById(
      id,
      studentId,
      'student'
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
 * POST /student/document-requirements/:id/submit
 * Submit a document for a requirement
 */
router.post('/document-requirements/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;
    const { file_url, file_name, file_size, mime_type } = req.body;

    // Validation
    if (!file_url || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'file_url and file_name are required',
      });
    }

    if (!file_size || file_size <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid file_size is required',
      });
    }

    const submission = await documentSubmissionsService.submitDocument(studentId, {
      requirement_id: id,
      file_url,
      file_name,
      file_size: parseInt(file_size),
      mime_type: mime_type || 'application/octet-stream',
    });

    console.log(`📄 Student ${studentId} submitted document for requirement ${id}`);

    return res.status(201).json({
      success: true,
      data: submission,
      message: 'Document submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting document:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit document';
    const status = message.includes('not found') || message.includes('assigned') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /student/document-submissions/:id/resubmit
 * Resubmit a document after revision request
 */
router.post('/document-submissions/:id/resubmit', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;
    const { file_url, file_name, file_size, mime_type } = req.body;

    // Validation
    if (!file_url || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'file_url and file_name are required',
      });
    }

    if (!file_size || file_size <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid file_size is required',
      });
    }

    const submission = await documentSubmissionsService.resubmitDocument(id, studentId, {
      file_url,
      file_name,
      file_size: parseInt(file_size),
      mime_type: mime_type || 'application/octet-stream',
    });

    console.log(`📄 Student ${studentId} resubmitted document: ${submission.id}`);

    return res.status(201).json({
      success: true,
      data: submission,
      message: 'Document resubmitted successfully',
    });
  } catch (error) {
    console.error('Error resubmitting document:', error);
    const message = error instanceof Error ? error.message : 'Failed to resubmit document';
    const status = message.includes('not found') || message.includes('only allowed') ? 400 : 500;
    return res.status(status).json({
      success: false,
      error: message,
    });
  }
});

export default router;
