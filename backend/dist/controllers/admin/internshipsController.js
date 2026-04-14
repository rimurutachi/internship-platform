"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internshipsController = exports.InternshipsController = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const internship_service_1 = require("../../services/internship.service");
const typeGuards_1 = require("../../utils/typeGuards");
const notificationService_1 = __importDefault(require("../../services/notificationService"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
class InternshipsController {
    constructor() {
        this.internshipService = internship_service_1.internshipService;
    }
    /**
     * GET /admin/internships
     * Get all internships with filters and pagination
     */
    async getInternships(req, res) {
        console.log('[AdminInternships] getInternships request', { filters: req.query, user: req.user?.id });
        try {
            const { page = 1, limit = 20, status, university_id, company_id, search, } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            let query = supabase
                .from('internships')
                .select(`
          *,
          student:users!internships_student_id_fkey(id, name, email, university_id),
          advisor:users!internships_advisor_id_fkey(id, name, email, university_id),
          supervisor:users!internships_supervisor_id_fkey(id, name, email, company_id),
          company:companies(id, name, industry)
        `, { count: 'exact' });
            // Apply filters
            if (status) {
                query = query.eq('status', status);
            }
            if (company_id) {
                query = query.eq('company_id', company_id);
            }
            if (university_id) {
                // Filter by advisor's university
                const { data: advisors } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'advisor')
                    .eq('university_id', university_id);
                if (advisors && advisors.length > 0) {
                    const advisorIds = advisors.map((a) => a.id);
                    query = query.in('advisor_id', advisorIds);
                }
                else {
                    // No advisors found, return empty result
                    return res.json({
                        success: true,
                        data: {
                            internships: [],
                            pagination: { page: pageNum, limit: limitNum, total: 0 },
                            total: 0,
                        },
                    });
                }
            }
            if (search) {
                // Search in student name or email - requires joining
                const { data: matchingStudents } = await supabase
                    .from('users')
                    .select('id')
                    .eq('role', 'student')
                    .or(`name.ilike.%${search}%,email.ilike.%${search}%`);
                if (matchingStudents && matchingStudents.length > 0) {
                    const studentIds = matchingStudents.map((s) => s.id);
                    query = query.in('student_id', studentIds);
                }
                else {
                    // No matching students found
                    return res.json({
                        success: true,
                        data: {
                            internships: [],
                            pagination: { page: pageNum, limit: limitNum, total: 0 },
                            total: 0,
                        },
                    });
                }
            }
            // Apply pagination
            const offset = (pageNum - 1) * limitNum;
            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limitNum - 1);
            if (error) {
                console.error('[AdminInternships] getInternships query error', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch internships',
                });
            }
            console.log('[AdminInternships] getInternships success', { count: count || 0, page: pageNum });
            res.json({
                success: true,
                data: {
                    internships: data || [],
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total: count || 0,
                        totalPages: Math.ceil((count || 0) / limitNum),
                    },
                    total: count || 0,
                },
            });
        }
        catch (error) {
            console.error('Error in getInternships:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * GET /admin/internships/:id
     * Get single internship with activity log
     */
    async getInternship(req, res) {
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            const { data: internship, error } = await supabase
                .from('internships')
                .select(`
          *,
          student:users!internships_student_id_fkey(*),
          advisor:users!internships_advisor_id_fkey(*),
          supervisor:users!internships_supervisor_id_fkey(*),
          company:companies(*)
        `)
                .eq('id', id)
                .single();
            if (error || !internship) {
                return res.status(404).json({
                    success: false,
                    error: 'Internship not found',
                });
            }
            // Fetch activity log
            const { data: logs } = await supabase
                .from('activity_log')
                .select(`
          *,
          user:users(name, email)
        `)
                .eq('internship_id', id)
                .order('created_at', { ascending: false });
            res.json({
                success: true,
                data: {
                    internship,
                    activity_log: logs || [],
                },
            });
        }
        catch (error) {
            console.error('Error in getInternship:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * POST /admin/internships
     * Create new internship with validation
     */
    async createInternship(req, res) {
        console.log('[AdminInternships] createInternship request', { studentId: req.body.student_id, companyId: req.body.company_id, user: req.user?.id });
        try {
            const { student_id, company_id, position, department, advisor_id, supervisor_id, start_date, end_date, status = 'pending', required_hours, program_code, } = req.body;
            // Validate required fields
            if (!student_id ||
                !company_id ||
                !position ||
                !advisor_id ||
                !supervisor_id ||
                !start_date ||
                !end_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                });
            }
            // Validate date range
            if (new Date(start_date) >= new Date(end_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'Start date must be before end date',
                });
            }
            // Validate internship assignment constraints
            const validation = await this.internshipService.validateInternshipAssignment(student_id, company_id, advisor_id, supervisor_id);
            if (!validation.valid) {
                return res.status(validation.errors.includes('Student already has an active internship') ? 409 : 400).json({
                    success: false,
                    error: validation.errors.join(', '),
                    errors: validation.errors,
                });
            }
            // Create internship — include required_hours and program_code so custom hours are preserved
            const { data: internship, error } = await supabase
                .from('internships')
                .insert({
                student_id,
                company_id,
                advisor_id,
                supervisor_id,
                position,
                department,
                start_date,
                end_date,
                status,
                ...(required_hours ? { required_hours: Number(required_hours) } : {}),
                ...(program_code ? { program_code } : {}),
            })
                .select()
                .single();
            if (error) {
                console.error('Error creating internship:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create internship',
                });
            }
            // Log activity
            await this.internshipService.logActivity(req.user.id, 'internship_created', internship.id, `Admin created internship for student at company as ${position}`, { internship_data: internship });
            console.log('[AdminInternships] createInternship success', { internshipId: internship.id });
            res.status(201).json({
                success: true,
                data: {
                    internship,
                    message: 'Internship created successfully',
                },
            });
        }
        catch (error) {
            console.error('Error in createInternship:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * PATCH /admin/internships/:id
     * Update internship (cannot change student or company)
     */
    async updateInternship(req, res) {
        console.log('[AdminInternships] updateInternship request', { internshipId: req.params.id, updates: Object.keys(req.body), user: req.user?.id });
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            const { position, department, advisor_id, supervisor_id, start_date, end_date, status, required_hours, program_code } = req.body;
            // Get current internship
            const { data: currentInternship, error: fetchError } = await supabase
                .from('internships')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !currentInternship) {
                return res.status(404).json({
                    success: false,
                    error: 'Internship not found',
                });
            }
            // Prepare update object (only updatable fields)
            const updateData = {};
            if (position !== undefined)
                updateData.position = position;
            if (department !== undefined)
                updateData.department = department;
            if (advisor_id !== undefined)
                updateData.advisor_id = advisor_id;
            if (supervisor_id !== undefined)
                updateData.supervisor_id = supervisor_id;
            if (start_date !== undefined)
                updateData.start_date = start_date;
            if (end_date !== undefined)
                updateData.end_date = end_date;
            if (status !== undefined)
                updateData.status = status;
            if (required_hours !== undefined)
                updateData.required_hours = Number(required_hours); // ← was missing!
            if (program_code !== undefined)
                updateData.program_code = program_code; // ← was missing!
            // Validate new date range if provided
            const finalStartDate = start_date || currentInternship.start_date;
            const finalEndDate = end_date || currentInternship.end_date;
            if (new Date(finalStartDate) >= new Date(finalEndDate)) {
                return res.status(400).json({
                    success: false,
                    error: 'Start date must be before end date',
                });
            }
            // Validate advisor/supervisor changes
            const validation = await this.internshipService.validateInternshipUpdate(id, advisor_id, supervisor_id);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.errors.join(', '),
                    errors: validation.errors,
                });
            }
            // Update internship
            const { data: updatedInternship, error } = await supabase
                .from('internships')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Error updating internship:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update internship',
                });
            }
            // Calculate and log changes
            const changes = this.internshipService.calculateChanges(currentInternship, updateData);
            if (Object.keys(changes).length > 0) {
                await this.internshipService.logActivity(req.user.id, 'internship_updated', id, 'Admin updated internship', { changes });
            }
            // Send notifications for status changes
            if (status && status !== currentInternship.status) {
                const statusMessages = {
                    active: { title: 'Internship Approved', message: 'Your internship has been approved and is now active.' },
                    completed: { title: 'Internship Completed', message: 'Congratulations! Your internship has been marked as completed.' },
                    cancelled: { title: 'Internship Cancelled', message: 'Your internship has been cancelled. Please contact your advisor for more information.' },
                };
                const notifInfo = statusMessages[status];
                if (notifInfo && currentInternship.student_id) {
                    try {
                        await notificationService_1.default.createNotification({
                            user_id: currentInternship.student_id,
                            type: `internship_${status}`,
                            title: notifInfo.title,
                            message: notifInfo.message,
                            action_url: `/dashboard/student/internship`,
                            reference_type: 'internship',
                        });
                    }
                    catch (notifError) {
                        console.error('⚠️ Failed to send internship status notification:', notifError);
                    }
                }
            }
            res.json({
                success: true,
                data: {
                    internship: updatedInternship,
                    message: 'Internship updated successfully',
                },
            });
        }
        catch (error) {
            console.error('Error in updateInternship:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * DELETE /admin/internships/:id
     * Cancel internship (soft delete)
     */
    async deleteInternship(req, res) {
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            const { data: internship, error: fetchError } = await supabase
                .from('internships')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !internship) {
                return res.status(404).json({
                    success: false,
                    error: 'Internship not found',
                });
            }
            // Soft delete by setting status to 'cancelled'
            const { error } = await supabase
                .from('internships')
                .update({ status: 'cancelled' })
                .eq('id', id);
            if (error) {
                console.error('Error cancelling internship:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to cancel internship',
                });
            }
            // Log deletion
            await this.internshipService.logActivity(req.user.id, 'internship_cancelled', id, 'Admin cancelled internship', { previous_status: internship.status });
            // Notify student about cancellation
            if (internship.student_id) {
                try {
                    await notificationService_1.default.createNotification({
                        user_id: internship.student_id,
                        type: 'internship_cancelled',
                        title: 'Internship Cancelled',
                        message: 'Your internship has been cancelled by an administrator. Please contact your advisor for more information.',
                        action_url: `/dashboard/student/internship`,
                        reference_type: 'internship',
                    });
                }
                catch (notifError) {
                    console.error('⚠️ Failed to send cancellation notification:', notifError);
                }
            }
            res.json({
                success: true,
                data: {
                    message: 'Internship cancelled successfully',
                },
            });
        }
        catch (error) {
            console.error('Error in deleteInternship:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * POST /admin/internships/:id/archive
     * Archive an internship (soft delete)
     */
    async archiveInternship(req, res) {
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            // Check if internship exists and is not already archived
            const { data: internship, error: fetchError } = await supabase
                .from('internships')
                .select('id, student_id, company_id, is_archived, status')
                .eq('id', id)
                .single();
            if (fetchError || !internship) {
                return res.status(404).json({
                    success: false,
                    message: 'Internship not found',
                });
            }
            if (internship.is_archived) {
                return res.status(400).json({
                    success: false,
                    message: 'Internship is already archived',
                });
            }
            // Check if there are pending evaluations
            const { count: pendingEvaluations } = await supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .eq('internship_id', id)
                .eq('status', 'pending');
            if (pendingEvaluations && pendingEvaluations > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot archive internship with ${pendingEvaluations} pending evaluation(s). Please complete them first.`,
                });
            }
            // Archive the internship
            const { error: updateError } = await supabase
                .from('internships')
                .update({
                is_archived: true,
                archived_at: new Date().toISOString(),
            })
                .eq('id', id);
            if (updateError) {
                throw updateError;
            }
            // Log activity
            await this.internshipService.logActivity(req.user.id, 'internship_archived', id, 'Admin archived internship', { previous_status: internship.status });
            return res.status(200).json({
                success: true,
                message: 'Internship archived successfully',
                data: {
                    id: internship.id,
                },
            });
        }
        catch (error) {
            console.error('Error in archiveInternship:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
            });
        }
    }
    /**
     * POST /admin/internships/:id/unarchive
     * Unarchive an internship (restore)
     */
    async unarchiveInternship(req, res) {
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            // Check if internship exists and is archived
            const { data: internship, error: fetchError } = await supabase
                .from('internships')
                .select('id, student_id, company_id, is_archived, status')
                .eq('id', id)
                .single();
            if (fetchError || !internship) {
                return res.status(404).json({
                    success: false,
                    message: 'Internship not found',
                });
            }
            if (!internship.is_archived) {
                return res.status(400).json({
                    success: false,
                    message: 'Internship is not archived',
                });
            }
            // Unarchive the internship
            const { error: updateError } = await supabase
                .from('internships')
                .update({
                is_archived: false,
                archived_at: null,
            })
                .eq('id', id);
            if (updateError) {
                throw updateError;
            }
            // Log activity
            await this.internshipService.logActivity(req.user.id, 'internship_unarchived', id, 'Admin unarchived internship', { current_status: internship.status });
            return res.status(200).json({
                success: true,
                message: 'Internship unarchived successfully',
                data: {
                    id: internship.id,
                },
            });
        }
        catch (error) {
            console.error('Error in unarchiveInternship:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: error.message,
            });
        }
    }
    /**
     * GET /admin/internships/available-students
     * Get students without active internships
     */
    async getAvailableStudents(req, res) {
        try {
            // Get all active internship student IDs
            const { data: activeInternships } = await supabase
                .from('internships')
                .select('student_id')
                .eq('status', 'active');
            const activeStudentIds = activeInternships?.map((i) => i.student_id) || [];
            // Get all students not in active internships list
            let query = supabase
                .from('users')
                .select('id, name, email, university_id, profile_data')
                .eq('role', 'student');
            if (activeStudentIds.length > 0) {
                query = query.not('id', 'in', `(${activeStudentIds.join(',')})`);
            }
            const { data: students, error } = await query;
            if (error) {
                console.error('Error fetching available students:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch available students',
                });
            }
            res.json({
                success: true,
                data: { students: students || [] },
            });
        }
        catch (error) {
            console.error('Error in getAvailableStudents:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * GET /admin/internships/advisors-by-university/:university_id
     * Get advisors for specific university
     */
    async getAdvisorsByUniversity(req, res) {
        try {
            const { university_id } = req.params;
            const { data: advisors, error } = await supabase
                .from('users')
                .select('id, name, email, university_id')
                .eq('role', 'advisor')
                .eq('university_id', university_id);
            if (error) {
                console.error('Error fetching advisors:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch advisors',
                });
            }
            res.json({
                success: true,
                data: { advisors: advisors || [] },
            });
        }
        catch (error) {
            console.error('Error in getAdvisorsByUniversity:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * GET /admin/internships/supervisors-by-company/:company_id
     * Get supervisors for specific company
     */
    async getSupervisorsByCompany(req, res) {
        try {
            const { company_id } = req.params;
            const { data: supervisors, error } = await supabase
                .from('users')
                .select('id, name, email, company_id')
                .eq('role', 'supervisor')
                .eq('company_id', company_id);
            if (error) {
                console.error('Error fetching supervisors:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch supervisors',
                });
            }
            res.json({
                success: true,
                data: { supervisors: supervisors || [] },
            });
        }
        catch (error) {
            console.error('Error in getSupervisorsByCompany:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * GET /admin/internships/:id/activity-log
     * Get activity log for specific internship
     */
    async getInternshipActivityLog(req, res) {
        try {
            const id = (0, typeGuards_1.ensureString)(req.params.id, 'id');
            const { data: logs, error } = await supabase
                .from('activity_log')
                .select(`
          *,
          user:users(name, email)
        `)
                .eq('internship_id', id)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching activity log:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch activity log',
                });
            }
            res.json({
                success: true,
                data: { activity_log: logs || [] },
            });
        }
        catch (error) {
            console.error('Error in getInternshipActivityLog:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
    /**
     * GET /admin/internships/stats/summary
     * Get internships summary statistics
     */
    async getInternshipStats(req, res) {
        try {
            const { data: internships, error } = await supabase
                .from('internships')
                .select('status');
            if (error) {
                console.error('Error fetching stats:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch statistics',
                });
            }
            const stats = {
                total: internships?.length || 0,
                active: internships?.filter((i) => i.status === 'active').length || 0,
                pending: internships?.filter((i) => i.status === 'pending').length || 0,
                completed: internships?.filter((i) => i.status === 'completed').length || 0,
                cancelled: internships?.filter((i) => i.status === 'cancelled').length || 0,
            };
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Error in getInternshipStats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    }
}
exports.InternshipsController = InternshipsController;
exports.internshipsController = new InternshipsController();
//# sourceMappingURL=internshipsController.js.map