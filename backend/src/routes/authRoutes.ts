import express, { Response, Router, Request } from "express";
import {
  authenticateToken,
  requireRole,
  AuthRequest,
} from "../middleware/auth";
import {
  validateLoginRequest,
  validateRegisterRequest,
  validateProfileUpdateRequest,
  sanitizeInput,
} from "../middleware/validation";
import { AuthService } from "../services/authService";
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendAuthError,
  asyncHandler,
} from "../utils/responseUtils";
import {
  LoginRequest,
  RegisterRequest,
  ProfileUpdateRequest,
} from "../types/auth";

const router: Router = express.Router();

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post(
  "/auth/login",
  sanitizeInput,
  validateLoginRequest,
  asyncHandler(async (req: Request<{}, any, LoginRequest>, res: Response) => {
    const result = await AuthService.login(req.body);

    if ("error" in result) {
      return sendErrorResponse(res, result.error, result.message, 401);
    }

    return sendSuccessResponse(res, "Login successful", result);
  })
);

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  "/auth/register",
  sanitizeInput,
  validateRegisterRequest,
  asyncHandler(
    async (req: Request<{}, any, RegisterRequest>, res: Response) => {
      const result = await AuthService.register(req.body);

      if ("error" in result) {
        return sendErrorResponse(res, result.error, result.message, 400);
      }

      return sendSuccessResponse(res, result.message, result.user, 201);
    }
  )
);

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  "/auth/profile",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
      return sendAuthError(res, "User not authenticated");
    }

    const result = await AuthService.getUserProfile(req.user.id);

    if ("error" in result) {
      return sendErrorResponse(res, result.error, result.message, 404);
    }

    return sendSuccessResponse(res, result.message, result.data);
  })
);

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/auth/profile",
  authenticateToken,
  sanitizeInput,
  validateProfileUpdateRequest,
  asyncHandler(
    async (
      req: AuthRequest & Request<{}, any, ProfileUpdateRequest>,
      res: Response
    ) => {
      if (!req.user?.id) {
        return sendAuthError(res, "User not authenticated");
      }

      const result = await AuthService.updateUserProfile(req.user.id, req.body);

      if ("error" in result) {
        return sendErrorResponse(res, result.error, result.message, 400);
      }

      return sendSuccessResponse(res, result.message, result.data);
    }
  )
);

/**
 * @route   GET /auth/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get(
  "/auth/users",
  authenticateToken,
  requireRole(["admin"]),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await AuthService.getAllUsers();

    if ("error" in result) {
      return sendErrorResponse(res, result.error, result.message, 500);
    }

    return sendSuccessResponse(res, result.message, result.data);
  })
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  "/auth/logout",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Note: In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage. This endpoint is for completeness
    // and potential future server-side token blacklisting.
    return sendSuccessResponse(res, "Logged out successfully");
  })
);

export default router;
