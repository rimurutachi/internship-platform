"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const securityController_1 = __importDefault(require("../../controllers/admin/securityController"));
const router = (0, express_1.Router)();
// Security Overview
router.get('/overview', securityController_1.default.getOverview);
// Audit Logs (activity + API logs)
router.get('/audit-logs', securityController_1.default.getAuditLogs);
// API Request Logs
router.get('/api-logs', securityController_1.default.getApiLogs);
// Security Alerts
router.get('/alerts', securityController_1.default.getSecurityAlerts);
// Acknowledge/Resolve Alert
router.patch('/alerts/:alertId', securityController_1.default.updateAlert);
// Login Attempts
router.get('/login-attempts', securityController_1.default.getLoginAttempts);
// Security Settings
router.get('/settings', securityController_1.default.getSettings);
router.patch('/settings', securityController_1.default.updateSettings);
// Security Health Status
router.get('/health-status', securityController_1.default.getHealthStatus);
// Export Audit Logs
router.post('/export/audit-logs', securityController_1.default.exportAuditLogs);
exports.default = router;
//# sourceMappingURL=security.routes.js.map