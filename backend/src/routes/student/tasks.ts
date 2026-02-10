/**
 * Student Tasks Routes
 * Personal task management for students during internship
 */

import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import * as studentTasksService from '../../services/studentTasksService';

const router = Router();

// All routes require authentication and student role
router.use(authenticateToken);
router.use(requireRole(['student']));

/**
 * GET /api/student/tasks
 * Get all tasks for the authenticated student
 * Query params: status, priority, internship_id
 */
router.get('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { status, priority, internship_id } = req.query;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    console.log('🔵 [Tasks] GET /tasks request:', {
      studentId,
      filters: { status, priority, internship_id },
    });

    const result = await studentTasksService.getStudentTasks(studentId, {
      status: status as any,
      priority: priority as any,
      internship_id: internship_id as string,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in GET /tasks:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/student/tasks/stats
 * Get task statistics for dashboard widget
 * Query params: internship_id
 */
router.get('/tasks/stats', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { internship_id } = req.query;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    console.log('🔵 [Tasks] GET /tasks/stats request:', {
      studentId,
      internship_id,
    });

    const result = await studentTasksService.getTaskStats(
      studentId,
      internship_id as string | undefined
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in GET /tasks/stats:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/student/tasks/:id
 * Get a specific task by ID
 */
router.get('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const id = req.params.id as string;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    console.log('🔵 [Tasks] GET /tasks/:id request:', {
      studentId,
      taskId: id,
    });

    const result = await studentTasksService.getTaskById(studentId, id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in GET /tasks/:id:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/student/tasks
 * Create a new task
 */
router.post('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { internship_id, title, description, priority, due_date } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate required fields
    if (!internship_id) {
      return res.status(400).json({
        success: false,
        error: 'internship_id is required',
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'title is required and must be a non-empty string',
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'title must be 200 characters or less',
      });
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'priority must be one of: low, medium, high',
      });
    }

    // Validate due_date if provided
    if (due_date) {
      const dueDateTime = new Date(due_date);
      if (isNaN(dueDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'due_date must be a valid date',
        });
      }
    }

    console.log('🔵 [Tasks] POST /tasks request:', {
      studentId,
      internship_id,
      title: title.trim(),
      priority,
    });

    const result = await studentTasksService.createTask(studentId, {
      internship_id,
      title: title.trim(),
      description: description?.trim(),
      priority,
      due_date,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ [Tasks] Task created:', result.data?.id);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in POST /tasks:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/student/tasks/:id
 * Update a task
 */
router.patch('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const id = req.params.id as string;
    const { title, description, priority, status, due_date } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'title must be a non-empty string',
        });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({
          success: false,
          error: 'title must be 200 characters or less',
        });
      }
    }

    // Validate priority if provided
    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'priority must be one of: low, medium, high',
      });
    }

    // Validate status if provided
    if (status !== undefined && !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: pending, in_progress, completed',
      });
    }

    // Validate due_date if provided
    if (due_date !== undefined && due_date !== null) {
      const dueDateTime = new Date(due_date);
      if (isNaN(dueDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'due_date must be a valid date',
        });
      }
    }

    console.log('🔵 [Tasks] PATCH /tasks/:id request:', {
      studentId,
      taskId: id,
      updates: { title, description, priority, status, due_date },
    });

    const result = await studentTasksService.updateTask(studentId, id, {
      title,
      description,
      priority,
      status,
      due_date,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ [Tasks] Task updated:', result.data?.id);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in PATCH /tasks/:id:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/student/tasks/:id
 * Delete a task
 */
router.delete('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const id = req.params.id as string;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    console.log('🔵 [Tasks] DELETE /tasks/:id request:', {
      studentId,
      taskId: id,
    });

    const result = await studentTasksService.deleteTask(studentId, id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ [Tasks] Task deleted:', id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [Tasks] Error in DELETE /tasks/:id:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/student/tasks/bulk-status
 * Bulk update task statuses
 */
router.post('/tasks/bulk-status', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { task_ids, status } = req.body;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate task_ids
    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'task_ids must be a non-empty array',
      });
    }

    // Validate status
    if (!['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: pending, in_progress, completed',
      });
    }

    console.log('🔵 [Tasks] POST /tasks/bulk-status request:', {
      studentId,
      taskCount: task_ids.length,
      status,
    });

    const result = await studentTasksService.bulkUpdateTaskStatus(studentId, task_ids, status);

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log('✅ [Tasks] Bulk status update:', result.data?.updated, 'tasks');

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ [Tasks] Error in POST /tasks/bulk-status:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
