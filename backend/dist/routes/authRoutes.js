"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const authService_1 = require("../services/authService");
const responseUtils_1 = require("../utils/responseUtils");
const router = express_1.default.Router();
/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post("/auth/login", validation_1.sanitizeInput, validation_1.validateLoginRequest, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    const result = await authService_1.AuthService.login(req.body);
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 401);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, "Login successful", result);
}));
/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/auth/register", validation_1.sanitizeInput, validation_1.validateRegisterRequest, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    const result = await authService_1.AuthService.register(req.body);
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 400);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, result.message, result.user, 201);
}));
/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/auth/profile", auth_1.authenticateToken, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return (0, responseUtils_1.sendAuthError)(res, "User not authenticated");
    }
    const result = await authService_1.AuthService.getUserProfile(req.user.id);
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 404);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, result.message, result.data);
}));
/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/auth/profile", auth_1.authenticateToken, validation_1.sanitizeInput, validation_1.validateProfileUpdateRequest, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        return (0, responseUtils_1.sendAuthError)(res, "User not authenticated");
    }
    const result = await authService_1.AuthService.updateUserProfile(req.user.id, req.body);
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 400);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, result.message, result.data);
}));
/**
 * @route   GET /auth/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get("/auth/users", auth_1.authenticateToken, (0, auth_1.requireRole)(["admin"]), (0, responseUtils_1.asyncHandler)(async (req, res) => {
    const result = await authService_1.AuthService.getAllUsers();
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 500);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, result.message, result.data);
}));
/**
 * @route   PUT /auth/users/:userId/role
 * @desc    Admin can change user roles
 * @access  Private/Admin
 */
router.put("/auth/users/:userId/role", auth_1.authenticateToken, (0, auth_1.requireRole)(["admin"]), validation_1.sanitizeInput, validation_1.validateRoleChangeRequest, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    const result = await authService_1.AuthService.changeUserRole(userId, role);
    if ("error" in result) {
        return (0, responseUtils_1.sendErrorResponse)(res, result.error, result.message, 400);
    }
    return (0, responseUtils_1.sendSuccessResponse)(res, result.message, result.data);
}));
/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/auth/logout", auth_1.authenticateToken, (0, responseUtils_1.asyncHandler)(async (req, res) => {
    // Note: In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. This endpoint is for completeness
    // and potential future server-side token blacklisting.
    return (0, responseUtils_1.sendSuccessResponse)(res, "Logged out successfully");
}));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map