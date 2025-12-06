"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
exports.deleteUser = deleteUser;
exports.getUserStats = getUserStats;
exports.migrateUserNames = migrateUserNames;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Get all users with filtering, search, and pagination
 * Query params: role, status, search, page, limit
 */
async function getAllUsers(req, res) {
    try {
        const { role, status, search, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
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
    }
    catch (error) {
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
async function getUserById(req, res) {
    try {
        const { id } = req.params;
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
    }
    catch (error) {
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
 * Body: { email, firstName, lastName, role, password }
 */
async function createUser(req, res) {
    try {
        const { email, firstName, lastName, role, password, company_id, university_id } = req.body;
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
        const dbInsert = {
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
        // Auto-assign CVSU-Bacoor Campus to students and advisors
        if (role === 'student' || role === 'advisor') {
            // Get CVSU-BC university ID
            const { data: university } = await supabase
                .from('universities')
                .select('id')
                .eq('code', 'CVSU-BC')
                .single();
            if (university) {
                dbInsert.university_id = university.id;
            }
            else if (university_id) {
                // Fallback to provided university_id if CVSU-BC not found
                dbInsert.university_id = university_id;
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
    }
    catch (error) {
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
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, company_id, university_id } = req.body;
        if (!firstName && !lastName && !email && !company_id && !university_id) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'At least one field to update is required',
            });
        }
        const updates = { updated_at: new Date().toISOString() };
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
        if (email)
            updates.email = email;
        if (company_id !== undefined)
            updates.company_id = company_id;
        if (university_id !== undefined)
            updates.university_id = university_id;
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
        const authUpdates = {};
        if (email)
            authUpdates.email = email;
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
    }
    catch (error) {
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
async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
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
            }
            else if (status === 'active') {
                // Unban user by setting duration to none
                await supabase.auth.admin.updateUserById(id, {
                    ban_duration: 'none'
                });
            }
        }
        catch (authError) {
            console.error('Failed to update auth ban status:', authError);
            // Continue even if auth update fails
        }
        return res.status(200).json({
            success: true,
            data: user,
            message: 'User status updated successfully',
        });
    }
    catch (error) {
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
async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
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
    }
    catch (error) {
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
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
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
    }
    catch (error) {
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
async function getUserStats(req, res) {
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
    }
    catch (error) {
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
async function migrateUserNames(req, res) {
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
    }
    catch (error) {
        console.error('Migrate user names error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}
//# sourceMappingURL=adminController.js.map