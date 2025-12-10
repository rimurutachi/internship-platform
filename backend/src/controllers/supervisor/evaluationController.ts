import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { calculateGrade } from '../../services/rubricService';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface CriterionScore {
  criterion_code: string;
  criterion_name: string;
  score: number;
}

/**
 * Create final evaluation (draft)
 * NO AI INVOLVEMENT - supervisor creates evaluation manually
 */
export async function createFinalEvaluation(req: AuthRequest, res: Response) {
  try {
    const supervisorId = req.user?.id;
    const {
      internship_id,
      criterion_scores, // Array of { criterion_code, criterion_name, score }
      attendance,
      punctuality,
      comments,
    } = req.body;

    if (!supervisorId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Supervisor authentication required',
      });
    }

    // Validate internship
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('id, supervisor_id, student_id, advisor_id, university_id')
      .eq('id', internship_id)
      .single();

    if (internshipError || !internship) {
      return res.status(404).json({
        success: false,
        error: 'Internship not found',
      });
    }

    if (internship.supervisor_id !== supervisorId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You are not the supervisor for this internship',
      });
    }

    // Validate criterion scores
    if (!criterion_scores || !Array.isArray(criterion_scores) || criterion_scores.length !== 7) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Must provide exactly 7 criterion scores (A-G)',
      });
    }

    const requiredCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    for (const code of requiredCodes) {
      const score = criterion_scores.find((s: CriterionScore) => s.criterion_code === code);
      if (!score) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Missing score for criterion ${code}`,
        });
      }
      if (score.score < 1 || score.score > 10) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: `Score for criterion ${code} must be between 1 and 10`,
        });
      }
    }

    // Calculate total score
    const totalScore = criterion_scores.reduce((sum: number, s: CriterionScore) => sum + s.score, 0);

    // Get active rubric for grade calculation
    const { data: rubric } = await supabase
      .from('evaluation_rubrics')
      .select('id')
      .eq('university_id', internship.university_id)
      .eq('is_active', true)
      .single();

    let gradeEquivalent = null;
    if (rubric) {
      gradeEquivalent = await calculateGrade(rubric.id, totalScore);
    }

    // Create evaluation (draft status)
    const { data: evaluation, error: createError } = await supabase
      .from('evaluations')
      .insert({
        internship_id,
        student_id: internship.student_id,
        supervisor_id: supervisorId,
        evaluator_id: supervisorId,
        rubric_id: rubric?.id || null,
        total_score: totalScore,
        final_grade: gradeEquivalent,
        attendance,
        punctuality,
        supervisor_comments: comments?.trim() || null,
        status: 'draft',
        evaluation_type: 'final',
      })
      .select()
      .single();

    if (createError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create evaluation',
        message: createError.message,
      });
    }

    // Store individual criterion scores
    const scoreInserts = criterion_scores.map((s: CriterionScore) => ({
      evaluation_id: evaluation.id,
      criterion_code: s.criterion_code,
      criterion_name: s.criterion_name,
      score: s.score,
    }));

    const { error: scoresError } = await supabase
      .from('evaluation_criterion_scores')
      .insert(scoreInserts);

    if (scoresError) {
      // Rollback evaluation if scores insert fails
      await supabase.from('evaluations').delete().eq('id', evaluation.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to store criterion scores',
        message: scoresError.message,
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        ...evaluation,
        criterion_scores,
      },
      message: 'Evaluation draft created successfully',
    });
  } catch (error: any) {
    console.error('Create final evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Save final evaluation draft
 * Allows multiple saves while supervisor completes the form
 */
export async function saveFinalEvaluationDraft(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const supervisorId = req.user?.id;
    const {
      criterion_scores,
      attendance,
      punctuality,
      comments,
    } = req.body;

    // Get evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select('*, internship:internships(university_id)')
      .eq('id', id)
      .eq('supervisor_id', supervisorId)
      .single();

    if (fetchError || !evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found or not authorized',
      });
    }

    if (evaluation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit submitted evaluation',
        message: 'Only draft evaluations can be edited',
      });
    }

    // Prepare updates
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (attendance) updates.attendance = attendance;
    if (punctuality) updates.punctuality = punctuality;
    if (comments !== undefined) updates.supervisor_comments = comments?.trim() || null;

    // Update criterion scores if provided
    if (criterion_scores && Array.isArray(criterion_scores)) {
      // Validate scores
      for (const score of criterion_scores) {
        if (score.score < 1 || score.score > 10) {
          return res.status(400).json({
            success: false,
            error: 'Validation error',
            message: `Score must be between 1 and 10`,
          });
        }
      }

      // Delete existing scores
      await supabase
        .from('evaluation_criterion_scores')
        .delete()
        .eq('evaluation_id', id);

      // Insert new scores
      const scoreInserts = criterion_scores.map((s: CriterionScore) => ({
        evaluation_id: id,
        criterion_code: s.criterion_code,
        criterion_name: s.criterion_name,
        score: s.score,
      }));

      await supabase
        .from('evaluation_criterion_scores')
        .insert(scoreInserts);

      // Recalculate total score
      const totalScore = criterion_scores.reduce((sum: number, s: CriterionScore) => sum + s.score, 0);
      updates.total_score = totalScore;

      // Recalculate grade
      if (evaluation.rubric_id) {
        const grade = await calculateGrade(evaluation.rubric_id, totalScore);
        updates.final_grade = grade;
      }
    }

    // Update evaluation
    const { data: updatedEval, error: updateError } = await supabase
      .from('evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save draft',
        message: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedEval,
      message: 'Draft saved successfully',
    });
  } catch (error: any) {
    console.error('Save evaluation draft error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Submit final evaluation to advisor for review
 * Changes status from draft to submitted
 */
export async function submitFinalEvaluation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const supervisorId = req.user?.id;

    // Get evaluation with criterion scores
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        internship:internships(advisor_id, student_id)
      `)
      .eq('id', id)
      .eq('supervisor_id', supervisorId)
      .single();

    if (fetchError || !evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found or not authorized',
      });
    }

    if (evaluation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot submit',
        message: 'Evaluation is already submitted',
      });
    }

    // Validate completeness
    if (!evaluation.criterion_scores || evaluation.criterion_scores.length !== 7) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete evaluation',
        message: 'All 7 criteria must have scores',
      });
    }

    if (!evaluation.attendance || !evaluation.punctuality) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete evaluation',
        message: 'Attendance and punctuality are required',
      });
    }

    if (!evaluation.supervisor_comments || evaluation.supervisor_comments.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete evaluation',
        message: 'Comments must be at least 50 characters',
      });
    }

    // Submit evaluation
    const { data: submittedEval, error: updateError } = await supabase
      .from('evaluations')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to submit evaluation',
        message: updateError.message,
      });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: supervisorId,
      action: 'evaluation_submitted',
      entity_type: 'evaluation',
      entity_id: id,
      details: {
        internship_id: evaluation.internship_id,
        student_id: evaluation.student_id,
        total_score: evaluation.total_score,
        final_grade: evaluation.final_grade,
      },
    });

    // Notify advisor
    if (evaluation.internship.advisor_id) {
      await supabase.from('notifications').insert({
        user_id: evaluation.internship.advisor_id,
        type: 'evaluation_submitted',
        title: 'New Evaluation for Review',
        message: 'A supervisor has submitted a final evaluation for your review',
        data: {
          evaluation_id: id,
          internship_id: evaluation.internship_id,
        },
      });
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: evaluation.internship.student_id,
      type: 'evaluation_submitted',
      title: 'Final Evaluation Submitted',
      message: 'Your supervisor has submitted your final evaluation. It is now under advisor review.',
      data: {
        evaluation_id: id,
      },
    });

    return res.status(200).json({
      success: true,
      data: submittedEval,
      message: 'Evaluation submitted successfully. Advisor will review it.',
    });
  } catch (error: any) {
    console.error('Submit evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Get evaluation by ID
 */
export async function getEvaluationById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        student:users!student_id(id, first_name, last_name, student_number),
        supervisor:users!supervisor_id(id, first_name, last_name),
        internship:internships(
          id,
          position,
          department,
          start_date,
          end_date,
          companies(name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found',
      });
    }

    // Check authorization
    const isAuthorized = 
      userId === evaluation.supervisor_id ||
      userId === evaluation.student_id ||
      req.user?.role === 'advisor' ||
      req.user?.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'You are not authorized to view this evaluation',
      });
    }

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    console.error('Get evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Get evaluations by internship
 */
export async function getEvaluationsByInternship(req: AuthRequest, res: Response) {
  try {
    const { internship_id } = req.params;

    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        supervisor:users!supervisor_id(first_name, last_name)
      `)
      .eq('internship_id', internship_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch evaluations',
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: evaluations || [],
    });
  } catch (error: any) {
    console.error('Get evaluations error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Delete evaluation draft
 */
export async function deleteEvaluationDraft(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const supervisorId = req.user?.id;

    // Get evaluation
    const { data: evaluation, error: fetchError } = await supabase
      .from('evaluations')
      .select('status')
      .eq('id', id)
      .eq('supervisor_id', supervisorId)
      .single();

    if (fetchError || !evaluation) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found or not authorized',
      });
    }

    if (evaluation.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete',
        message: 'Only draft evaluations can be deleted',
      });
    }

    // Delete criterion scores first
    await supabase
      .from('evaluation_criterion_scores')
      .delete()
      .eq('evaluation_id', id);

    // Delete evaluation
    const { error: deleteError } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete evaluation',
        message: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Evaluation draft deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete evaluation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
