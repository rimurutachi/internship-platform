import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth';
import {
  getAllUsers,
  getUserById,
  verifyUserProfile,
  rejectUserProfile,
  archiveUser,
  unarchiveUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
} from '../../controllers/admin/usersController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

// User verification routes
router.post('/users/:id/verify', verifyUserProfile);
router.post('/users/:id/reject', rejectUserProfile);

// User archival routes (soft delete)
router.post('/users/:id/archive', archiveUser);
router.post('/users/:id/unarchive', unarchiveUser);

// Delete route - returns error (use archive instead)
router.delete('/users/:id', deleteUser);

// User status and role management
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);

export default router;
