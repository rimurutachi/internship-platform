import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
/**
 * Get all users with filtering, search, and pagination
 * Excludes archived users by default
 * Query params: role, status, search, page, limit, includeArchived
 */
export declare function getAllUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single user by ID
 */
export declare function getUserById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Verify user profile
 * Admin reviews and approves user registration data
 * Body: { comments?: string }
 */
export declare function verifyUserProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Reject user profile
 * Admin sends profile back for correction
 * Body: { rejection_reason: string }
 */
export declare function rejectUserProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Archive user (soft delete)
 * Data is preserved in database for analytics
 * REPLACES hard delete functionality
 */
export declare function archiveUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Unarchive user
 * Restore archived user to active status
 */
export declare function unarchiveUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete user endpoint - DISABLED
 * Returns error instructing to use archive instead
 */
export declare function deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update user role
 * Body: { role: 'student' | 'advisor' | 'supervisor' | 'admin' }
 */
export declare function updateUserRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update user status
 * Body: { status: 'active' | 'inactive' | 'suspended' | 'graduated' | 'pending_graduation' }
 */
export declare function updateUserStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Graduate student
 * Mark a student as graduated after internship completion and evaluation approval
 * Body: { graduation_notes?: string }
 */
export declare function graduateStudent(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=usersController.d.ts.map