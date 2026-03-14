/**
 * Hours Tracking Routes
 * 
 * API endpoints for internship hours tracking:
 * - GET /api/hours/programs - List all programs with required hours
 * - GET /api/hours/programs/:code - Get specific program hours
 * - GET /api/hours/internship/:id - Get internship hours summary
 * - GET /api/hours/internship/:id/breakdown - Get weekly breakdown
 * - POST /api/hours/internship/:id/recalculate - Force recalculate hours
 * 
 * Admin-only routes:
 * - POST /api/hours/programs - Create new program
 * - PUT /api/hours/programs/:code - Update program hours
 * - PUT /api/hours/internship/:id/required - Update internship required hours
 */

import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import * as hoursService from '../services/hoursService';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// Program Hours Routes (Public - Read)
// ============================================

/**
 * GET /api/hours/programs
 * Get all active programs with their required hours
 */
router.get('/programs', async (req: AuthRequest, res) => {
  try {
    console.log('🔵 [HoursRoutes] GET /programs');
    
    const result = await hoursService.getAllPrograms();
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Programs fetched successfully',
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error fetching programs:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/hours/programs/:code
 * Get required hours for a specific program
 */
router.get('/programs/:code', async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;
    const programCode = Array.isArray(code) ? code[0] : code;
    console.log('🔵 [HoursRoutes] GET /programs/:code -', programCode);
    
    const result = await hoursService.getProgramHours(programCode);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error fetching program:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================
// Internship Hours Routes
// ============================================

/**
 * GET /api/hours/internship/:id
 * Get internship hours summary (progress, remaining, projected end date)
 */
router.get('/internship/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const internshipId = Array.isArray(id) ? id[0] : id;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    console.log('🔵 [HoursRoutes] GET /internship/:id -', internshipId, 'User:', userId, 'Role:', userRole);
    
    // TODO: Add authorization check - user must be student, supervisor, advisor, or admin of this internship
    
    const result = await hoursService.getInternshipHoursSummary(internshipId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error fetching hours summary:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/hours/internship/:id/breakdown
 * Get daily hours breakdown for an internship
 */
router.get('/internship/:id/breakdown', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const internshipId = Array.isArray(id) ? id[0] : id;
    console.log('🔵 [HoursRoutes] GET /internship/:id/breakdown -', internshipId);
    
    const result = await hoursService.getDailyHoursBreakdown(internshipId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error fetching breakdown:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/hours/batch
 * Get hours summary for multiple internships at once
 * Body: { internship_ids: string[] }
 */
router.post('/batch', async (req: AuthRequest, res) => {
  try {
    const { internship_ids } = req.body;
    
    if (!Array.isArray(internship_ids) || internship_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'internship_ids array is required',
      });
    }

    console.log('🔵 [HoursRoutes] POST /batch - Count:', internship_ids.length);
    
    const result = await hoursService.getBatchInternshipHoursSummary(internship_ids);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error in batch fetch:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/hours/internship/:id/recalculate
 * Force recalculate total hours for an internship
 */
router.post('/internship/:id/recalculate', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const internshipId = Array.isArray(id) ? id[0] : id;
    console.log('🔵 [HoursRoutes] POST /internship/:id/recalculate -', internshipId);
    
    const result = await hoursService.recalculateTotalHours(internshipId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: { total_hours_worked: result.total },
      message: 'Hours recalculated successfully',
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error recalculating:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================
// Admin-Only Routes
// ============================================

/**
 * POST /api/hours/programs
 * Create a new program with required hours (admin only)
 */
router.post('/programs', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { program_code, program_name, required_hours, description } = req.body;
    
    console.log('🔵 [HoursRoutes] POST /programs -', program_code, 'Hours:', required_hours);
    
    if (!program_code || !program_name || !required_hours) {
      return res.status(400).json({
        success: false,
        error: 'program_code, program_name, and required_hours are required',
      });
    }

    if (required_hours < 40 || required_hours > 2000) {
      return res.status(400).json({
        success: false,
        error: 'required_hours must be between 40 and 2000',
      });
    }

    const result = await hoursService.createProgram(
      program_code,
      program_name,
      required_hours,
      description
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      data: result.data,
      message: 'Program created successfully',
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error creating program:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PUT /api/hours/programs/:code
 * Update required hours for a program (admin only)
 */
router.put('/programs/:code', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { code } = req.params;
    const programCode = Array.isArray(code) ? code[0] : code;
    const { required_hours } = req.body;
    
    console.log('🔵 [HoursRoutes] PUT /programs/:code -', programCode, 'New hours:', required_hours);
    
    if (!required_hours) {
      return res.status(400).json({
        success: false,
        error: 'required_hours is required',
      });
    }

    if (required_hours < 40 || required_hours > 2000) {
      return res.status(400).json({
        success: false,
        error: 'required_hours must be between 40 and 2000',
      });
    }

    const result = await hoursService.updateProgramHours(programCode, required_hours);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Program hours updated successfully',
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error updating program:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PUT /api/hours/internship/:id/required
 * Update required hours for a specific internship (admin only)
 */
router.put('/internship/:id/required', requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const internshipId = Array.isArray(id) ? id[0] : id;
    const { required_hours } = req.body;
    
    console.log('🔵 [HoursRoutes] PUT /internship/:id/required -', internshipId, 'Hours:', required_hours);
    
    if (!required_hours) {
      return res.status(400).json({
        success: false,
        error: 'required_hours is required',
      });
    }

    if (required_hours < 40 || required_hours > 2000) {
      return res.status(400).json({
        success: false,
        error: 'required_hours must be between 40 and 2000',
      });
    }

    const result = await hoursService.updateInternshipRequiredHours(internshipId, required_hours);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Internship required hours updated successfully',
    });
  } catch (error: any) {
    console.error('❌ [HoursRoutes] Error updating internship hours:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
