import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { ensureString } from '../utils/typeGuards';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

/**
 * Get all users with filtering, search, and pagination
 * Query params: role, status, search, page, limit
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const { role, status, search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply search
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
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
 * Create new user (both Auth and database)
 * Body: { email, firstName, lastName, role, password, company_id?, university_id?, program?, year_level?, section? }
 */
export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { email, firstName, lastName, role, password, company_id, university_id, program, year_level, section } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Email, first name, last name, role, and password are required',
      });
    }

    // Validate role
    const validRoles = ['student', 'advisor', 'supervisor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid role. Must be one of: student, advisor, supervisor, admin',
      });
    }

    // Validate supervisor has company
    if (role === 'supervisor' && !company_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Company ID is required for supervisors',
      });
    }

    // Validate student/advisor has program
    if ((role === 'student' || role === 'advisor') && !program) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Program is required for students and advisors',
      });
    }

    // Construct full name
    const fullName = `${firstName} ${lastName}`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        name: fullName,
        role,
      },
    });

    if (authError || !authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user',
        message: authError?.message || 'Auth user creation failed',
      });
    }

    // Create user in database
    const dbInsert: any = {
      id: authData.user.id,
      email,
      name: fullName,
      first_name: firstName,
      last_name: lastName,
      role,
      status: 'active',
      verified: true,
    };

    // Add role-specific fields
    if (role === 'supervisor' && company_id) {
      dbInsert.company_id = company_id;
    }
    
    // Handle students and advisors - add program, section, university
    if (role === 'student' || role === 'advisor') {
      // Get CVSU-BC university ID
      const { data: university } = await supabase
        .from('universities')
        .select('id')
        .eq('code', 'CVSU-BC')
        .single();
      
      if (university) {
        dbInsert.university_id = university.id;
      } else if (university_id) {
        // Fallback to provided university_id if CVSU-BC not found
        dbInsert.university_id = university_id;
      }

      // year_level is a direct column on users
      if (year_level) dbInsert.year_level = year_level;

      // program and section live in profile_data (not direct columns)
      if (program || section) {
        dbInsert.profile_data = {
          ...(program ? { program } : {}),
          ...(section ? { section } : {}),
        };
      }

      // Auto-assign advisor for students: fetch all active advisors, filter in memory
      // (program/section are in profile_data jsonb, so we filter client-side)
      if (role === 'student' && program) {
        const { data: activeAdvisors } = await supabase
          .from('users')
          .select('id, name, profile_data, year_level')
          .eq('role', 'advisor')
          .eq('status', 'active');

        let matchingAdvisor: { id: string; name: string } | null = null;

        if (activeAdvisors && activeAdvisors.length > 0) {
          const sameProgram = activeAdvisors.filter((a) => {
            const pd = a.profile_data || {};
            return (pd.program || pd.course || pd.department) === program;
          });

          // Priority 1: program + year_level + section
          if (!matchingAdvisor && year_level && section) {
            const found = sameProgram.find(
              (a) => a.year_level === year_level && a.profile_data?.section === section
            );
            if (found) matchingAdvisor = { id: found.id, name: found.name };
          }

          // Priority 2: program + year_level
          if (!matchingAdvisor && year_level) {
            const found = sameProgram.find((a) => a.year_level === year_level);
            if (found) matchingAdvisor = { id: found.id, name: found.name };
          }

          // Priority 3: program + section
          if (!matchingAdvisor && section) {
            const found = sameProgram.find((a) => a.profile_data?.section === section);
            if (found) matchingAdvisor = { id: found.id, name: found.name };
          }

          // Priority 4: program only
          if (!matchingAdvisor && sameProgram.length > 0) {
            matchingAdvisor = { id: sameProgram[0].id, name: sameProgram[0].name };
          }
        }

        if (matchingAdvisor) {
          // advisor_id is NOT a column on users — store it in profile_data so it can
          // be referenced when an internship record is later created for this student.
          dbInsert.profile_data = {
            ...(dbInsert.profile_data || {}),
            assigned_advisor_id: matchingAdvisor.id,
            assigned_advisor_name: matchingAdvisor.name,
          };
          console.log(`✅ Auto-assigned student ${fullName} to advisor ${matchingAdvisor.name} (program: ${program}, year: ${year_level})`);
        } else {
          console.log(`⚠️ No matching advisor found for student ${fullName} (program: ${program}, year: ${year_level}, section: ${section})`);
        }
      }
    }

    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert(dbInsert)
      .select()
      .single();

    if (dbError) {
      // Rollback: delete auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        message: dbError.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: dbUser,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Update user information (firstName, lastName, email, company_id, university_id)
 * Body: { firstName?, lastName?, email?, company_id?, university_id? }
 */
export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { firstName, lastName, email, company_id, university_id } = req.body;

    if (!firstName && !lastName && !email && !company_id && !university_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'At least one field to update is required',
      });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    
    // Handle name updates
    if (firstName || lastName) {
      // Get current user data to preserve existing names if only one is updated
      const { data: currentUser } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', id)
        .single();

      const newFirstName = firstName || currentUser?.first_name || '';
      const newLastName = lastName || currentUser?.last_name || '';
      const fullName = `${newFirstName} ${newLastName}`.trim();

      updates.first_name = newFirstName;
      updates.last_name = newLastName;
      updates.name = fullName;
    }
    
    if (email) updates.email = email;
    if (company_id !== undefined) updates.company_id = company_id;
    if (university_id !== undefined) updates.university_id = university_id;

    // Update database
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Failed to update user',
        message: error?.message || 'User not found',
      });
    }

    // Update Supabase Auth metadata
    const authUpdates: any = {};
    if (email) authUpdates.email = email;
    if (firstName || lastName) {
      authUpdates.user_metadata = {
        firstName: user.first_name,
        lastName: user.last_name,
        name: user.name,
      };
    }
    
    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.admin.updateUserById(id, authUpdates);
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Update user error:', error);
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
        updated_at: new Date().toISOString() 
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
        // Ban user indefinitely - use a very long duration
        await supabase.auth.admin.updateUserById(id, { 
          ban_duration: '876000h' // ~100 years
        });
      } else if (status === 'active') {
        // Unban user by setting duration to none
        await supabase.auth.admin.updateUserById(id, { 
          ban_duration: 'none' 
        });
      }
    } catch (authError: any) {
      console.error('Failed to update auth ban status:', authError);
      // Continue even if auth update fails
    }

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

