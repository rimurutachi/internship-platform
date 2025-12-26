/**
 * Supervisor Rubric Routes
 * 
 * Routes for supervisors to fetch evaluation rubrics
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  getActiveRubric,
  getRubricsByUniversity,
  getRubricById,
} from '../../controllers/supervisor/rubricController';

const router = Router();

// All routes require authentication and supervisor role
router.use(authenticateToken);
router.use(requireRole(['supervisor']));

/**
 * GET /api/supervisor/rubrics/active
 * Get the active rubric for the supervisor's university
 */
router.get('/rubrics/active', getActiveRubric);

/**
 * GET /api/supervisor/rubrics
 * Get all rubrics for the supervisor's university
 */
router.get('/rubrics', getRubricsByUniversity);

/**
 * GET /api/supervisor/rubrics/:rubricId
 * Get a specific rubric by ID
 */
router.get('/rubrics/:rubricId', getRubricById);

export default router;
