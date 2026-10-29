"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanies = getCompanies;
exports.getCompany = getCompany;
exports.createCompany = createCompany;
exports.updateCompany = updateCompany;
exports.deleteCompany = deleteCompany;
exports.getCompanyStats = getCompanyStats;
exports.getCompanySupervisors = getCompanySupervisors;
exports.archiveCompany = archiveCompany;
exports.unarchiveCompany = unarchiveCompany;
exports.updateCompanyStudentsCount = updateCompanyStudentsCount;
exports.assignSupervisorToCompany = assignSupervisorToCompany;
exports.removeSupervisorFromCompany = removeSupervisorFromCompany;
exports.getAllSupervisors = getAllSupervisors;
exports.checkCompanyName = checkCompanyName;
exports.getNextCompanyCode = getNextCompanyCode;
exports.verifyCompanyWebsite = verifyCompanyWebsite;
const supabase_js_1 = require("@supabase/supabase-js");
const axios_1 = __importDefault(require("axios"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Get all companies with pagination and filters
 * GET /admin/companies?page=1&limit=20&search=tech&is_verified=true
 */
async function getCompanies(req, res) {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = req.query.search;
        const is_verified = req.query.is_verified;
        const offset = (page - 1) * limit;
        // Build base query for filtering
        let baseQuery = supabase.from('companies');
        // Apply filters for count - INCLUDE archived (show all with status badge)
        let countQuery = baseQuery.select('*', { count: 'exact', head: true });
        if (search) {
            countQuery = countQuery.ilike('name', `%${search}%`);
        }
        if (is_verified === 'true') {
            countQuery = countQuery.eq('is_verified', true);
        }
        else if (is_verified === 'false') {
            countQuery = countQuery.eq('is_verified', false);
        }
        // Get total count
        const { count: total, error: countError } = await countQuery;
        if (countError)
            throw countError;
        // Build data query with same filters
        let dataQuery = supabase
            .from('companies')
            .select(`
          *,
          supervisors:users!company_id(
            id,
            email,
            name
          )
        `); // Show ALL companies including archived
        // Apply same filters to data query
        if (search) {
            dataQuery = dataQuery.ilike('name', `%${search}%`);
        }
        if (is_verified === 'true') {
            dataQuery = dataQuery.eq('is_verified', true);
        }
        else if (is_verified === 'false') {
            dataQuery = dataQuery.eq('is_verified', false);
        }
        // Get paginated data
        const { data: companies, error } = await dataQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw error;
        // Add supervisor count and active internships count
        // Add supervisor count and active internships count
        const companiesWithCounts = await Promise.all((companies || []).map(async (company) => {
            const { count: internshipCount, error: internshipError } = await supabase
                .from('internships')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .in('status', ['active', 'ongoing']);
            const currentStudents = internshipError ? 0 : (internshipCount || 0);
            const availableSlots = (company.capacity_limit || 0) - currentStudents;
            // Update current_students in database to match actual count
            await supabase
                .from('companies')
                .update({ current_students: currentStudents })
                .eq('id', company.id);
            return {
                ...company,
                supervisor_count: company.supervisors?.length || 0,
                active_internships: currentStudents,
                current_students: currentStudents, // Sync with active internships
                available_slots: Math.max(0, availableSlots), // Calculate remaining capacity
            };
        }));
        res.json({
            success: true,
            data: {
                companies: companiesWithCounts,
                pagination: {
                    page,
                    limit,
                    total: total || 0,
                    totalPages: Math.ceil((total || 0) / limit),
                },
            },
        });
    }
    catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
            message: error.message,
        });
    }
}
/**
 * Get single company by ID
 * GET /admin/companies/:id
 */
