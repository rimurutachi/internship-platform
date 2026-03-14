/**
 * Supervisor Rubric API Client
 * 
 * API functions for fetching evaluation rubrics
 */

import { createSupabaseClient } from '@/lib/supabase';

/**
 * Evaluation Rubric Interface
 */
export interface EvaluationRubric {
  id: string;
  university_id: string;
  rubric_name: string;
  academic_year: string;
  description: string | null;
  criteria: RubricCriterion[];
  grading_scale: GradingScaleRange[];
  is_active: boolean;
  version: number;
  created_at: string;
}

/**
 * Rubric Criterion Interface
 */
export interface RubricCriterion {
  id: string;
  code?: string; // Legacy field, use id instead
  name: string;
  description: string;
  max_score: number;
  scale_descriptions?: {
    '1-2': string;
    '3-4': string;
    '5-6': string;
    '7-8': string;
    '9-10': string;
  };
  scale_descriptors?: Array<{
    range: string;
    label: string;
    description: string;
  }>;
}

/**
 * Grading Scale Range Interface
 */
export interface GradingScaleRange {
  min_score: number;
  max_score: number;
  grade: number;
}

/**
 * Get the active rubric for the supervisor's university
 * 
 * @returns The active evaluation rubric
 * @throws Error if no active rubric is found
 */
export async function getActiveRubric(): Promise<EvaluationRubric> {
  const supabase = createSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Get user's university_id
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', user.id)
    .single();

  if (userDataError || !userData) {
    throw new Error('Failed to fetch user data');
  }

  if (!userData.university_id) {
    throw new Error('Your account is not assigned to a university. Please contact your administrator to assign you to a university.');
  }

  // Fetch active rubric for the university
  const { data: rubric, error: rubricError } = await supabase
    .from('evaluation_rubrics')
    .select('*')
    .eq('university_id', userData.university_id)
    .eq('is_active', true)
    .single();

  if (rubricError || !rubric) {
    throw new Error('No active evaluation rubric found for your university. Please contact your administrator.');
  }

  return rubric as EvaluationRubric;
}

/**
 * Get all rubrics for the supervisor's university
 * 
 * @returns Array of evaluation rubrics
 */
export async function getRubrics(): Promise<EvaluationRubric[]> {
  const supabase = createSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Get user's university_id
  const { data: userData, error: userDataError } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', user.id)
    .single();

  if (userDataError || !userData) {
    throw new Error('Failed to fetch user data');
  }

  // Fetch all rubrics for the university
  const { data: rubrics, error: rubricsError } = await supabase
    .from('evaluation_rubrics')
    .select('*')
    .eq('university_id', userData.university_id)
    .order('created_at', { ascending: false });

  if (rubricsError) {
    throw new Error('Failed to fetch rubrics');
  }

  return (rubrics || []) as EvaluationRubric[];
}

/**
 * Get a specific rubric by ID
 * 
 * @param rubricId - The ID of the rubric to fetch
 * @returns The evaluation rubric
 * @throws Error if rubric is not found
 */
export async function getRubricById(rubricId: string): Promise<EvaluationRubric> {
  const supabase = createSupabaseClient();
  
  const { data: rubric, error } = await supabase
    .from('evaluation_rubrics')
    .select('*')
    .eq('id', rubricId)
    .single();

  if (error || !rubric) {
    throw new Error('Rubric not found');
  }

  return rubric as EvaluationRubric;
}