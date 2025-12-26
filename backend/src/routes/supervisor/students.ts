/**
 * Supervisor Students Routes
 * 
 * Routes for supervisors to manage their assigned student interns
 */

import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  getMyStudents,
  getStudentDetails,
} from '../../controllers/supervisor/studentController';

const router = Router();

// All routes require authentication and supervisor role
router.use(authenticateToken);
router.use(requireRole(['supervisor']));

/**
 * GET /api/supervisor/students
 * Get all students assigned to the logged-in supervisor
 */
router.get('/students', getMyStudents);

/**
 * GET /api/supervisor/students/:studentId
 * Get detailed information about a specific student
 */
router.get('/students/:studentId', getStudentDetails);

export default router;
