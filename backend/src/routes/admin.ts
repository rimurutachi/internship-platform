import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import * as adminController from '../controllers/adminController';
import documentRoutes from './admin/documents';
import systemRoutes from './admin/system';
import securityRoutes from './admin/security.routes';
import reportsRoutes from './admin/reports.routes';
import settingsRoutes from './admin/settings.routes';
import dashboardRoutes from './admin/dashboard.routes';
import internshipsRoutes from './admin/internships';
import evaluationsRoutes from './admin/evaluations.routes';
import companiesRoutes from './admin/companies';

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

// Archive/unarchive user (soft delete)
router.post('/users/:id/archive', adminController.archiveUser);
router.post('/users/:id/unarchive', adminController.unarchiveUser);

// Delete user
router.delete('/users/:id', adminController.deleteUser);

// Document management routes
router.use('/documents', documentRoutes);

// System management routes
router.use('/system', systemRoutes);

// Security management routes
router.use('/security', securityRoutes);

// Reports and analytics routes
router.use('/reports', reportsRoutes);

// Settings and configuration routes
router.use('/settings', settingsRoutes);

// Dashboard analytics routes
router.use('/dashboard', dashboardRoutes);

// Internships management routes
router.use('/internships', internshipsRoutes);

// Evaluations management routes
router.use('/evaluations', evaluationsRoutes);

// Companies management routes
router.use('/companies', companiesRoutes);

export default router;