async function getCompany(req, res) {
    try {
        const { id } = req.params;
        const { data: company, error } = await supabase
            .from('companies')
            .select(`
          *,
          supervisors:users!company_id(
            id,
            email,
            name,
            status
          )
        `)
            .eq('id', id)
            .single();
        if (error || !company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found',
            });
        }
        // Get active internships count
        const { count: internshipCount, error: internshipError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)
            .eq('status', 'active');
        const result = {
            ...company,
            supervisor_count: company.supervisors?.length || 0,
            active_internships: internshipError ? 0 : (internshipCount || 0),
        };
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company',
            message: error.message,
        });
    }
}
/**
 * Create new company
 * POST /admin/companies
 * Body: { name, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
async function createCompany(req, res) {
    try {
        const { name, industry, address, contact_info, code, capacity_limit, is_verified, is_moa_standardized, } = req.body;
        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Company name is required',
            });
        }
        const trimmedName = name.trim();
        // Check duplicate company name (exact match, case-insensitive)
        const { data: existingCompany } = await supabase
            .from('companies')
            .select('id, name')
            .ilike('name', trimmedName)
            .maybeSingle();
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                error: 'Duplicate company name',
                message: `A company named "${existingCompany.name}" is already registered.`,
            });
        }
        // Create company
        const { data: company, error } = await supabase
            .from('companies')
            .insert({
            name: trimmedName,
            industry: industry || null,
            address: address || null,
            contact_info: contact_info || null,
            code: code || null,
            capacity_limit: capacity_limit || 10,
            is_verified: is_verified || false,
            is_moa_standardized: is_moa_standardized || false,
        })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json({
            success: true,
            data: company,
            message: 'Company created successfully',
        });
    }
    catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company',
            message: error.message,
        });
    }
}
/**
 * Update company
 * PATCH /admin/companies/:id
 * Body: { name?, industry?, address?, contact_info?, code?, capacity_limit?, is_verified?, is_moa_standardized? }
 */
async function updateCompany(req, res) {
    try {
        const { id } = req.params;
        const { name, industry, address, contact_info, code, capacity_limit, is_verified, is_moa_standardized, } = req.body;
        const updates = {};
        if (name !== undefined) {
            const trimmedName = name.trim();
            if (!trimmedName) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Company name cannot be empty',
                });
            }
            // Check duplicate company name excluding current company
            const { data: existingCompany } = await supabase
                .from('companies')
                .select('id, name')
                .ilike('name', trimmedName)
                .neq('id', id)
                .maybeSingle();
            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    error: 'Duplicate company name',
                    message: `A company named "${existingCompany.name}" is already registered.`,
                });
            }
            updates.name = trimmedName;
        }
        if (industry !== undefined)
            updates.industry = industry;
        if (address !== undefined)
            updates.address = address;
        if (contact_info !== undefined)
            updates.contact_info = contact_info;
        if (code !== undefined)
            updates.code = code;
        if (capacity_limit !== undefined)
            updates.capacity_limit = capacity_limit;
        if (is_verified !== undefined)
            updates.is_verified = is_verified;
        if (is_moa_standardized !== undefined)
            updates.is_moa_standardized = is_moa_standardized;
        const { data: company, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error || !company) {
            console.error('Update company error:', error);
            return res.status(404).json({
                success: false,
                error: 'Company not found or update failed',
                message: error?.message || 'Company not found',
            });
        }
        res.json({
            success: true,
            data: company,
            message: 'Company updated successfully',
        });
    }
    catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update company',
            message: error.message,
        });
    }
}
/**
 * Delete company
 * DELETE /admin/companies/:id
 */
async function deleteCompany(req, res) {
    try {
        const { id } = req.params;
        // Check if company has active internships
        const { count: activeInternships, error: countError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)
            .eq('status', 'active');
        if (!countError && activeInternships && activeInternships > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete company with active internships',
                message: `This company has ${activeInternships} active internship(s)`,
            });
        }
        // Check if company has supervisors
        const { count: supervisorCount, error: supervisorError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)
            .eq('role', 'supervisor');
        if (!supervisorError && supervisorCount && supervisorCount > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete company with assigned supervisors',
                message: `This company has ${supervisorCount} supervisor(s) assigned`,
            });
        }
        // Delete company
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error)
            throw error;
        res.json({
            success: true,
            message: 'Company deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete company',
            message: error.message,
        });
    }
}
/**
 * Get company statistics
 * GET /admin/companies/stats
 */
