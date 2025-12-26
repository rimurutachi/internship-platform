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
    overall_rating?: number;
    skills_rating?: number;
    attitude_rating?: number;
    created_at: string;
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

    // Fetch latest evaluations per internship for this supervisor
    const internshipIds = list.map((i: any) => i.id);
    const { data: evaluations, error: evaluationsError } = await supabase
      .from('evaluations')
      .select('id, internship_id, rating_overall, rating_technical, rating_communication, rating_work_ethic, created_at, status')
      .in('internship_id', internshipIds)
      .eq('supervisor_id', supervisorId)
      .order('created_at', { ascending: false });

    if (evaluationsError) {
      throw new Error(evaluationsError.message);
    }

    const evalsByInternship: Record<string, any> = {};
    evaluations?.forEach((evaluation: any) => {
      if (!evalsByInternship[evaluation.internship_id]) {
        evalsByInternship[evaluation.internship_id] = evaluation;
      }
    });

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
              rating_overall: latestEval.rating_overall,
              rating_technical: latestEval.rating_technical,
              rating_communication: latestEval.rating_communication,
              rating_work_ethic: latestEval.rating_work_ethic,
              status: latestEval.status,
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
          rating_overall,
          rating_technical,
          rating_communication,
          rating_work_ethic,
          strengths,
          areas_for_improvement,
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
