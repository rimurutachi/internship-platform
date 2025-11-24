import { Router } from 'express';
import SecurityController from '../../controllers/admin/securityController';

const router = Router();

// Security Overview
router.get('/overview', SecurityController.getOverview);

// Audit Logs (activity + API logs)
router.get('/audit-logs', SecurityController.getAuditLogs);

// API Request Logs
router.get('/api-logs', SecurityController.getApiLogs);

// Security Alerts
router.get('/alerts', SecurityController.getSecurityAlerts);

// Acknowledge/Resolve Alert
router.patch('/alerts/:alertId', SecurityController.updateAlert);

// Login Attempts
router.get('/login-attempts', SecurityController.getLoginAttempts);

// Security Settings
router.get('/settings', SecurityController.getSettings);
router.patch('/settings', SecurityController.updateSettings);

// Security Health Status
router.get('/health-status', SecurityController.getHealthStatus);

// Export Audit Logs
router.post('/export/audit-logs', SecurityController.exportAuditLogs);

export default router;
