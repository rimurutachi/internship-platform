import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { dtrSubmissionService } from '../../services/dtrSubmissionService';

const router = Router();

// ============================================================================
// Advisor DTR Submission Management Routes
// ============================================================================

/**
 * GET /advisor/dtr-submissions
 * Get all DTR submissions for advisor's students
 */
router.get('/dtr-submissions', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const { status, page, limit } = req.query;

    const result = await dtrSubmissionService.getAdvisorDTRSubmissions(advisorId, {
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
    console.error('Error fetching DTR submissions:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DTR submissions',
    });
  }
});

/**
 * GET /advisor/dtr-submissions/:id
 * Get a single DTR submission by ID
 */
router.get('/dtr-submissions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    const dtr = await dtrSubmissionService.getDTRById(id, advisorId, 'advisor');

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
 * PATCH /advisor/dtr-submissions/:id/review
 * Review a DTR submission (approve or request revision)
 */
router.patch('/dtr-submissions/:id/review', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;
    const { status, feedback, manual_hours_override } = req.body;

    // Validation
    const validStatuses = ['approved', 'revision_requested'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const dtr = await dtrSubmissionService.reviewDTR(id, advisorId, {
      status,
      feedback: feedback?.trim() || undefined,
      manual_hours_override: manual_hours_override !== undefined ? Number(manual_hours_override) : undefined,
    });

    console.log(`📝 Advisor ${advisorId} reviewed DTR ${id}: ${status}`);

    return res.json({
      success: true,
      data: dtr,
      message: `DTR ${status === 'approved' ? 'approved' : 'revision requested'} successfully`,
    });
  } catch (error) {
    console.error('Error reviewing DTR submission:', error);
    const message = error instanceof Error ? error.message : 'Failed to review DTR submission';
    const statusCode = message.includes('not found') ? 404 : message.includes('denied') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /advisor/dtr-submissions/:id/signed-url
 * Generate a signed URL for a DTR file
 */
router.get('/dtr-submissions/:id/signed-url', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user!.id;
    const id = req.params.id as string;

    const result = await dtrSubmissionService.getSignedUrlForDTR(id, advisorId, 'advisor');

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