/**
 * Update user role
 * Body: { role: 'student' | 'advisor' | 'supervisor' | 'admin' }
 */
export async function updateUserRole(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { role } = req.body;

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
    if (req.user?.id === id && req.user?.role === 'admin' && role !== 'admin') {
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
        updated_at: new Date().toISOString() 
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
 * Delete user (both Auth and database)
 */
export async function deleteUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');

    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(403).json({
        success: false,
        error: 'Operation not allowed',
        message: 'You cannot delete your own account',
      });
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with the provided ID',
      });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        message: dbError.message,
      });
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
      // Continue even if auth deletion fails, as DB record is already deleted
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Get user statistics
 * Returns: { total, active, students, advisors, supervisors, admins }
 */
export async function getUserStats(req: AuthRequest, res: Response) {
  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Total count error:', totalError);
      throw totalError;
    }

    // Get active count - check if status column exists
    const { count: active, error: activeError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) {
      console.error('Active count error:', activeError);
      // Don't throw, just set to 0 if column doesn't exist
    }

    // Get counts by role
    const { count: students, error: studentsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    if (studentsError) {
      console.error('Students count error:', studentsError);
    }

    const { count: advisors, error: advisorsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'advisor');

    if (advisorsError) {
      console.error('Advisors count error:', advisorsError);
    }

    const { count: supervisors, error: supervisorsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'supervisor');

    if (supervisorsError) {
      console.error('Supervisors count error:', supervisorsError);
    }

    const { count: admins, error: adminsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (adminsError) {
      console.error('Admins count error:', adminsError);
    }

    return res.status(200).json({
      success: true,
      data: {
        total: total || 0,
        active: active || 0,
        students: students || 0,
        advisors: advisors || 0,
        supervisors: supervisors || 0,
        admins: admins || 0,
      },
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to fetch statistics',
    });
  }
}

/**
 * Migrate existing users to split name into first_name and last_name
 * This is a one-time migration endpoint
 */