async function getCompanyStats(req, res) {
    try {
        // Total companies
        const { count: total, error: totalError } = await supabase
            .from('companies')
            .select('id', { count: 'exact', head: true });
        // Verified companies
        const { count: verified, error: verifiedError } = await supabase
            .from('companies')
            .select('id', { count: 'exact', head: true })
            .eq('is_verified', true);
        // Companies with MOA
        const { count: with_moa, error: moaError } = await supabase
            .from('companies')
            .select('id', { count: 'exact', head: true })
            .eq('is_moa_standardized', true);
        // Total supervisors
        const { count: total_supervisors, error: supervisorsError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'supervisor');
        // Total capacity (available slots = total capacity - current students)
        const { data: capacityData, error: capacityError } = await supabase
            .from('companies')
            .select('capacity_limit, current_students');
        const total_capacity = capacityData?.reduce((sum, c) => {
            const capacity = c.capacity_limit || 0;
            const students = c.current_students || 0;
            return sum + Math.max(0, capacity - students); // Available slots only
        }, 0) || 0;
        // Active partnerships (companies with internships)
        const { data: activeCompanies, error: activeError } = await supabase
            .from('internships')
            .select('company_id')
            .eq('status', 'active');
        // Get unique company IDs
        const uniqueCompanies = activeCompanies ? [...new Set(activeCompanies.map(i => i.company_id))] : [];
        const active_partnerships = uniqueCompanies.length || 0;
        res.json({
            success: true,
            data: {
                total: total || 0,
                verified: verified || 0,
                with_moa: with_moa || 0,
                total_supervisors: total_supervisors || 0,
                total_capacity,
                active_partnerships,
            },
        });
    }
    catch (error) {
        console.error('Get company stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company statistics',
            message: error.message,
        });
    }
}
/**
 * Get supervisors for a specific company
 * GET /admin/companies/:id/supervisors
 */
async function getCompanySupervisors(req, res) {
    try {
        const { id } = req.params;
        const { data: supervisors, error } = await supabase
            .from('users')
            .select('id, email, name, first_name, last_name, status, last_login')
            .eq('company_id', id)
            .eq('role', 'supervisor')
            .order('name', { ascending: true });
        if (error)
            throw error;
        // Get active internships count for each supervisor
        const supervisorsWithCounts = await Promise.all((supervisors || []).map(async (supervisor) => {
            const { count, error: countError } = await supabase
                .from('internships')
                .select('id', { count: 'exact', head: true })
                .eq('supervisor_id', supervisor.id)
                .in('status', ['active', 'pending']);
            return {
                id: supervisor.id,
                name: supervisor.name || `${supervisor.first_name || ''} ${supervisor.last_name || ''}`.trim(),
                email: supervisor.email,
                status: supervisor.status,
                last_login: supervisor.last_login,
                active_internships: countError ? 0 : (count || 0),
            };
        }));
        res.json({
            success: true,
            data: {
                supervisors: supervisorsWithCounts,
            },
        });
    }
    catch (error) {
        console.error('Get company supervisors error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company supervisors',
            message: error.message,
        });
    }
}
/**
 * Archive a company (soft delete)
 * POST /admin/companies/:id/archive
 */
