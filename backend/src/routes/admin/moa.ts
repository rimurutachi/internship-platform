import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const router = Router();

/** Extract program from user profile_data, handling field name variations */
function getUserProgram(profileData: any): string {
  return profileData?.program || profileData?.course || profileData?.department || 'Unassigned';
}

/**
 * GET /api/admin/moa/submissions
 * Get all approved MOA submissions from document requirements, with student info
 * Query: program, year_level, section, search, page, limit
 */
router.get('/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const { program, year_level, section, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // 1. Get all MOA-related requirements
    const { data: moaRequirements, error: reqError } = await supabase
      .from('document_requirements')
      .select('id, title')
      .or('title.ilike.%MOA%,title.ilike.%memorandum%,title.ilike.%agreement%');

    if (reqError) {
      console.error('Error fetching MOA requirements:', reqError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch MOA requirements',
        message: reqError.message,
      });
    }

    const requirementIds = (moaRequirements || []).map(r => r.id);

    if (requirementIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        requirements: [],
        pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
      });
    }

    // 2. Fetch approved submissions — no embedded join to avoid column issues
    const { data: rawSubmissions, error: subError } = await supabase
      .from('document_submissions')
      .select('id, requirement_id, student_id, file_url, file_name, file_size, mime_type, version, status, feedback, reviewed_at, submitted_at, created_at')
      .eq('status', 'approved')
      .in('requirement_id', requirementIds)
      .order('submitted_at', { ascending: false });

    if (subError) {
      console.error('Error fetching MOA submissions:', subError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch MOA submissions',
        message: subError.message,
      });
    }

    // 3. Fetch student user data in a separate query
    //    (program/section live in profile_data jsonb, not direct columns)
    const studentIds = [...new Set((rawSubmissions || []).map((s: any) => s.student_id))];
    const studentMap: Record<string, any> = {};

    if (studentIds.length > 0) {
      const { data: students, error: studentError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, name, profile_data, year_level')
        .in('id', studentIds);

      if (studentError) {
        console.error('Error fetching student users (non-fatal):', studentError);
      } else {
        (students || []).forEach((s: any) => { studentMap[s.id] = s; });
      }
    }

    // 4. Enrich submissions with requirement title and student fields
    const requirementMap = new Map(
      (moaRequirements || []).map(r => [r.id, r.title])
    );

    let enrichedSubmissions = (rawSubmissions || []).map((sub: any) => {
      const student = studentMap[sub.student_id] || null;
      const pd = student?.profile_data || {};
      return {
        ...sub,
        requirement_title: requirementMap.get(sub.requirement_id) || 'Unknown',
        student_program: getUserProgram(pd),
        student_year_level: student?.year_level || pd?.year_level || 'Unknown',
        student_section: pd?.section || 'Unknown',
        student_name: student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Unknown',
        student: student ? { id: student.id, first_name: student.first_name, last_name: student.last_name, email: student.email } : null,
      };
    });

    // Apply filters on enriched data
    if (program && program !== 'all') {
      enrichedSubmissions = enrichedSubmissions.filter(
        (s: any) => s.student_program === program
      );
    }
    if (year_level && year_level !== 'all') {
      enrichedSubmissions = enrichedSubmissions.filter(
        (s: any) => s.student_year_level === year_level
      );
    }
    if (section && section !== 'all') {
      enrichedSubmissions = enrichedSubmissions.filter(
        (s: any) => s.student_section === section
      );
    }
    if (search) {
      const searchLower = (search as string).toLowerCase();
      enrichedSubmissions = enrichedSubmissions.filter(
        (s: any) =>
          s.student_name.toLowerCase().includes(searchLower) ||
          s.file_name.toLowerCase().includes(searchLower) ||
          s.requirement_title.toLowerCase().includes(searchLower)
      );
    }

    const totalFiltered = enrichedSubmissions.length;
    const paginatedSubmissions = enrichedSubmissions.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      data: paginatedSubmissions,
      requirements: moaRequirements,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalFiltered / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Admin MOA submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/moa/stats
 * Get MOA statistics overview
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Get MOA requirement IDs
    const { data: moaRequirements } = await supabase
      .from('document_requirements')
      .select('id, title')
      .or('title.ilike.%MOA%,title.ilike.%memorandum%,title.ilike.%agreement%');

    const requirementIds = (moaRequirements || []).map(r => r.id);

    if (requirementIds.length === 0) {
      return res.json({
        success: true,
        data: {
          total_requirements: 0,
          total_approved: 0,
          total_pending: 0,
          total_rejected: 0,
          by_program: {},
        },
      });
    }

    // Get all submissions for MOA requirements (no embedded join)
    const { data: allSubmissions } = await supabase
      .from('document_submissions')
      .select('id, status, student_id')
      .in('requirement_id', requirementIds);

    const submissions = allSubmissions || [];
    const approved = submissions.filter((s: any) => s.status === 'approved');
    const pending = submissions.filter((s: any) => s.status === 'pending');
    const rejected = submissions.filter((s: any) => s.status === 'rejected');

    // Fetch student profile_data for approved submissions to group by program
    const approvedStudentIds = [...new Set(approved.map((s: any) => s.student_id))];
    const byProgram: Record<string, number> = {};

    if (approvedStudentIds.length > 0) {
      const { data: students } = await supabase
        .from('users')
        .select('id, profile_data')
        .in('id', approvedStudentIds);

      const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]));
      approved.forEach((s: any) => {
        const prog = getUserProgram(studentMap[s.student_id]?.profile_data);
        byProgram[prog] = (byProgram[prog] || 0) + 1;
      });
    }

    return res.json({
      success: true,
      data: {
        total_requirements: requirementIds.length,
        total_approved: approved.length,
        total_pending: pending.length,
        total_rejected: rejected.length,
        by_program: byProgram,
      },
    });
  } catch (error: any) {
    console.error('Admin MOA stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/admin/moa/submissions/:id/signed-url
 * Generate a signed URL for an MOA submission file (uses service key, bypasses RLS)
 */
router.get('/submissions/:id/signed-url', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: submission, error: fetchError } = await supabase
      .from('document_submissions')
      .select('id, file_url, student_id, requirement_id')
      .eq('id', id)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    const fileUrl = (submission as any).file_url as string;

    // Build path variations to try (same logic as documentSubmissionsService)
    const pathsToTry: string[] = [];

    let basePath = fileUrl;
    if (fileUrl.startsWith('http')) {
      try {
        const url = new URL(fileUrl);
        const pathMatch = url.pathname.match(/\/(?:object\/(?:public|sign)\/)?documents\/(.+)$/);
        if (pathMatch) basePath = pathMatch[1];
      } catch { /* keep as-is */ }
    }

    try { basePath = decodeURIComponent(basePath); } catch { /* keep as-is */ }

    pathsToTry.push(basePath);

    if (basePath.startsWith('document-submissions/')) {
      const withoutPrefix = basePath.replace('document-submissions/', '');
      pathsToTry.push(withoutPrefix);
      const parts = withoutPrefix.split('/');
      if (parts.length >= 3) {
        pathsToTry.push([parts[1], parts[0], ...parts.slice(2)].join('/'));
      }
    }

    // Try using submission metadata paths
    const fileName = fileUrl.split('/').pop() || '';
    const studentId = (submission as any).student_id;
    const requirementId = (submission as any).requirement_id;
    if (fileName && studentId && requirementId) {
      pathsToTry.push(`${studentId}/${requirementId}/${fileName}`);
      pathsToTry.push(`${requirementId}/${studentId}/${fileName}`);
    }

    const uniquePaths = [...new Set(pathsToTry)];
    console.log(`🔎 Admin signed-url for submission ${id}: trying ${uniquePaths.length} path(s)`);

    for (const pathToTry of uniquePaths) {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(pathToTry, 3600);

      if (!error && data) {
        console.log(`✅ Admin signed-url generated for submission ${id}`);
        return res.json({ success: true, data: { signedUrl: data.signedUrl, expiresIn: 3600 } });
      }
    }

    return res.status(404).json({
      success: false,
      error: 'Could not generate signed URL: file not found in storage',
    });
  } catch (error: any) {
    console.error('Error generating admin MOA signed URL:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
