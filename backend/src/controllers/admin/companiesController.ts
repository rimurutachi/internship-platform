import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Get all companies with pagination and filters
 * GET /admin/companies?page=1&limit=20&search=tech&is_verified=true
 */
export async function getCompanies(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const is_verified = req.query.is_verified as string;
    
    const offset = (page - 1) * limit;

    // Build base query for filtering
    let baseQuery = supabase.from('companies');
    
    // Apply filters for count
    let countQuery = baseQuery.select('*', { count: 'exact', head: true });
    
    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    if (is_verified === 'true') {
      countQuery = countQuery.eq('is_verified', true);
    } else if (is_verified === 'false') {
      countQuery = countQuery.eq('is_verified', false);
    }

    // Get total count
    const { count: total, error: countError } = await countQuery;

    if (countError) throw countError;

    // Build data query with same filters
    let dataQuery = supabase
      .from('companies')
      .select(
        `
          *,
          supervisors:users!company_id(
            id,
            email,
            name
          )
        `
      );

    // Apply same filters to data query
    if (search) {
      dataQuery = dataQuery.ilike('name', `%${search}%`);
    }

    if (is_verified === 'true') {
      dataQuery = dataQuery.eq('is_verified', true);
    } else if (is_verified === 'false') {
      dataQuery = dataQuery.eq('is_verified', false);
    }

    // Get paginated data
    const { data: companies, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Add supervisor count and active internships count
    const companiesWithCounts = await Promise.all(
      (companies || []).map(async (company) => {
        const { count: internshipCount, error: internshipError } = await supabase
          .from('internships')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('status', 'active');

        return {
          ...company,
          supervisor_count: company.supervisors?.length || 0,
          active_internships: internshipError ? 0 : (internshipCount || 0),
        };
      })
    );

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
  } catch (error: any) {
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
export async function getCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: company, error } = await supabase
      .from('companies')
      .select(
        `
          *,
          supervisors:users!company_id(
            id,
            email,
            name,
            status
          )
        `
      )
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
  } catch (error: any) {
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
export async function createCompany(req: Request, res: Response) {
  try {
    const {
      name,
      industry,
      address,
      contact_info,
      code,
      capacity_limit,
      is_verified,
      is_moa_standardized,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Company name is required',
      });
    }

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name,
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

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: company,
      message: 'Company created successfully',
    });
  } catch (error: any) {
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
export async function updateCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      industry,
      address,
      contact_info,
      code,
      capacity_limit,
      is_verified,
      is_moa_standardized,
    } = req.body;

    const updates: any = {};

    if (name !== undefined) updates.name = name;
    if (industry !== undefined) updates.industry = industry;
    if (address !== undefined) updates.address = address;
    if (contact_info !== undefined) updates.contact_info = contact_info;
    if (code !== undefined) updates.code = code;
    if (capacity_limit !== undefined) updates.capacity_limit = capacity_limit;
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (is_moa_standardized !== undefined) updates.is_moa_standardized = is_moa_standardized;

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
  } catch (error: any) {
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
export async function deleteCompany(req: Request, res: Response) {
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

    if (error) throw error;

    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error: any) {
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
export async function getCompanyStats(req: Request, res: Response) {
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

    // Total capacity
    const { data: capacityData, error: capacityError } = await supabase
      .from('companies')
      .select('capacity_limit');

    const total_capacity = capacityData?.reduce((sum, c) => sum + (c.capacity_limit || 0), 0) || 0;

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
  } catch (error: any) {
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
export async function getCompanySupervisors(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data: supervisors, error } = await supabase
      .from('users')
      .select('id, email, name, first_name, last_name, status')
      .eq('company_id', id)
      .eq('role', 'supervisor');

    if (error) throw error;

    res.json({
      success: true,
      data: supervisors || [],
    });
  } catch (error: any) {
    console.error('Get company supervisors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company supervisors',
      message: error.message,
    });
  }
}
