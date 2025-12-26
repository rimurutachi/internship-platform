/**
 * Supervisor Routes
 * 
 * Main router combining all supervisor-related routes
 */

import { Router } from 'express';
import studentRoutes from './students';
import evaluationRoutes from './evaluations';
import weeklyReportRoutes from './weeklyReports';
import rubricRoutes from './rubrics';

const router = Router();

// Student management routes
router.use('/', studentRoutes);

// Evaluation routes
router.use('/', evaluationRoutes);

// Weekly report routes
router.use('/', weeklyReportRoutes);

// Rubric routes
router.use('/', rubricRoutes);

export default router;
