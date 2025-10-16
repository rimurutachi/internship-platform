import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as internshipController from '../controllers/internshipController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create internship (advisor or admin only)
router.post('/',
    requireRole(['advisor', 'admin']),
    internshipController.createInternship
);

// Get all internships (with filters)
router.get('/', internshipController.getAllInternships);

// Get my internships (student or advisor)
router.get('/my-internships', internshipController.getMyInternships);

// Get specific internship
router.get('/:id', internshipController.getInternship);

// Update internship
router.put('/:id',
    requireRole(['advisor', 'admin']),
    internshipController.updateInternship
);

// Delete internships
router.delete('/:id',
    requireRole(['admin']),
    internshipController.deleteInternship
);

export default router;