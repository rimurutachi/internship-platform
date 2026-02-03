/**
 * Supervisor Student Service
 * 
 * Handles operations for supervisors to manage their assigned student interns
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface SupervisorStudent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  university?: string;
  program?: string;
  internship: {
    id: string;
    position?: string;
    department?: string;
    start_date?: string;
    end_date?: string;
    status: string;
    progress?: number;
    company: {
      id: string;
      name: string;
    };
  } | null;
  latest_evaluation?: {
    id: string;
    created_at: string;
    total_score?: number;
    final_grade?: number;
    attendance?: string;
    punctuality?: string;
    rubric_id?: string;
    status?: string;
    supervisor_comments?: string;
    criterion_scores?: Array<{
      criterion_code: string;
      criterion_name: string;
      score: number;
    }>;
    // Legacy fields for backward compatibility
    overall_rating?: number;
    skills_rating?: number;
    attitude_rating?: number;
  } | null;
}

export class SupervisorStudentService {
  /**
   * Get all students assigned to a supervisor
   */
  async getMyStudents(supervisorId: string): Promise<SupervisorStudent[]> {
    // Primary: internships assigned to this supervisor (exclude archived) with joined student
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select(`
        id,
        student_id,
        position,
        department,
        start_date,
        end_date,
        status,
        progress,
        is_archived,
        company:companies(id, name, industry),
        student:users!internships_student_id_fkey(
          id,
          email,
          first_name,
          last_name,
          profile_data
        )
      `)
      .eq('supervisor_id', supervisorId)
      .neq('is_archived', true)
      .order('created_at', { ascending: false });

    if (internshipsError) {
      throw new Error(internshipsError.message);
    }

    let list = internships || [];

    // Fallback: If none directly assigned, try by supervisor's company_id
    if (!list || list.length === 0) {
      const { data: supervisorProfile } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', supervisorId)
        .single();

      if (supervisorProfile?.company_id) {
        const { data: companyInternships } = await supabase
          .from('internships')
          .select(`
            id,
            student_id,
            position,
            department,
            start_date,
            end_date,
            status,
            progress,
            is_archived,
            company:companies(id, name, industry),
            student:users!internships_student_id_fkey(
              id,
              email,
              first_name,
              last_name,
              profile_data
            )
          `)
          .eq('company_id', supervisorProfile.company_id)
          .neq('is_archived', true)
          .order('created_at', { ascending: false });

        if (companyInternships && companyInternships.length > 0) {
          list = companyInternships;
        }
      }
    }

    if (!list || list.length === 0) {
      return [];
    }

    // Fetch latest evaluations per internship for this supervisor (include criterion scores)
    const internshipIds = list.map((i: any) => i.id);
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('evaluations')
      .select(`
        id, 
        internship_id, 
        total_score, 
        final_grade, 
        attendance, 
        punctuality, 
        rubric_id, 
        supervisor_comments,
        created_at, 
        status,
        evaluation_criterion_scores(criterion_code, criterion_name, score)
      `)
      .in('internship_id', internshipIds)
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false });

    if (evaluationsError) {
      throw new Error(evaluationsError.message);
    }

    console.log('🔍 Fetched evaluations for supervisor:', {
      supervisorId,
      internshipIds,
      totalEvaluations: evaluations?.length || 0,
      evaluations: evaluations?.map(e => ({
        id: e.id,
        internship_id: e.internship_id,
        status: e.status,
        created_at: e.created_at,
        has_criterion_scores: e.evaluation_criterion_scores?.length || 0
      }))
    });

    const evalsByInternship: Record<string, any> = {};
    evaluations?.forEach((evaluation: any) => {
      if (!evalsByInternship[evaluation.internship_id]) {
        evalsByInternship[evaluation.internship_id] = evaluation;
      }
    });
    
    console.log('📊 Evaluations by internship:', Object.entries(evalsByInternship).map(([internship_id, evalData]) => ({
      internship_id,
      evaluation_id: evalData.id,
      status: evalData.status,
      criterion_scores_count: evalData.evaluation_criterion_scores?.length || 0
    })));

    const result: SupervisorStudent[] = list.map((internship: any) => {
      const student = Array.isArray(internship.student) ? internship.student[0] : internship.student;
      const latestEval = evalsByInternship[internship.id];
      const company = Array.isArray(internship.company) ? internship.company[0] : internship.company;

      return {
        id: student?.id,
        first_name: student?.first_name,
        last_name: student?.last_name,
        email: student?.email,
        university: student?.profile_data?.university || 'Cavite State University - Bacoor City Campus',
        program: student?.profile_data?.program || student?.profile_data?.department,
        internship: {
          id: internship.id,
          position: internship.position,
          department: internship.department,
          start_date: internship.start_date,
          end_date: internship.end_date,
          status: internship.status,
          progress: internship.progress,
          company: company,
        },
        latest_evaluation: latestEval
          ? {
              id: latestEval.id,
              created_at: latestEval.created_at,
              total_score: latestEval.total_score,
              final_grade: latestEval.final_grade,
              attendance: latestEval.attendance,
              punctuality: latestEval.punctuality,
              rubric_id: latestEval.rubric_id,
              status: latestEval.status,
              supervisor_comments: latestEval.supervisor_comments,
              criterion_scores: latestEval.evaluation_criterion_scores || [],
            }
          : null,
      } as SupervisorStudent;
    });

    return result;
  }

  /**
   * Get detailed information about a specific student
   */
  async getStudentDetails(supervisorId: string, studentId: string): Promise<any> {
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, university_id, profile_data')
      .eq('id', studentId)
      .single();

    if (studentError) {
      throw new Error(studentError.message);
    }

    // Get all internships for this student where supervisor is assigned
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select(`
        id,
        position,
        department,
        start_date,
        end_date,
        status,
        progress,
        company:companies(id, name, industry)
      `)
      .eq('student_id', studentId)
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false });

    if (internshipsError) {
      throw new Error(internshipsError.message);
    }

    // Get evaluations for these internships
    const internshipIds = internships?.map(i => i.id) || [];
    let evaluations: any[] = [];
    
    if (internshipIds.length > 0) {
      const { data: evals, error: evalsError } = await supabase
        .from('evaluations')
        .select(`
          id,
          internship_id,
          total_score,
          final_grade,
          attendance,
          punctuality,
          rubric_id,
          status,
          created_at
        `)
        .in('internship_id', internshipIds)
        .eq('supervisor_id', supervisorId)
        .order('created_at', { ascending: false });

      if (!evalsError) {
        evaluations = evals || [];
      }
    }

    return {
      ...student,
      university: student?.profile_data?.university || 'Cavite State University - Bacoor City Campus',
      program: student?.profile_data?.program || student?.profile_data?.department,
      internships: internships || [],
      evaluations,
    };
  }
}

export default new SupervisorStudentService();
