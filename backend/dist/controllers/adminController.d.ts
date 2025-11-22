import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Get all users with filtering, search, and pagination
 * Query params: role, status, search, page, limit
 */
export declare function getAllUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get single user by ID
 */
export declare function getUserById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Create new user (both Auth and database)
 * Body: { email, name, role, password }
 */
export declare function createUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update user information (name, email)
 * Body: { name?, email? }
 */
export declare function updateUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update user status
 * Body: { status: 'active' | 'inactive' | 'suspended' }
 */
export declare function updateUserStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Update user role
 * Body: { role: 'student' | 'advisor' | 'supervisor' | 'admin' }
 */
export declare function updateUserRole(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Delete user (both Auth and database)
 */
export declare function deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Get user statistics
 * Returns: { total, active, students, advisors, supervisors, admins }
 */
export declare function getUserStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=adminController.d.ts.map