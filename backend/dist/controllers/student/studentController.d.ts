import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
declare class StudentController {
    /**
     * GET /api/student/profile
     * Get student profile
     */
    getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/profile
     * Update student profile
     */
    updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/profile/settings
     * Get student settings
     */
    getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/profile/settings
     * Update student settings
     */
    updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/internship
     * Get current internship
     */
    getCurrentInternship(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/internship/timeline
     * Get internship timeline/milestones
     */
    getInternshipTimeline(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/internship/progress
     * Get progress metrics
     */
    getProgress(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/evaluations
     * Get all evaluations
     */
    getEvaluations(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/evaluations/:id
     * Get single evaluation
     */
    getEvaluation(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/skills-assessment
     * Get aggregated skills assessment
     */
    getSkillsAssessment(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/documents
     * Get all documents
     */
    getDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/student/documents
     * Upload new document
     */
    uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/documents/:id
     * Get single document
     */
    getDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/documents/:id
     * Update document
     */
    updateDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/student/documents/:id
     * Soft delete document (archive)
     */
    deleteDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/documents/required
     * Get required documents status
     */
    getRequiredDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/messages/conversations
     * Get all conversations
     */
    getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/messages/conversations/:id
     * Get messages in conversation
     */
    getConversationMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/student/messages/conversations/:id/messages
     * Send message
     */
    sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/student/messages/conversations
     * Create new conversation
     */
    createConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/student/messages/conversations/:id/mark-read
     * Mark conversation as read
     */
    markConversationRead(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/reminders
     * Get upcoming reminders
     */
    getReminders(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/notifications
     * Get notifications
     */
    getNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/notifications/:id/read
     * Mark notification as read
     */
    markNotificationRead(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/notifications/read-all
     * Mark all notifications as read
     */
    markAllNotificationsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/mentors
     * Get advisor and supervisor info
     */
    getMentors(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/student/mentors/:id/message
     * Quick message to mentor
     */
    messageMentor(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/tasks
     * Get tasks (using documents as tasks)
     */
    getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * PATCH /api/student/tasks/:id
     * Update task (document status)
     */
    updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/student/dashboard
     * Get complete dashboard data
     */
    getDashboardOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: StudentController;
export default _default;
//# sourceMappingURL=studentController.d.ts.map