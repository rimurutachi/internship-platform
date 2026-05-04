import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { dtrSubmissionService } from '../../services/dtrSubmissionService';

const router = Router();

// ============================================================================
// Student DTR Submission Routes
// ============================================================================

/**
 * POST /student/dtr
 * Submit a weekly DTR
 */
router.post('/dtr', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const {
      internship_id,
      requirement_id,
      week_number,
      week_start_date,
      week_end_date,
      file_url,
      file_name,
      file_size,
      mime_type,
    } = req.body;

    // Validation
    if (!internship_id || !week_number || !week_start_date || !week_end_date || !file_url || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: internship_id, week_number, week_start_date, week_end_date, file_url, file_name',
      });
    }

    if (week_number < 1) {
      return res.status(400).json({
        success: false,
        error: 'Week number must be at least 1',
      });
    }

    const dtr = await dtrSubmissionService.submitDTR(studentId, {
      internship_id,
      requirement_id,
      week_number: parseInt(week_number),
      week_start_date,
      week_end_date,
      file_url,
      file_name,
      file_size: file_size ? parseInt(file_size) : undefined,
      mime_type,
    });

    console.log(`📋 Student ${studentId} submitted DTR for week ${week_number}`);

    return res.status(201).json({
      success: true,
      data: dtr,
      message: 'Weekly DTR submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting DTR:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit DTR';
    const statusCode = message.includes('not found') ? 404 : 
                       message.includes('already') ? 409 : 500;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /student/dtr
 * Get student's DTR submissions
 */
router.get('/dtr', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { internship_id, status, page, limit } = req.query;

    const result = await dtrSubmissionService.getStudentDTRs(studentId, {
      internship_id: internship_id as string,
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
    console.error('Error fetching student DTRs:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DTR submissions',
    });
  }
});

/**
 * GET /student/dtr/:id
 * Get a single DTR submission
 */
router.get('/dtr/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    const dtr = await dtrSubmissionService.getDTRById(id, studentId, 'student');

    return res.json({
      success: true,
      data: dtr,
    });
  } catch (error) {
    console.error('Error fetching DTR submission:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch DTR submission';
    const statusCode = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * PATCH /student/dtr/:id/resubmit
 * Resubmit a DTR after revision request (edit in place)
 */
router.patch('/dtr/:id/resubmit', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;
    const { file_url, file_name, file_size, mime_type } = req.body;

    if (!file_url || !file_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: file_url, file_name',
      });
    }

    const dtr = await dtrSubmissionService.resubmitDTR(id, studentId, {
      file_url,
      file_name,
      file_size: file_size ? parseInt(file_size) : undefined,
      mime_type,
    });

    console.log(`📋 Student ${studentId} resubmitted DTR ${id}`);

    return res.json({
      success: true,
      data: dtr,
      message: 'DTR resubmitted successfully',
    });
  } catch (error) {
    console.error('Error resubmitting DTR:', error);
    const message = error instanceof Error ? error.message : 'Failed to resubmit DTR';
    const statusCode = message.includes('not found') ? 404 : 
                       message.includes('denied') ? 403 : 
                       message.includes('only resubmit') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /student/dtr/:id/signed-url
 * Generate a signed URL for a DTR file
 */
router.get('/dtr/:id/signed-url', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const id = req.params.id as string;

    const result = await dtrSubmissionService.getSignedUrlForDTR(id, studentId, 'student');

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating DTR signed URL:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate signed URL';
    const statusCode = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

export default router;
