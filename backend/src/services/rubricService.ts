import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface RubricCriterion {
  code: string; // A, B, C, D, E, F, G
  name: string; // Quality of Work, Attitude Toward Work, etc.
  description: string;
  scale_descriptions: {
    '1-2': string; // Poor
    '3-4': string; // Fairly Satisfactory
    '5-6': string; // Satisfactory
    '7-8': string; // Very Good
    '9-10': string; // Outstanding
  };
  max_score: number; // 10
}

export interface GradingScale {
  min_score: number;
  max_score: number;
  grade: number;
}

export interface RubricData {
  university_id: string;
  academic_year: string;
  rubric_name: string;
  criteria: RubricCriterion[];
  grading_scale: GradingScale[];
  description?: string;
}

/**
 * Get active rubric for a university
 */
export async function getActiveRubric(universityId: string) {
  try {
    const { data: rubric, error } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('university_id', universityId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch active rubric: ${error.message}`);
    }

    if (!rubric) {
      // Return default CvSU rubric if none exists
      return {
        success: true,
        data: getDefaultCvSURubric(universityId),
        isDefault: true,
      };
    }

    return {
      success: true,
      data: rubric,
      isDefault: false,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get rubric by ID
 */
export async function getRubricById(rubricId: string) {
  try {
    const { data: rubric, error } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (error || !rubric) {
      throw new Error('Rubric not found');
    }

    return {
      success: true,
      data: rubric,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all rubrics for a university
 */
export async function getAllRubrics(
  universityId: string,
  includeInactive: boolean = false
) {
  try {
    let query = supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('university_id', universityId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: rubrics, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch rubrics: ${error.message}`);
    }

    return {
      success: true,
      data: rubrics || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create new rubric
 */
export async function createRubric(
  rubricData: RubricData,
  createdBy: string
) {
  try {
    const { university_id, academic_year, rubric_name, criteria, grading_scale, description } = rubricData;

    // Validate criteria
    if (!criteria || criteria.length !== 7) {
      throw new Error('Rubric must have exactly 7 criteria (A-G)');
    }

    // Validate each criterion has required fields
    const requiredCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    for (const code of requiredCodes) {
      const criterion = criteria.find(c => c.code === code);
      if (!criterion) {
        throw new Error(`Missing criterion ${code}`);
      }
      if (!criterion.name || !criterion.scale_descriptions) {
        throw new Error(`Criterion ${code} is incomplete`);
      }
    }

    // Validate grading scale
    if (!grading_scale || grading_scale.length === 0) {
      throw new Error('Grading scale is required');
    }

    // Check if rubric already exists for this year
    const { data: existing } = await supabase
      .from('evaluation_rubrics')
      .select('id')
      .eq('university_id', university_id)
      .eq('academic_year', academic_year)
      .single();

    if (existing) {
      throw new Error(`Rubric for academic year ${academic_year} already exists`);
    }

    // Deactivate all other rubrics for this university
    await supabase
      .from('evaluation_rubrics')
      .update({ is_active: false })
      .eq('university_id', university_id);

    // Create new rubric
    const { data: newRubric, error: createError } = await supabase
      .from('evaluation_rubrics')
      .insert({
        university_id,
        academic_year,
        rubric_name,
        criteria,
        grading_scale,
        description: description || null,
        is_active: true,
        created_by: createdBy,
        version: 1,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create rubric: ${createError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: createdBy,
      action: 'rubric_created',
      entity_type: 'evaluation_rubric',
      entity_id: newRubric.id,
      details: {
        rubric_name,
        academic_year,
        criteria_count: criteria.length,
      },
    });

    return {
      success: true,
      data: newRubric,
      message: 'Rubric created successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update rubric (creates new version in history)
 */
export async function updateRubric(
  rubricId: string,
  updates: Partial<RubricData>,
  changedBy: string,
  changeReason: string
) {
  try {
    if (!changeReason || changeReason.trim().length < 10) {
      throw new Error('Change reason must be at least 10 characters');
    }

    // Get current rubric
    const { data: currentRubric, error: fetchError } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (fetchError || !currentRubric) {
      throw new Error('Rubric not found');
    }

    // Save current version to history
    await supabase.from('evaluation_rubric_history').insert({
      rubric_id: rubricId,
      version: currentRubric.version,
      criteria: currentRubric.criteria,
      grading_scale: currentRubric.grading_scale,
      rubric_name: currentRubric.rubric_name,
      description: currentRubric.description,
      changed_by: changedBy,
      change_reason: changeReason.trim(),
      changed_at: new Date().toISOString(),
    });

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      version: currentRubric.version + 1,
    };

    if (updates.criteria) {
      // Validate criteria
      if (updates.criteria.length !== 7) {
        throw new Error('Rubric must have exactly 7 criteria');
      }
      updateData.criteria = updates.criteria;
    }

    if (updates.grading_scale) {
      updateData.grading_scale = updates.grading_scale;
    }

    if (updates.rubric_name) {
      updateData.rubric_name = updates.rubric_name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    // Update rubric
    const { data: updatedRubric, error: updateError } = await supabase
      .from('evaluation_rubrics')
      .update(updateData)
      .eq('id', rubricId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update rubric: ${updateError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: changedBy,
      action: 'rubric_updated',
      entity_type: 'evaluation_rubric',
      entity_id: rubricId,
      details: {
        version: updateData.version,
        change_reason: changeReason,
        changes: Object.keys(updateData).filter(k => k !== 'updated_at' && k !== 'version'),
      },
    });

    return {
      success: true,
      data: updatedRubric,
      message: `Rubric updated successfully. Version ${updateData.version} created.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get rubric version history
 */
export async function getRubricHistory(rubricId: string) {
  try {
    const { data: history, error } = await supabase
      .from('evaluation_rubric_history')
      .select(`
        *,
        changer:users!changed_by(first_name, last_name)
      `)
      .eq('rubric_id', rubricId)
      .order('version', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch rubric history: ${error.message}`);
    }

    return {
      success: true,
      data: history || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deactivate rubric
 */
export async function deactivateRubric(
  rubricId: string,
  deactivatedBy: string,
  reason?: string
) {
  try {
    // Get rubric
    const { data: rubric, error: fetchError } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (fetchError || !rubric) {
      throw new Error('Rubric not found');
    }

    if (!rubric.is_active) {
      throw new Error('Rubric is already inactive');
    }

    // Deactivate
    const { data: updatedRubric, error: updateError } = await supabase
      .from('evaluation_rubrics')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rubricId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to deactivate rubric: ${updateError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: deactivatedBy,
      action: 'rubric_deactivated',
      entity_type: 'evaluation_rubric',
      entity_id: rubricId,
      details: {
        academic_year: rubric.academic_year,
        reason: reason || null,
      },
    });

    return {
      success: true,
      data: updatedRubric,
      message: 'Rubric deactivated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Activate rubric (and deactivate others for same university)
 */
export async function activateRubric(
  rubricId: string,
  activatedBy: string
) {
  try {
    // Get rubric
    const { data: rubric, error: fetchError } = await supabase
      .from('evaluation_rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (fetchError || !rubric) {
      throw new Error('Rubric not found');
    }

    if (rubric.is_active) {
      throw new Error('Rubric is already active');
    }

    // Deactivate all other rubrics for this university
    await supabase
      .from('evaluation_rubrics')
      .update({ is_active: false })
      .eq('university_id', rubric.university_id);

    // Activate this rubric
    const { data: updatedRubric, error: updateError } = await supabase
      .from('evaluation_rubrics')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rubricId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to activate rubric: ${updateError.message}`);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: activatedBy,
      action: 'rubric_activated',
      entity_type: 'evaluation_rubric',
      entity_id: rubricId,
      details: {
        academic_year: rubric.academic_year,
      },
    });

    return {
      success: true,
      data: updatedRubric,
      message: 'Rubric activated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate grade from total score using rubric's grading scale
 */
export async function calculateGrade(
  rubricId: string,
  totalScore: number
): Promise<number | null> {
  try {
    const { data: rubric, error } = await supabase
      .from('evaluation_rubrics')
      .select('grading_scale')
      .eq('id', rubricId)
      .single();

    if (error || !rubric) {
      console.error('Rubric not found for grade calculation');
      return null;
    }

    const scale = rubric.grading_scale as GradingScale[];
    
    // Find matching grade range
    for (const range of scale) {
      if (totalScore >= range.min_score && totalScore <= range.max_score) {
        return range.grade;
      }
    }

    return null; // Score out of range
  } catch (error) {
    console.error('Error calculating grade:', error);
    return null;
  }
}

/**
 * Get default CvSU rubric (used when no custom rubric exists)
 */
function getDefaultCvSURubric(universityId: string) {
  return {
    id: 'default-cvsu',
    university_id: universityId,
    academic_year: new Date().getFullYear().toString(),
    rubric_name: 'CvSU Standard Evaluation Rubric',
    description: 'Official Cavite State University evaluation rubric for OJT/Internship',
    is_active: true,
    version: 1,
    criteria: [
      {
        code: 'A',
        name: 'Quality of Work',
        description: 'Accuracy, thoroughness, and quality of work performed',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Often unsatisfactory',
          '3-4': 'Occasionally unsatisfactory',
          '5-6': 'Meets minimum requirements',
          '7-8': 'Frequently exceeds job requirements',
          '9-10': 'Consistently superior',
        },
      },
      {
        code: 'B',
        name: 'Attitude Toward Work',
        description: 'Interest, enthusiasm, and dedication shown',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Definitely not interested',
          '3-4': 'Appears somewhat interested',
          '5-6': 'Shows interest in most assignments',
          '7-8': 'Very interested in work',
          '9-10': 'Outstanding in enthusiasm',
        },
      },
      {
        code: 'C',
        name: 'Judgment',
        description: 'Ability to make sound decisions',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Consistently uses poor judgment',
          '3-4': 'Often uses poor judgment',
          '5-6': 'Usually displays good judgment',
          '7-8': 'Displays very good judgment',
          '9-10': 'Exceptionally mature; sound decisions',
        },
      },
      {
        code: 'D',
        name: 'Cooperation',
        description: 'Ability to work harmoniously with others',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Unwilling to accept suggestions',
          '3-4': 'Sometimes uncooperative',
          '5-6': 'Cooperative when approached properly',
          '7-8': 'Very cooperative',
          '9-10': 'Quick to volunteer; highly cooperative',
        },
      },
      {
        code: 'E',
        name: 'Dependability',
        description: 'Reliability in carrying out assignments',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Frequently undependable',
          '3-4': 'Sometimes undependable',
          '5-6': 'Usually dependable',
          '7-8': 'Dependable in all situations',
          '9-10': 'Highly dependable; inspires confidence',
        },
      },
      {
        code: 'F',
        name: 'Comprehension',
        description: 'Ability to understand and follow instructions',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Needs instruction repeated numerous times',
          '3-4': 'Requires more than average instruction',
          '5-6': 'Grasps instructions with average explanations',
          '7-8': 'Requires minimum instruction',
          '9-10': 'Understands instantly; exceeds standards',
        },
      },
      {
        code: 'G',
        name: 'Safety',
        description: 'Awareness and practice of safety measures',
        max_score: 10,
        scale_descriptions: {
          '1-2': 'Careless of own and others\' safety',
          '3-4': 'Needs frequent reminders',
          '5-6': 'Usually observes safety practices',
          '7-8': 'Very safety conscious',
          '9-10': 'Quick to respond to hazards; exemplary',
        },
      },
    ],
    grading_scale: [
      { min_score: 67, max_score: 70, grade: 1.0 },
      { min_score: 63, max_score: 66, grade: 1.25 },
      { min_score: 59, max_score: 62, grade: 1.5 },
      { min_score: 54, max_score: 58, grade: 1.75 },
      { min_score: 50, max_score: 53, grade: 2.0 },
      { min_score: 45, max_score: 49, grade: 2.25 },
      { min_score: 41, max_score: 44, grade: 2.5 },
      { min_score: 36, max_score: 40, grade: 2.75 },
      { min_score: 32, max_score: 35, grade: 3.0 },
      { min_score: 18, max_score: 31, grade: 4.0 },
      { min_score: 7, max_score: 17, grade: 5.0 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