export async function migrateUserNames(req: AuthRequest, res: Response) {
  try {
    // Fetch all users without first_name or last_name
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, name, first_name, last_name')
      .or('first_name.is.null,last_name.is.null');

    if (fetchError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: fetchError.message,
      });
    }

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users need migration',
        migrated: 0,
      });
    }

    // Update each user
    const updates = users.map(async (user) => {
      if (!user.name) {
        return { id: user.id, success: false, reason: 'No name field' };
      }

      // Split name into first and last
      const nameParts = user.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''; // If only one word, use it for both

      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq('id', user.id);

      if (updateError) {
        return { id: user.id, success: false, reason: updateError.message };
      }

      return { id: user.id, success: true, firstName, lastName };
    });

    const results = await Promise.all(updates);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return res.status(200).json({
      success: true,
      message: `Migration complete. ${successful} users updated.`,
      migrated: successful,
      failed: failed.length > 0 ? failed : undefined,
    });
  } catch (error: any) {
    console.error('Migrate user names error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Archive a user (soft delete)
 * @route POST /api/admin/users/:id/archive
 */
export async function archiveUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_archived')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    // Check if already archived
    if (user.is_archived) {
      return res.status(400).json({
        success: false,
        error: 'Already archived',
        message: 'User is already archived',
      });
    }

    // Archive the user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'User archived successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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
 * Unarchive a user (restore)
 * @route POST /api/admin/users/:id/unarchive
 */
export async function unarchiveUser(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_archived')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist',
      });
    }

    // Check if not archived
    if (!user.is_archived) {
      return res.status(400).json({
        success: false,
        error: 'Not archived',
        message: 'User is not archived',
      });
    }

    // Unarchive the user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_archived: false,
        archived_at: null,
        status: 'active',
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'User unarchived successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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
 * Graduate student
 * Mark a student as graduated after internship completion and evaluation approval
 * Body: { graduation_notes?: string }
 */
export async function graduateStudent(req: AuthRequest, res: Response) {
  try {
    const id = ensureString(req.params.id, 'id');
    const { graduation_notes } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authentication required',
      });
    }

    // Get user to graduate
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

    // Only students can be graduated
    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'Only students can be marked as graduated',
      });
    }

    // Check if already graduated
    if (user.status === 'graduated') {
      return res.status(400).json({
        success: false,
        error: 'Already graduated',
        message: 'This student has already been marked as graduated',
      });
    }

    // Check if student has at least one completed internship
    const { data: completedInternships } = await supabase
      .from('internships')
      .select('id')
      .eq('student_id', id)
      .eq('status', 'completed')
      .limit(1);

    if (!completedInternships || completedInternships.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Internship not completed',
        message: 'Student must have a completed internship before graduating',
      });
    }

    // Check if final evaluation is approved
    const { data: approvedEvals } = await supabase
      .from('evaluations')
      .select('id')
      .eq('student_id', id)
      .eq('status', 'approved')
      .eq('evaluation_type', 'final')
      .limit(1);

    if (!approvedEvals || approvedEvals.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Evaluation not approved',
        message: 'Student must have an approved final evaluation before graduating',
      });
    }

    // Graduate the student
    const { data: graduatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        status: 'graduated',
        graduated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to graduate student',
        message: updateError.message,
      });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: adminId,
      action: 'student_graduated',
      entity_type: 'user',
      entity_id: id,
      details: {
        graduated_student: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
        },
        graduation_notes: graduation_notes || null,
        internship_id: completedInternships[0].id,
      },
    });

    // Notify the student
    await supabase.from('notifications').insert({
      user_id: id,
      type: 'student_graduated',
      title: 'Congratulations! You have Graduated',
      message: 'Your OJT program has been completed successfully. Congratulations on your graduation!',
      data: {
        graduation_notes: graduation_notes || null,
        graduated_at: new Date().toISOString(),
      },
    });

    console.log(`✅ Student ${id} graduated successfully by admin ${adminId}`);

    return res.status(200).json({
      success: true,
      data: graduatedUser,
      message: 'Student marked as graduated successfully',
    });
  } catch (error: any) {
    console.error('Graduate student error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
