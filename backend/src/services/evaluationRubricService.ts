/**
 * Evaluation Rubric Service
 * 
 * Handles fetching evaluation rubrics for supervisor evaluation forms
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface EvaluationRubric {
  id: string;
  university_id: string;
  academic_year: string;
  rubric_name: string;
  criteria: any; // jsonb field
  grading_scale: any; // jsonb field
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export class EvaluationRubricService {
  /**
   * Get the active rubric for a university
   */
  async getActiveRubric(universityId: string): Promise<EvaluationRubric | null> {
    const { data, error } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('university_id', universityId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active rubric found
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get all rubrics for a university
   */
  async getRubricsByUniversity(universityId: string): Promise<EvaluationRubric[]> {
    const { data, error } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get a specific rubric by ID
   */
  async getRubricById(rubricId: string): Promise<EvaluationRubric | null> {
    const { data, error } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }
}

export default new EvaluationRubricService();
