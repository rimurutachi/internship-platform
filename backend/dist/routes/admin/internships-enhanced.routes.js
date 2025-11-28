"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const internshipsEnhancedController_1 = __importDefault(require("../../controllers/admin/internshipsEnhancedController"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticateToken);
// Reminder management routes
router.get('/reminders/:internship_id', internshipsEnhancedController_1.default.getReminders);
router.post('/:internship_id/reminders', internshipsEnhancedController_1.default.createReminder);
router.patch('/reminders/:reminder_id', internshipsEnhancedController_1.default.updateReminder);
router.delete('/reminders/:reminder_id', internshipsEnhancedController_1.default.deleteReminder);
router.post('/:internship_id/send-reminder', internshipsEnhancedController_1.default.sendReminder);
// Company capacity routes
router.get('/companies/capacity-overview', internshipsEnhancedController_1.default.getCapacityOverview);
router.patch('/companies/:company_id/capacity', internshipsEnhancedController_1.default.updateCompanyCapacity);
// Document tracking routes
router.get('/:internship_id/documents-status', internshipsEnhancedController_1.default.getDocumentStatus);
// Bulk operations routes
router.get('/bulk/prepare-export', internshipsEnhancedController_1.default.prepareExport);
router.post('/bulk/send-reminders', internshipsEnhancedController_1.default.bulkSendReminders);
router.post('/bulk/update-status', internshipsEnhancedController_1.default.bulkUpdateStatus);
router.post('/generate-report', internshipsEnhancedController_1.default.generateReport);
// Analytics routes
router.get('/analytics/capacity-distribution', internshipsEnhancedController_1.default.getCapacityAnalytics);
router.get('/analytics/document-submission-rate', internshipsEnhancedController_1.default.getDocumentSubmissionRate);
exports.default = router;
//# sourceMappingURL=internships-enhanced.routes.js.map