import express from 'express';
import settingsController from '../../controllers/admin/settingsController';
import { authenticateToken, requireRole } from '../../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);
router.use(requireRole(['admin']));

// Profile
router.get('/profile', settingsController.getProfile.bind(settingsController));
router.patch('/profile', settingsController.updateProfile.bind(settingsController));
router.post('/profile/upload-avatar', upload.single('avatar'), settingsController.uploadAvatar.bind(settingsController));

// Platform
router.get('/platform', settingsController.getPlatformSettings.bind(settingsController));
router.patch('/platform', settingsController.updatePlatformSettings.bind(settingsController));

// Notifications
router.get('/notifications', settingsController.getNotificationSettings.bind(settingsController));
router.patch('/notifications', settingsController.updateNotificationSettings.bind(settingsController));

// Advanced
router.get('/advanced', settingsController.getAdvancedSettings.bind(settingsController));
router.patch('/advanced', settingsController.updateAdvancedSettings.bind(settingsController));

// Maintenance helpers
router.post('/backup/trigger', settingsController.triggerBackup.bind(settingsController));
router.post('/cache/clear', settingsController.clearCache.bind(settingsController));
router.get('/health', settingsController.getSystemHealth.bind(settingsController));
router.get('/timezones', settingsController.getTimezones.bind(settingsController));

export default router;
