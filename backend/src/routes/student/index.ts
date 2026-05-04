import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import studentController from '../../controllers/student/studentController';
import dailyReportsRoutes from './dailyReports';
import documentRequirementsRoutes from './documentRequirements';
import tasksRoutes from './tasks';
import dtrRoutes from './dtr';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['student']));

// Profile routes
router.get('/profile', studentController.getProfile);
router.patch('/profile', studentController.updateProfile);
router.get('/profile/settings', studentController.getSettings);
router.patch('/profile/settings', studentController.updateSettings);

// Internship routes
router.get('/internship', studentController.getCurrentInternship);
router.get('/internship/timeline', studentController.getInternshipTimeline);
router.get('/internship/progress', studentController.getProgress);

// Evaluation routes
router.get('/evaluations', studentController.getEvaluations);
router.get('/evaluations/:id', studentController.getEvaluation);
router.get('/skills-assessment', studentController.getSkillsAssessment);

// Document routes (existing document management)
router.get('/documents/required', studentController.getRequiredDocuments); // Must be before /:id route
router.get('/documents', studentController.getDocuments);
router.post('/documents', studentController.uploadDocument);
router.get('/documents/:id', studentController.getDocument);
router.patch('/documents/:id', studentController.updateDocument);
router.delete('/documents/:id', studentController.deleteDocument);

// Document requirements routes (advisor-assigned requirements)
router.use('/', documentRequirementsRoutes);

// Message routes
router.get('/messages/conversations', studentController.getConversations);
router.post('/messages/conversations', studentController.createConversation);
router.get('/messages/conversations/:id', studentController.getConversationMessages);
router.post('/messages/conversations/:id/messages', studentController.sendMessage);
router.post('/messages/conversations/:id/mark-read', studentController.markConversationRead);

// Reminder and notification routes
router.get('/reminders', studentController.getReminders);
router.get('/notifications', studentController.getNotifications);
router.patch('/notifications/:id/read', studentController.markNotificationRead);
router.patch('/notifications/read-all', studentController.markAllNotificationsRead);

// Mentor routes
router.get('/mentors', studentController.getMentors);
router.post('/mentors/:id/message', studentController.messageMentor);

// Task routes (new dedicated task management)
router.use('/', tasksRoutes);

// Daily reports routes
router.use('/', dailyReportsRoutes);

// Weekly DTR submission routes
router.use('/', dtrRoutes);

// Dashboard route
router.get('/dashboard', studentController.getDashboardOverview);

export default router;
