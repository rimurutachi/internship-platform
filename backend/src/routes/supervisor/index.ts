/**
 * Supervisor Routes
 * 
 * Main router combining all supervisor-related routes
 * NOTE: Per revision, supervisor access is restricted to evaluations only.
 * Daily reports are student-exclusive (no supervisor review).
 */

import { Router } from 'express';
import studentRoutes from './students';
import evaluationRoutes from './evaluations';
import rubricRoutes from './rubrics';

const router = Router();

// Student management routes (needed for evaluation student selection)
router.use('/', studentRoutes);

// Evaluation routes (main supervisor function)
router.use('/', evaluationRoutes);

// Rubric routes (part of evaluation system)
router.use('/', rubricRoutes);

// Daily reports are student-exclusive, compiled by AI after internship completion

export default router;