async function archiveCompany(req, res) {
    try {
        const { id } = req.params;
        // Check if company exists
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select('id, name, current_students')
            .eq('id', id)
            .single();
        if (fetchError || !company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found',
                message: 'The specified company does not exist',
            });
        }
        // Check for active internships
        const { count: activeInternships } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)
            .in('status', ['active', 'ongoing']);
        if (activeInternships && activeInternships > 0) {
            return res.status(400).json({
                success: false,
                error: 'Company has active internships',
                message: `Cannot archive company with ${activeInternships} active internship(s). Please complete or transfer them first.`,
            });
        }
        // Archive the company (set is_archived flag)
        const { error: updateError } = await supabase
            .from('companies')
            .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({
            success: true,
            message: 'Company archived successfully',
            data: {
                id: company.id,
                name: company.name,
            },
        });
    }
    catch (error) {
        console.error('Archive company error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}
/**
 * Unarchive a company (restore from archive)
 * POST /admin/companies/:id/unarchive
 */
async function unarchiveCompany(req, res) {
    try {
        const { id } = req.params;
        // Check if company exists and is archived
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name, is_archived')
            .eq('id', id)
            .single();
        if (companyError || !company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found',
            });
        }
        if (!company.is_archived) {
            return res.status(400).json({
                success: false,
                message: 'Company is not archived',
            });
        }
        // Unarchive the company
        const { error: updateError } = await supabase
            .from('companies')
            .update({
            is_archived: false,
            archived_at: null,
        })
            .eq('id', id);
        if (updateError) {
            throw updateError;
        }
        return res.status(200).json({
            success: true,
            message: 'Company unarchived successfully',
            data: {
                id: company.id,
                name: company.name,
            },
        });
    }
    catch (error) {
        console.error('Unarchive company error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}
/**
 * Get current students count for a company
 * This updates the current_students field based on active internships
 * GET /admin/companies/:id/students-count
 */
async function updateCompanyStudentsCount(req, res) {
    try {
        const { id } = req.params;
        // Count active internships for this company
        const { count, error: countError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', id)
            .in('status', ['active', 'ongoing']);
        if (countError)
            throw countError;
        // Update company's current_students
        const { error: updateError } = await supabase
            .from('companies')
            .update({ current_students: count || 0 })
            .eq('id', id);
        if (updateError)
            throw updateError;
        res.json({
            success: true,
            data: {
                current_students: count || 0,
            },
        });
    }
    catch (error) {
        console.error('Update company students count error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update students count',
            message: error.message,
        });
    }
}
/**
 * Assign a supervisor to a company
 * POST /admin/companies/:id/supervisors
 * Body: { supervisor_id: string }
 */
async function assignSupervisorToCompany(req, res) {
    try {
        const { id } = req.params;
        const { supervisor_id } = req.body;
        if (!supervisor_id) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Supervisor ID is required',
            });
        }
        // Check if company exists
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', id)
            .single();
        if (companyError || !company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found',
            });
        }
        // Check if user exists and is a supervisor
        const { data: supervisor, error: supervisorError } = await supabase
            .from('users')
            .select('id, name, email, role, company_id')
            .eq('id', supervisor_id)
            .single();
        if (supervisorError || !supervisor) {
            return res.status(404).json({
                success: false,
                error: 'Supervisor not found',
            });
        }
        if (supervisor.role !== 'supervisor') {
            return res.status(400).json({
                success: false,
                error: 'Invalid user role',
                message: 'Only users with supervisor role can be assigned to companies',
            });
        }
        // Check if supervisor is already assigned to this company
        if (supervisor.company_id === id) {
            return res.status(400).json({
                success: false,
                error: 'Already assigned',
                message: 'This supervisor is already assigned to this company',
            });
        }
        // Update supervisor's company_id
        const { error: updateError } = await supabase
            .from('users')
            .update({ company_id: id, updated_at: new Date().toISOString() })
            .eq('id', supervisor_id);
        if (updateError)
            throw updateError;
        console.log(`🔵 Supervisor ${supervisor.name} assigned to company ${company.name}`);
        res.json({
            success: true,
            message: `Supervisor ${supervisor.name} assigned to ${company.name} successfully`,
            data: {
                supervisor_id,
                company_id: id,
                supervisor_name: supervisor.name,
                company_name: company.name,
            },
        });
    }
    catch (error) {
        console.error('Assign supervisor to company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign supervisor',
            message: error.message,
        });
    }
}
/**
 * Remove a supervisor from a company
 * DELETE /admin/companies/:id/supervisors/:supervisor_id
 */
