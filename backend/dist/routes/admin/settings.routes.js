"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = __importDefault(require("../../controllers/admin/settingsController"));
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
// Profile routes
router.get('/profile', settingsController_1.default.getProfile.bind(settingsController_1.default));
router.patch('/profile', settingsController_1.default.updateProfile.bind(settingsController_1.default));
router.post('/profile/upload-avatar', settingsController_1.default.uploadAvatar.bind(settingsController_1.default));
// Platform settings routes
router.get('/platform', settingsController_1.default.getPlatformSettings.bind(settingsController_1.default));
router.patch('/platform', settingsController_1.default.updatePlatformSettings.bind(settingsController_1.default));
// Notification settings routes
router.get('/notifications', settingsController_1.default.getNotificationSettings.bind(settingsController_1.default));
router.patch('/notifications', settingsController_1.default.updateNotificationSettings.bind(settingsController_1.default));
// Advanced settings routes
router.get('/advanced', settingsController_1.default.getAdvancedSettings.bind(settingsController_1.default));
router.patch('/advanced', settingsController_1.default.updateAdvancedSettings.bind(settingsController_1.default));
// Backup routes
router.post('/backup/trigger', settingsController_1.default.triggerBackup.bind(settingsController_1.default));
// Cache routes
router.post('/cache/clear', settingsController_1.default.clearCache.bind(settingsController_1.default));
// System health routes
router.get('/health', settingsController_1.default.getSystemHealth.bind(settingsController_1.default));
// Timezone routes
router.get('/timezones', settingsController_1.default.getTimezones.bind(settingsController_1.default));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map