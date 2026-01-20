import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { ensureString } from '../../utils/typeGuards';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Get all users with filtering, search, and pagination
 * Excludes archived users by default
 * Query params: role, status, search, page, limit, includeArchived
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const { 
      role, 
      status, 
      search, 
      page = '1', 
      limit = '10',
      includeArchived = 'false',
      verification_status
    } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Exclude archived users by default
    if (includeArchived !== 'true') {
      query = query.or('is_archived.is.null,is_archived.eq.false');
    }

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (verification_status) {
      query = query.eq('verification_status', verification_status);
    }

    // Apply search
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},student_number.ilike.${searchTerm}`
      );
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: users, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Get single user by ID
 */
export async function getUserById(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Verify user profile
 * Admin reviews and approves user registration data
 * Body: { comments?: string }
 */
export async function verifyUserProfile(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { comments } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    // Get user to verify
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    // Validate user data is complete
    if (!user.first_name || !user.last_name || !user.email) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete user data',
        message: 'User profile must have first name, last name, and email',
      });
    }

    // For students, validate student_number exists
    if (user.role === 'student' && !user.student_number) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete student data',
        message: 'Student must have a student number',
      });
    }

    // Update user verification status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'verified',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        verification_rejection_reason: null, // Clear any previous rejection
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify user',
        message: updateError.message,
      });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_verified',
      entity_type: 'user',
      entity_id: id,
      details: {
        verified_user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
        },
        comments: comments || null,
      },
    });

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'profile_verified',
      title: 'Profile Verified',
      message: 'Your profile has been verified by an administrator.',
      data: { comments: comments || null },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User profile verified successfully',
    });
  } catch (error: any) {
    console.error('Verify user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Reject user profile
 * Admin sends profile back for correction
 * Body: { rejection_reason: string }
 */
export async function rejectUserProfile(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { rejection_reason } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    if (!rejection_reason || rejection_reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Rejection reason is required and must be at least 10 characters',
      });
    }

    // Get user to reject
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    // Update user verification status
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'rejected',
        verification_rejection_reason: rejection_reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to reject user profile',
        message: updateError.message,
      });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_profile_rejected',
      entity_type: 'user',
      entity_id: id,
      details: {
        rejected_user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
        },
        rejection_reason,
      },
    });

    // Send notification to user with feedback
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'profile_rejected',
      title: 'Profile Needs Correction',
      message: `Your profile needs correction: ${rejection_reason}`,
      data: { rejection_reason },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User profile rejected. Notification sent to user.',
    });
  } catch (error: any) {
    console.error('Reject user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Archive user (soft delete)
 * Data is preserved in database for analytics
 * REPLACES hard delete functionality
 */
export async function archiveUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    // Prevent self-archival
    if (adminId === id) {
      return res.status(403).json({
        success: false,
        error: 'Operation not allowed',
        message: 'You cannot archive your own account',
      });
    }

    // Get user to archive
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    // Check if already archived
    if (user.is_archived) {
      return res.status(400).json({
        success: false,
        error: 'User already archived',
        message: 'This user is already archived',
      });
    }

    // Archive user (soft delete)
    const { data: archivedUser, error: archiveError } = await supabase
      .from('users')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: adminId,
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (archiveError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to archive user',
        message: archiveError.message,
      });
    }

    // Ban user in Supabase Auth (prevent login)
    try {
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: '876000h', // ~100 years
      });
    } catch (authError: any) {
      console.error('Failed to ban auth user:', authError);
      // Continue even if auth update fails
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_archived',
      entity_type: 'user',
      entity_id: id,
      details: {
        archived_user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: archivedUser,
      message: 'User archived successfully. Data preserved for historical records.',
    });
  } catch (error: any) {
    console.error('Archive user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Unarchive user
 * Restore archived user to active status
 */
export async function unarchiveUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    // Get user to unarchive
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    // Check if actually archived
    if (!user.is_archived) {
      return res.status(400).json({
        success: false,
        error: 'User not archived',
        message: 'This user is not archived',
      });
    }

    // Unarchive user
    const { data: unarchivedUser, error: unarchiveError } = await supabase
      .from('users')
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (unarchiveError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to unarchive user',
        message: unarchiveError.message,
      });
    }

    // Unban user in Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(id, {
        ban_duration: 'none',
      });
    } catch (authError: any) {
      console.error('Failed to unban auth user:', authError);
      // Continue even if auth update fails
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_unarchived',
      entity_type: 'user',
      entity_id: id,
      details: {
        unarchived_user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: unarchivedUser,
      message: 'User unarchived successfully',
    });
  } catch (error: any) {
    console.error('Unarchive user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Delete user endpoint - DISABLED
 * Returns error instructing to use archive instead
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    message: 'User deletion is disabled. Please use the archive endpoint instead to preserve data for historical records.',
    alternativeEndpoint: 'POST /api/admin/users/:id/archive',
  });
}

/**
 * Update user role
 * Body: { role: 'student' | 'advisor' | 'supervisor' | 'admin' }
 */
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { role } = req.body;
    const adminId = req.user?.id;

    // Validate role
    const validRoles = ['student', 'advisor', 'supervisor', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid role. Must be one of: student, advisor, supervisor, admin',
      });
    }

    // Prevent self-demotion
    if (adminId === id && req.user?.role === 'admin' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Operation not allowed',
        message: 'You cannot change your own admin role',
      });
    }

    // Update database
    const { data: user, error } = await supabase
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update user role',
        message: error?.message || 'User not found',
      });
    }

    // Update role in Supabase Auth user_metadata
    await supabase.auth.admin.updateUserById(id, {
      user_metadata: { role },
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_role_updated',
      entity_type: 'user',
      entity_id: id,
      details: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        },
        new_role: role,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    });
  } catch (error: any) {
    console.error('Update user role error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Update user status
 * Body: { status: 'active' | 'inactive' | 'suspended' }
 */
export async function updateUserStatus(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { status } = req.body;
    const adminId = req.user?.id;

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid status. Must be one of: active, inactive, suspended',
      });
    }

    // Update database
    const { data: user, error } = await supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update user status',
        message: error?.message || 'User not found',
      });
    }

    // Ban/unban user in Supabase Auth based on status
    try {
      if (status === 'suspended' || status === 'inactive') {
        await supabase.auth.admin.updateUserById(id, {
          ban_duration: '876000h', // ~100 years
        });
      } else if (status === 'active') {
        await supabase.auth.admin.updateUserById(id, {
          ban_duration: 'none',
        });
      }
    } catch (authError: any) {
      console.error('Failed to update auth ban status:', authError);
      // Continue even if auth update fails
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'user_status_updated',
      entity_type: 'user',
      entity_id: id,
      details: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
        },
        new_status: status,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User status updated successfully',
    });
  } catch (error: any) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
