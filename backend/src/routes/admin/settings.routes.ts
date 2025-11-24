import express from 'express';
import settingsController from '../../controllers/admin/settingsController';
import { authenticateToken, requireRole } from '../../middleware/auth';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Profile routes
router.get('/profile', settingsController.getProfile.bind(settingsController));
router.patch('/profile', settingsController.updateProfile.bind(settingsController));
router.post('/profile/upload-avatar', settingsController.uploadAvatar.bind(settingsController));

// Platform settings routes
router.get('/platform', settingsController.getPlatformSettings.bind(settingsController));
router.patch('/platform', settingsController.updatePlatformSettings.bind(settingsController));

// Notification settings routes
router.get('/notifications', settingsController.getNotificationSettings.bind(settingsController));
router.patch('/notifications', settingsController.updateNotificationSettings.bind(settingsController));

// Advanced settings routes
router.get('/advanced', settingsController.getAdvancedSettings.bind(settingsController));
router.patch('/advanced', settingsController.updateAdvancedSettings.bind(settingsController));

// Backup routes
router.post('/backup/trigger', settingsController.triggerBackup.bind(settingsController));

// Cache routes
router.post('/cache/clear', settingsController.clearCache.bind(settingsController));

// System health routes
router.get('/health', settingsController.getSystemHealth.bind(settingsController));

// Timezone routes
router.get('/timezones', settingsController.getTimezones.bind(settingsController));

export default router;
