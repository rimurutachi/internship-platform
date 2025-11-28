"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminController = __importStar(require("../controllers/adminController"));
const documents_1 = __importDefault(require("./admin/documents"));
const system_1 = __importDefault(require("./admin/system"));
const security_routes_1 = __importDefault(require("./admin/security.routes"));
const reports_routes_1 = __importDefault(require("./admin/reports.routes"));
const settings_routes_1 = __importDefault(require("./admin/settings.routes"));
const dashboard_routes_1 = __importDefault(require("./admin/dashboard.routes"));
const internships_1 = __importDefault(require("./admin/internships"));
const evaluations_routes_1 = __importDefault(require("./admin/evaluations.routes"));
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticateToken);
router.use((0, auth_1.requireRole)(['admin']));
// IMPORTANT: Specific routes MUST come before parameterized routes
// Get user statistics (BEFORE /users/:id)
router.get('/users/stats/overview', adminController.getUserStats);
// Migrate user names (one-time migration endpoint)
router.post('/users/migrate-names', adminController.migrateUserNames);
// Get all users with filtering and pagination
router.get('/users', adminController.getAllUsers);
// Get single user by ID (AFTER specific routes)
router.get('/users/:id', adminController.getUserById);
// Create new user
router.post('/users', adminController.createUser);
// Update user information
router.patch('/users/:id', adminController.updateUser);
// Update user status
router.patch('/users/:id/status', adminController.updateUserStatus);
// Update user role
router.patch('/users/:id/role', adminController.updateUserRole);
// Delete user
router.delete('/users/:id', adminController.deleteUser);
// Document management routes
router.use('/documents', documents_1.default);
// System management routes
router.use('/system', system_1.default);
// Security management routes
router.use('/security', security_routes_1.default);
// Reports and analytics routes
router.use('/reports', reports_routes_1.default);
// Settings and configuration routes
router.use('/settings', settings_routes_1.default);
// Dashboard analytics routes
router.use('/dashboard', dashboard_routes_1.default);
// Internships management routes
router.use('/internships', internships_1.default);
// Evaluations management routes
router.use('/evaluations', evaluations_routes_1.default);
exports.default = router;
//# sourceMappingURL=admin.js.map