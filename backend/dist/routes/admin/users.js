"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const usersController_1 = require("../../controllers/admin/usersController");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
// User management routes
router.get('/users', usersController_1.getAllUsers);
router.get('/users/:id', usersController_1.getUserById);
// User verification routes
router.post('/users/:id/verify', usersController_1.verifyUserProfile);
router.post('/users/:id/reject', usersController_1.rejectUserProfile);
// User archival routes (soft delete)
router.post('/users/:id/archive', usersController_1.archiveUser);
router.post('/users/:id/unarchive', usersController_1.unarchiveUser);
// Delete route - returns error (use archive instead)
router.delete('/users/:id', usersController_1.deleteUser);
// User status and role management
router.patch('/users/:id/role', usersController_1.updateUserRole);
router.patch('/users/:id/status', usersController_1.updateUserStatus);
exports.default = router;
//# sourceMappingURL=users.js.map