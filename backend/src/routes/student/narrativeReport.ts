import { Router } from 'express';
import { narrativeReportController } from '../../controllers/student/narrativeReportController';

const router = Router();

// Eligibility & student progress toward 80%
router.get('/narrative-report/eligibility', narrativeReportController.getEligibility);

// Ethical AI writing prompts & structural suggestions
router.get('/narrative-report/writing-guide', narrativeReportController.getWritingGuide);

// Generate standard CvSU .docx narrative report scaffold
router.post('/narrative-report/generate', narrativeReportController.generateReport);

export default router;
