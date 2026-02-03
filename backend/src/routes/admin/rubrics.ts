import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as rubricService from '../../services/rubricService';
import { ensureString } from '../../utils/typeGuards';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/rubrics
 * Get all rubrics for university
 */
router.get('/', async (req, res) => {
  try {
    const { university_id, include_inactive } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await rubricService.getAllRubrics(
      university_id as string,
      include_inactive === 'true'
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/rubrics/active
 * Get active rubric for university
 */
router.get('/active', async (req, res) => {
  try {
    const { university_id } = req.query;

    if (!university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required',
      });
    }

    const result = await rubricService.getActiveRubric(university_id as string);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/rubrics/:id
 * Get rubric by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await rubricService.getRubricById(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/rubrics/:id/history
 * Get rubric version history
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await rubricService.getRubricHistory(id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/rubrics
 * Create new rubric
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    const rubricData = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await rubricService.createRubric(rubricData, adminId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/rubrics/:id
 * Update rubric (creates new version)
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const { updates, change_reason } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!change_reason) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'change_reason is required',
      });
    }

    const result = await rubricService.updateRubric(id, updates, adminId, change_reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/rubrics/:id/activate
 * Activate a rubric
 */
router.post('/:id/activate', async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    const id = ensureString(req.params.id, 'id');

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await rubricService.activateRubric(id, adminId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/rubrics/:id/deactivate
 * Deactivate a rubric
 */
router.post('/:id/deactivate', async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    const id = ensureString(req.params.id, 'id');
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const result = await rubricService.deactivateRubric(id, adminId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
