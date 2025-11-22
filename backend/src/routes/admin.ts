import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
import documentRoutes from './admin/documents';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

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
router.use('/documents', documentRoutes);

export default router;
