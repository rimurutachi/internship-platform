/**
 * Internships Service - Validation & Business Logic
 * 
 * Handles validation of internship constraints, activity logging, and business rules.
 * Use InternshipServiceFacade (internship.service.ts) for a unified API.
 * 
 * @deprecated Consider using InternshipServiceFacade for new code
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export class InternshipsService {
  /**
   * Validate internship assignment constraints
   * Checks:
   * - Student doesn't have active internship
   * - Student is actually a student role
   * - Advisor is from same university as student
   * - Advisor has advisor role
   * - Supervisor belongs to selected company
   * - Supervisor has supervisor role
   */
  async validateInternshipAssignment(
    student_id: string,
    company_id: string,
    advisor_id: string,
    supervisor_id: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check student doesn't have active internship
      const { data: activeInternship } = await supabase
        .from('internships')
        .select('id')
        .eq('student_id', student_id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeInternship) {
        errors.push('Student already has an active internship');
      }

      // Check student exists and is a student
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id, university_id, role')
        .eq('id', student_id)
        .single();

      if (studentError || !student) {
        errors.push('Student not found');
        return { valid: false, errors };
      }

      if (student.role !== 'student') {
        errors.push('Selected user is not a student');
      }

      // Check advisor exists and is from student's university
      const { data: advisor, error: advisorError } = await supabase
        .from('users')
        .select('id, university_id, role')
        .eq('id', advisor_id)
        .single();

      if (advisorError || !advisor) {
        errors.push('Advisor not found');
        return { valid: false, errors };
      }

      if (advisor.role !== 'advisor') {
        errors.push('Selected advisor is not an advisor');
      }

      if (advisor.university_id !== student.university_id) {
        errors.push('Advisor must be from same university as student');
      }

      // Check supervisor exists and belongs to company
      const { data: supervisor, error: supervisorError } = await supabase
        .from('users')
        .select('id, company_id, role')
        .eq('id', supervisor_id)
        .single();

      if (supervisorError || !supervisor) {
        errors.push('Supervisor not found');
        return { valid: false, errors };
      }

      if (supervisor.role !== 'supervisor') {
        errors.push('Selected supervisor is not a supervisor');
      }

      if (supervisor.company_id !== company_id) {
        errors.push('Supervisor must belong to selected company');
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      console.error('Error validating internship assignment:', error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Validate internship update constraints
   * Similar to create but allows skipping unchanged fields
   */
  async validateInternshipUpdate(
    internship_id: string,
    advisor_id?: string,
    supervisor_id?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Get current internship
      const { data: currentInternship, error: fetchError } = await supabase
        .from('internships')
        .select('student_id, company_id, advisor_id, supervisor_id')
        .eq('id', internship_id)
        .single();

      if (fetchError || !currentInternship) {
        errors.push('Internship not found');
        return { valid: false, errors };
      }

      // Get student's university
      const { data: student } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', currentInternship.student_id)
        .single();

      // Validate new advisor if provided
      if (advisor_id && advisor_id !== currentInternship.advisor_id) {
        const { data: advisor, error: advisorError } = await supabase
          .from('users')
          .select('university_id, role')
          .eq('id', advisor_id)
          .single();

        if (advisorError || !advisor) {
          errors.push('New advisor not found');
        } else {
          if (advisor.role !== 'advisor') {
            errors.push('New advisor is not an advisor');
          }

          if (student && advisor.university_id !== student.university_id) {
            errors.push('New advisor must be from same university as student');
          }
        }
      }

      // Validate new supervisor if provided
      if (supervisor_id && supervisor_id !== currentInternship.supervisor_id) {
        const { data: supervisor, error: supervisorError } = await supabase
          .from('users')
          .select('company_id, role')
          .eq('id', supervisor_id)
          .single();

        if (supervisorError || !supervisor) {
          errors.push('New supervisor not found');
        } else {
          if (supervisor.role !== 'supervisor') {
            errors.push('New supervisor is not a supervisor');
          }

          if (supervisor.company_id !== currentInternship.company_id) {
            errors.push('New supervisor must belong to same company');
          }
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      console.error('Error validating internship update:', error);
      return { valid: false, errors: ['Validation error occurred'] };
    }
  }

  /**
   * Format internship for display with calculated fields
   */
  formatInternship(internship: any) {
    const startDate = new Date(internship.start_date);
    const endDate = new Date(internship.end_date);
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...internship,
      display_name: `${internship.student?.name || 'Unknown'} - ${internship.position}`,
      duration_days: durationDays,
    };
  }

  /**
   * Build query filters for internships list
   */
  buildInternshipsQuery(filters: {
    status?: string;
    university_id?: string;
    company_id?: string;
    search?: string;
  }) {
    let query = supabase
      .from('internships')
      .select(
        `
        *,
        student:users!internships_student_id_fkey(id, name, email, university_id),
        advisor:users!internships_advisor_id_fkey(id, name, email, university_id),
        supervisor:users!internships_supervisor_id_fkey(id, name, email, company_id),
        company:companies(id, name, industry)
      `,
        { count: 'exact' }
      );

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    return query;
  }

  /**
   * Log internship activity to audit trail
   */
  async logActivity(
    user_id: string,
    action: string,
    internship_id: string,
    description: string,
    metadata?: Record<string, any>
  ) {
    try {
      await supabase.from('activity_log').insert({
        user_id,
        action,
        entity_type: 'internship',
        entity_id: internship_id,
        internship_id,
        description,
        metadata,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Calculate field changes for audit log
   */
  calculateChanges(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const [key, value] of Object.entries(newData)) {
      if (value !== oldData[key] && value !== undefined) {
        changes[key] = { from: oldData[key], to: value };
      }
    }

    return changes;
  }
}

export const internshipsService = new InternshipsService();
