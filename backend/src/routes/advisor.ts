import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import studentsRoutes from './advisor/students';
import evaluationsRoutes from './advisor/evaluations';
import documentRequirementsRoutes from './advisor/documentRequirements';

const router = Router();

// All routes require authentication and advisor role
router.use(authenticateToken);
router.use(requireRole(['advisor']));

// Advisor sub-routes
router.use('/', studentsRoutes);
router.use('/', evaluationsRoutes);
router.use('/', documentRequirementsRoutes);

export default router;