async function removeSupervisorFromCompany(req, res) {
    try {
        const { id, supervisor_id } = req.params;
        // Check if supervisor exists and belongs to this company
        const { data: supervisor, error: supervisorError } = await supabase
            .from('users')
            .select('id, name, email, company_id')
            .eq('id', supervisor_id)
            .eq('company_id', id)
            .single();
        if (supervisorError || !supervisor) {
            return res.status(404).json({
                success: false,
                error: 'Supervisor not found in this company',
            });
        }
        // Check if supervisor has active internships
        const { count: activeInternships, error: countError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('supervisor_id', supervisor_id)
            .in('status', ['active', 'ongoing']);
        if (!countError && activeInternships && activeInternships > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot remove supervisor',
                message: `This supervisor has ${activeInternships} active internship(s). Please reassign them first.`,
            });
        }
        // Remove supervisor from company (set company_id to null)
        const { error: updateError } = await supabase
            .from('users')
            .update({ company_id: null, updated_at: new Date().toISOString() })
            .eq('id', supervisor_id);
        if (updateError)
            throw updateError;
        console.log(`🔵 Supervisor ${supervisor.name} removed from company`);
        res.json({
            success: true,
            message: `Supervisor ${supervisor.name} removed from company successfully`,
        });
    }
    catch (error) {
        console.error('Remove supervisor from company error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove supervisor',
            message: error.message,
        });
    }
}
/**
 * Get all supervisors (optionally filter by unassigned)
 * GET /admin/companies/all-supervisors
 * Query params: unassigned (boolean) - if true, only return supervisors without a company
 */
async function getAllSupervisors(req, res) {
    try {
        const { unassigned } = req.query;
        let query = supabase
            .from('users')
            .select('id, name, email, company_id, status')
            .eq('role', 'supervisor')
            .or('is_archived.is.null,is_archived.eq.false');
        // Filter by unassigned if requested
        if (unassigned === 'true') {
            query = query.is('company_id', null);
        }
        const { data: supervisors, error } = await query.order('name', { ascending: true });
        if (error)
            throw error;
        res.json({
            success: true,
            data: { supervisors: supervisors || [] },
        });
    }
    catch (error) {
        console.error('Get all supervisors error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supervisors',
            message: error.message,
        });
    }
}
/**
 * Check company name availability and prefix similarities
 * GET /admin/companies/check-name?name=...&excludeId=...
 */
async function checkCompanyName(req, res) {
    try {
        const { name, excludeId } = req.query;
        const searchName = (name || '').trim();
        if (!searchName) {
            return res.json({
                success: true,
                data: {
                    isAvailable: true,
                    isExactMatch: false,
                    exactMatch: null,
                    similarCompanies: [],
                },
            });
        }
        // 1. Check exact match (case-insensitive)
        let exactQuery = supabase
            .from('companies')
            .select('id, name')
            .ilike('name', searchName);
        if (excludeId) {
            exactQuery = exactQuery.neq('id', excludeId);
        }
        const { data: exactMatches, error: exactError } = await exactQuery;
        if (exactError)
            throw exactError;
        const exactMatch = exactMatches && exactMatches.length > 0 ? exactMatches[0] : null;
        // 2. Check similar prefix/word match
        let similarQuery = supabase
            .from('companies')
            .select('id, name')
            .ilike('name', `${searchName}%`)
            .limit(6);
        if (excludeId) {
            similarQuery = similarQuery.neq('id', excludeId);
        }
        const { data: similarMatches, error: similarError } = await similarQuery;
        if (similarError)
            throw similarError;
        const filteredSimilar = (similarMatches || [])
            .filter((c) => c.name.trim().toLowerCase() !== searchName.toLowerCase())
            .map((c) => c.name);
        res.json({
            success: true,
            data: {
                isAvailable: !exactMatch,
                isExactMatch: !!exactMatch,
                exactMatch: exactMatch?.name || null,
                similarCompanies: filteredSimilar,
            },
        });
    }
    catch (error) {
        console.error('Check company name error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check company name',
            message: error.message,
        });
    }
}
/**
 * Get next incremental company code for a given prefix
 * GET /admin/companies/next-code?prefix=IT
 */
