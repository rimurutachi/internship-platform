import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as rubricService from '../../services/rubricService';
import { ensureString } from '../../utils/typeGuards';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Helper to ensure a valid university_id is always resolved
 */
async function resolveUniversityId(req: any): Promise<string> {
  const queryUniv = req.query.university_id;
  if (queryUniv && queryUniv !== 'null' && queryUniv !== 'undefined') {
    return queryUniv as string;
  }
  const userUniv = req.user?.university_id;
  if (userUniv) return userUniv;

  try {
    const { data: firstUniv } = await supabase
      .from('universities')
      .select('id')
      .limit(1)
      .single();
    return firstUniv?.id || '';
  } catch {
    return '';
  }
}

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/rubrics
 * Get all rubrics for university
 */
router.get('/', async (req, res) => {
  try {
    const universityId = await resolveUniversityId(req);
    const { include_inactive } = req.query;

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await rubricService.getAllRubrics(
      universityId,
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
    const universityId = await resolveUniversityId(req);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'university_id is required and could not be determined',
      });
    }

    const result = await rubricService.getActiveRubric(universityId);

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
