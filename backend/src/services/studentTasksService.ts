/**
 * Student Tasks Service
 * Handles CRUD operations for student personal task management
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// Types
export interface StudentTask {
  id: string;
  student_id: string;
  internship_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  internship_id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  due_date?: string | null;
}

export interface TaskFilters {
  status?: 'pending' | 'in_progress' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high';
  internship_id?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

/**
 * Get all tasks for a student
 */
export async function getStudentTasks(
  studentId: string,
  filters: TaskFilters = {}
): Promise<{ success: boolean; data?: { tasks: StudentTask[]; stats: TaskStats }; error?: string }> {
  try {
    console.log('🔵 [TasksService] Fetching tasks for student:', studentId, 'filters:', filters);

    let query = supabase
      .from('student_tasks')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.internship_id) {
      query = query.eq('internship_id', filters.internship_id);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('❌ [TasksService] Error fetching tasks:', error);
      return { success: false, error: error.message };
    }

    // Calculate stats
    const allTasks = tasks || [];
    const stats: TaskStats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };

    // If filtering by status, we need to get stats from all tasks
    if (filters.status && filters.status !== 'all') {
      const { data: allTasksForStats } = await supabase
        .from('student_tasks')
        .select('status')
        .eq('student_id', studentId)
        .eq('internship_id', filters.internship_id || '');

      if (allTasksForStats) {
        stats.total = allTasksForStats.length;
        stats.pending = allTasksForStats.filter(t => t.status === 'pending').length;
        stats.in_progress = allTasksForStats.filter(t => t.status === 'in_progress').length;
        stats.completed = allTasksForStats.filter(t => t.status === 'completed').length;
      }
    }

    console.log('✅ [TasksService] Fetched tasks:', {
      count: allTasks.length,
      stats,
    });

    return { success: true, data: { tasks: allTasks, stats } };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception fetching tasks:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get task stats for dashboard widget
 */
export async function getTaskStats(
  studentId: string,
  internshipId?: string
): Promise<{ success: boolean; data?: TaskStats; error?: string }> {
  try {
    console.log('🔵 [TasksService] Fetching task stats for student:', studentId);

    let query = supabase
      .from('student_tasks')
      .select('status')
      .eq('student_id', studentId);

    if (internshipId) {
      query = query.eq('internship_id', internshipId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('❌ [TasksService] Error fetching task stats:', error);
      return { success: false, error: error.message };
    }

    const allTasks = tasks || [];
    const stats: TaskStats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
    };

    console.log('✅ [TasksService] Task stats:', stats);

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception fetching task stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  studentId: string,
  taskId: string
): Promise<{ success: boolean; data?: StudentTask; error?: string }> {
  try {
    console.log('🔵 [TasksService] Fetching task:', taskId);

    const { data: task, error } = await supabase
      .from('student_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('student_id', studentId)
      .single();

    if (error) {
      console.error('❌ [TasksService] Error fetching task:', error);
      return { success: false, error: error.message };
    }

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    console.log('✅ [TasksService] Fetched task:', task.id);

    return { success: true, data: task };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception fetching task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new task
 */
export async function createTask(
  studentId: string,
  taskData: CreateTaskData
): Promise<{ success: boolean; data?: StudentTask; error?: string }> {
  try {
    console.log('🔵 [TasksService] Creating task:', {
      studentId,
      title: taskData.title,
      internship_id: taskData.internship_id,
    });

    // Validate internship belongs to student
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('id, status')
      .eq('id', taskData.internship_id)
      .eq('student_id', studentId)
      .single();

    if (internshipError || !internship) {
      console.error('❌ [TasksService] Internship validation failed:', internshipError?.message);
      return { success: false, error: 'Internship not found or does not belong to student' };
    }

    // Create task
    const { data: task, error } = await supabase
      .from('student_tasks')
      .insert({
        student_id: studentId,
        internship_id: taskData.internship_id,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || null,
        priority: taskData.priority || 'medium',
        status: 'pending',
        due_date: taskData.due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [TasksService] Error creating task:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [TasksService] Task created:', task.id);

    return { success: true, data: task };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception creating task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a task
 */
export async function updateTask(
  studentId: string,
  taskId: string,
  updateData: UpdateTaskData
): Promise<{ success: boolean; data?: StudentTask; error?: string }> {
  try {
    console.log('🔵 [TasksService] Updating task:', taskId, updateData);

    // Verify task belongs to student
    const { data: existingTask, error: fetchError } = await supabase
      .from('student_tasks')
      .select('id')
      .eq('id', taskId)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !existingTask) {
      console.error('❌ [TasksService] Task not found or unauthorized:', fetchError?.message);
      return { success: false, error: 'Task not found' };
    }

    // Build update object
    const updates: Record<string, any> = {};
    
    if (updateData.title !== undefined) {
      updates.title = updateData.title.trim();
    }
    
    if (updateData.description !== undefined) {
      updates.description = updateData.description?.trim() || null;
    }
    
    if (updateData.priority !== undefined) {
      updates.priority = updateData.priority;
    }
    
    if (updateData.status !== undefined) {
      updates.status = updateData.status;
    }
    
    if (updateData.due_date !== undefined) {
      updates.due_date = updateData.due_date;
    }

    // Update task
    const { data: task, error } = await supabase
      .from('student_tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) {
      console.error('❌ [TasksService] Error updating task:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [TasksService] Task updated:', task.id);

    return { success: true, data: task };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception updating task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(
  studentId: string,
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔵 [TasksService] Deleting task:', taskId);

    const { error } = await supabase
      .from('student_tasks')
      .delete()
      .eq('id', taskId)
      .eq('student_id', studentId);

    if (error) {
      console.error('❌ [TasksService] Error deleting task:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [TasksService] Task deleted:', taskId);

    return { success: true };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception deleting task:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk update task statuses
 */
export async function bulkUpdateTaskStatus(
  studentId: string,
  taskIds: string[],
  status: 'pending' | 'in_progress' | 'completed'
): Promise<{ success: boolean; data?: { updated: number }; error?: string }> {
  try {
    console.log('🔵 [TasksService] Bulk updating tasks:', {
      taskIds,
      status,
    });

    const { data, error } = await supabase
      .from('student_tasks')
      .update({ status })
      .in('id', taskIds)
      .eq('student_id', studentId)
      .select();

    if (error) {
      console.error('❌ [TasksService] Error bulk updating tasks:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [TasksService] Bulk updated tasks:', data?.length || 0);

    return { success: true, data: { updated: data?.length || 0 } };
  } catch (error: any) {
    console.error('💥 [TasksService] Exception bulk updating tasks:', error);
    return { success: false, error: error.message };
  }
}

export default {
  getStudentTasks,
  getTaskStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTaskStatus,
};
