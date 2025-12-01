"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const studentController_1 = __importDefault(require("../../controllers/student/studentController"));
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['student']));
// Profile routes
router.get('/profile', studentController_1.default.getProfile);
router.patch('/profile', studentController_1.default.updateProfile);
router.get('/profile/settings', studentController_1.default.getSettings);
router.patch('/profile/settings', studentController_1.default.updateSettings);
// Internship routes
router.get('/internship', studentController_1.default.getCurrentInternship);
router.get('/internship/timeline', studentController_1.default.getInternshipTimeline);
router.get('/internship/progress', studentController_1.default.getProgress);
// Evaluation routes
router.get('/evaluations', studentController_1.default.getEvaluations);
router.get('/evaluations/:id', studentController_1.default.getEvaluation);
router.get('/skills-assessment', studentController_1.default.getSkillsAssessment);
// Document routes
router.get('/documents/required', studentController_1.default.getRequiredDocuments); // Must be before /:id route
router.get('/documents', studentController_1.default.getDocuments);
router.post('/documents', studentController_1.default.uploadDocument);
router.get('/documents/:id', studentController_1.default.getDocument);
router.patch('/documents/:id', studentController_1.default.updateDocument);
router.delete('/documents/:id', studentController_1.default.deleteDocument);
// Message routes
router.get('/messages/conversations', studentController_1.default.getConversations);
router.post('/messages/conversations', studentController_1.default.createConversation);
router.get('/messages/conversations/:id', studentController_1.default.getConversationMessages);
router.post('/messages/conversations/:id/messages', studentController_1.default.sendMessage);
router.post('/messages/conversations/:id/mark-read', studentController_1.default.markConversationRead);
// Reminder and notification routes
router.get('/reminders', studentController_1.default.getReminders);
router.get('/notifications', studentController_1.default.getNotifications);
router.patch('/notifications/:id/read', studentController_1.default.markNotificationRead);
router.patch('/notifications/read-all', studentController_1.default.markAllNotificationsRead);
// Mentor routes
router.get('/mentors', studentController_1.default.getMentors);
router.post('/mentors/:id/message', studentController_1.default.messageMentor);
// Task routes
router.get('/tasks', studentController_1.default.getTasks);
router.patch('/tasks/:id', studentController_1.default.updateTask);
// Dashboard route
router.get('/dashboard', studentController_1.default.getDashboardOverview);
exports.default = router;
//# sourceMappingURL=index.js.map