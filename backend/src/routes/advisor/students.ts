import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

const router = Router();

/**
 * GET /api/advisor/assigned-students
 * Get ALL students pre-assigned to this advisor (via profile_data.assigned_advisor_id),
 * including those who do NOT yet have an internship record.
 * This is used by the advisor's My Students page to show the full roster.
 */
router.get('/assigned-students', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user?.id;
    if (!advisorId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // 1) Students with an internship assigned to this advisor (non-archived)
    const { data: internships } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        position,
        status,
        start_date,
        end_date,
        progress,
        company:companies(id, name),
        student:users!internships_student_id_fkey(
          id, email, first_name, last_name, profile_data, year_level
        )
      `)
      .eq('advisor_id', advisorId)
      .neq('is_archived', true);

    const internshipStudentIds = new Set(
      (internships || []).map((i: any) => i.student_id)
    );

    // 2) Students pre-assigned via profile_data.assigned_advisor_id but without internship
    // Supabase can't filter JSONB directly, so fetch all students and filter in-memory
    const { data: allStudents } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, profile_data, year_level')
      .eq('role', 'student')
      .eq('status', 'active');

    const preAssigned = (allStudents || []).filter(
      (s: any) =>
        s.profile_data?.assigned_advisor_id === advisorId &&
        !internshipStudentIds.has(s.id)
    );

    // Build unified list
    const studentsFromInternships = (internships || []).map((internship: any) => {
      const s = Array.isArray(internship.student) ? internship.student[0] : internship.student;
      const company = Array.isArray(internship.company) ? internship.company[0] : internship.company;
      return {
        id: s?.id,
        name: `${s?.first_name || ''} ${s?.last_name || ''}`.trim() || 'Unknown',
        email: s?.email,
        program: s?.profile_data?.program || s?.profile_data?.course || s?.profile_data?.department || 'N/A',
        year_level: s?.year_level || s?.profile_data?.year_level || 'N/A',
        section: s?.profile_data?.section || 'N/A',
        internship: {
          id: internship.id,
          company: company?.name || 'N/A',
          position: internship.position,
          status: internship.status,
          startDate: internship.start_date,
          endDate: internship.end_date,
          progress: internship.progress || 0,
        },
      };
    });

    const studentsPreAssigned = preAssigned.map((s: any) => ({
      id: s.id,
      name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Unknown',
      email: s.email,
      program: s.profile_data?.program || s.profile_data?.course || s.profile_data?.department || 'N/A',
      year_level: s.year_level || s.profile_data?.year_level || 'N/A',
      section: s.profile_data?.section || 'N/A',
      internship: null, // no internship yet
    }));

    const allResult = [...studentsFromInternships, ...studentsPreAssigned];

    return res.status(200).json({
      success: true,
      data: allResult,
      count: allResult.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/advisor/assigned-students:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});


/**
 * GET /api/advisor/students
 * Get all students assigned to this advisor
 */
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user?.id;

    console.log('🔍 [Advisor Students] Request from user:', {
      userId: advisorId,
      userEmail: req.user?.email,
      userRole: req.user?.role,
    });

    if (!advisorId) {
      console.log('❌ [Advisor Students] No advisor ID found');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get all internships for this advisor with student details
    // Exclude archived internships (is_archived = true)
    const { data: internships, error } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        position,
        status,
        start_date,
        end_date,
        progress,
        is_archived,
        company:companies(id, name),
        student:users!internships_student_id_fkey(
          id,
          email,
          first_name,
          last_name,
          profile_data
        )
      `)
      .eq('advisor_id', advisorId)
      .neq('is_archived', true)
      .order('created_at', { ascending: false });

    console.log('📊 [Advisor Students] Query result:', {
      advisorId,
      internshipsCount: internships?.length || 0,
      error: error?.message,
    });

    if (error) {
      console.error('❌ [Advisor Students] Error fetching:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch students',
        message: error.message,
      });
    }

    // Get evaluations for these students to calculate performance
    const studentIds = internships?.map((i: any) => i.student_id) || [];
    
    let evaluationsMap: Record<string, any[]> = {};
    if (studentIds.length > 0) {
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('student_id, overall_rating, technical_skills, communication_skills, work_ethic, created_at')
        .in('student_id', studentIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      // Group evaluations by student_id
      if (evaluations) {
        evaluations.forEach((evaluation: any) => {
          if (!evaluationsMap[evaluation.student_id]) {
            evaluationsMap[evaluation.student_id] = [];
          }
          evaluationsMap[evaluation.student_id].push(evaluation);
        });
      }
    }

    // Transform data to match frontend interface
    const students = internships?.map((internship: any) => {
      const studentEvals = evaluationsMap[internship.student_id] || [];
      const latestEval = studentEvals[0];

      // Calculate average performance from all evaluations
      const avgPerformance = studentEvals.length > 0
        ? {
            overall: studentEvals.reduce((sum: number, e: any) => sum + (e.overall_rating || 0), 0) / studentEvals.length,
            technical: studentEvals.reduce((sum: number, e: any) => sum + (e.technical_skills || 0), 0) / studentEvals.length,
            communication: studentEvals.reduce((sum: number, e: any) => sum + (e.communication_skills || 0), 0) / studentEvals.length,
            workEthic: studentEvals.reduce((sum: number, e: any) => sum + (e.work_ethic || 0), 0) / studentEvals.length,
          }
        : {
            overall: 0,
            technical: 0,
            communication: 0,
            workEthic: 0,
          };

      return {
        id: internship.student?.id,
        name: `${internship.student?.first_name || ''} ${internship.student?.last_name || ''}`.trim() || 'Unknown',
        email: internship.student?.email,
        program: internship.student?.profile_data?.department || internship.student?.profile_data?.course || 'N/A',
        year: internship.student?.profile_data?.year_level || 'N/A',
        internship: {
          id: internship.id,
          company: internship.company?.name || 'N/A',
          position: internship.position,
          status: internship.status,
          startDate: internship.start_date,
          endDate: internship.end_date,
          progress: internship.progress || 0,
        },
        performance: avgPerformance,
        lastEvaluation: latestEval?.created_at || null,
        evaluationCount: studentEvals.length,
      };
    }) || [];

    return res.status(200).json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/advisor/students:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/advisor/students/:studentId
 * Get detailed information about a specific student
 */
router.get('/students/:studentId', async (req: AuthRequest, res: Response) => {
  try {
    const advisorId = req.user?.id;
    const { studentId } = req.params;

    console.log('🔍 [Student Details] Request:', {
      advisorId,
      studentId,
    });

    if (!advisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Verify that this student is assigned to this advisor
    // Only show non-archived internships
    const { data: internships, error: internshipError } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        position,
        status,
        start_date,
        end_date,
        progress,
        is_archived,
        company:companies(id, name),
        student:users!internships_student_id_fkey(
          id,
          email,
          first_name,
          last_name,
          profile_data,
          created_at
        )
      `)
      .eq('advisor_id', advisorId)
      .eq('student_id', studentId)
      .neq('is_archived', true)
      .limit(1)
      .single();

    console.log('📊 [Student Details] Query result:', {
      found: !!internships,
      error: internshipError?.message,
      isArchived: internships?.is_archived,
    });

    const internship = internships;

    if (internshipError || !internship) {
      console.log('❌ [Student Details] Not found or error');
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you',
      });
    }

    // Get all evaluations for this student
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    // Get daily reports progress for this student
    const { data: reports } = await supabase
      .from('student_daily_reports')
      .select('id, report_date, hours_worked')
      .eq('student_id', studentId)
      .order('report_date', { ascending: false })
      .limit(10);

    // Calculate performance metrics
    const approvedEvals = evaluations?.filter((e: any) => e.status === 'approved') || [];
    const avgPerformance = approvedEvals.length > 0
      ? {
          overall: approvedEvals.reduce((sum: number, e: any) => sum + (e.overall_rating || 0), 0) / approvedEvals.length,
          technical: approvedEvals.reduce((sum: number, e: any) => sum + (e.technical_skills || 0), 0) / approvedEvals.length,
          communication: approvedEvals.reduce((sum: number, e: any) => sum + (e.communication_skills || 0), 0) / approvedEvals.length,
          workEthic: approvedEvals.reduce((sum: number, e: any) => sum + (e.work_ethic || 0), 0) / approvedEvals.length,
        }
      : null;

    // Extract student and company data (Supabase returns them as single-item arrays for joins)
    const student = Array.isArray(internship.student) ? internship.student[0] : internship.student;
    const company = Array.isArray(internship.company) ? internship.company[0] : internship.company;

    const studentData = {
      id: student?.id,
      name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
      email: student?.email,
      program: student?.profile_data?.department || student?.profile_data?.course,
      year: student?.profile_data?.year_level,
      student_id: student?.profile_data?.student_id,
      joined: student?.created_at,
      internship: {
        id: internship.id,
        company: company?.name,
        position: internship.position,
        status: internship.status,
        startDate: internship.start_date,
        endDate: internship.end_date,
        progress: internship.progress || 0,
      },
      performance: avgPerformance,
      evaluations: evaluations || [],
      recentReports: reports || [],
    };

    return res.status(200).json({
      success: true,
      data: studentData,
    });
  } catch (error: any) {
    console.error('Error in GET /api/advisor/students/:studentId:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