async function getNextCompanyCode(req, res) {
    try {
        const prefixParam = (req.query.prefix || 'OTH').toUpperCase().trim();
        // Clean prefix: alphanumeric only, max 6 chars
        const prefix = prefixParam.replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'OTH';
        const { data: companies, error } = await supabase
            .from('companies')
            .select('code');
        if (error)
            throw error;
        let maxNum = 0;
        const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
        (companies || []).forEach((c) => {
            if (!c.code)
                return;
            const match = c.code.trim().match(regex);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });
        const nextNum = maxNum + 1;
        const nextCode = `${prefix}-${String(nextNum).padStart(3, '0')}`;
        res.json({
            success: true,
            data: {
                prefix,
                nextCode,
                sequence: nextNum,
            },
        });
    }
    catch (error) {
        console.error('Get next company code error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate company code',
            message: error.message,
        });
    }
}
/**
 * Real-time website verification
 * POST /admin/companies/verify-website
 * Body: { url: string }
 */
async function verifyCompanyWebsite(req, res) {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string' || !url.trim()) {
            return res.json({
                success: true,
                data: {
                    verified: false,
                    message: 'No website URL provided',
                    normalizedUrl: '',
                },
            });
        }
        let normalizedUrl = url.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`;
        }
        // Validate URL syntax
        try {
            const parsed = new URL(normalizedUrl);
            if (!parsed.hostname || !parsed.hostname.includes('.')) {
                return res.json({
                    success: true,
                    data: {
                        verified: false,
                        message: 'Invalid domain name format',
                        normalizedUrl,
                    },
                });
            }
        }
        catch {
            return res.json({
                success: true,
                data: {
                    verified: false,
                    message: 'Invalid URL format',
                    normalizedUrl,
                },
            });
        }
        // Check connectivity via axios
        try {
            const response = await axios_1.default.get(normalizedUrl, {
                timeout: 5000,
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
                validateStatus: (status) => status < 400,
            });
            return res.json({
                success: true,
                data: {
                    verified: true,
                    statusCode: response.status,
                    normalizedUrl,
                    message: 'Website is verified and active',
                },
            });
        }
        catch (requestError) {
            // If HTTPS failed (e.g. SSL cert issue), attempt HTTP fallback
            if (normalizedUrl.startsWith('https://')) {
                try {
                    const httpUrl = normalizedUrl.replace(/^https:\/\//i, 'http://');
                    const httpResponse = await axios_1.default.get(httpUrl, {
                        timeout: 4000,
                        maxRedirects: 5,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        },
                        validateStatus: (status) => status < 400,
                    });
                    return res.json({
                        success: true,
                        data: {
                            verified: true,
                            statusCode: httpResponse.status,
                            normalizedUrl: httpUrl,
                            message: 'Website is verified and active',
                        },
                    });
                }
                catch {
                    // Fall through to unverified
                }
            }
            return res.json({
                success: true,
                data: {
                    verified: false,
                    normalizedUrl,
                    message: 'Website could not be reached or is invalid',
                    error: requestError.message,
                },
            });
        }
    }
    catch (error) {
        console.error('Verify company website error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify website',
            message: error.message,
        });
    }
}
//# sourceMappingURL=companiesController.js.map