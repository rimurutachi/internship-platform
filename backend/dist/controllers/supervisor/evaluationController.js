"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFinalEvaluation = createFinalEvaluation;
exports.saveFinalEvaluationDraft = saveFinalEvaluationDraft;
exports.submitFinalEvaluation = submitFinalEvaluation;
exports.getEvaluationById = getEvaluationById;
exports.getEvaluationsByInternship = getEvaluationsByInternship;
exports.deleteEvaluationDraft = deleteEvaluationDraft;
const supabase_js_1 = require("@supabase/supabase-js");
const rubricService_1 = require("../../services/rubricService");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Create final evaluation (draft)
 * NO AI INVOLVEMENT - supervisor creates evaluation manually
 */
async function createFinalEvaluation(req, res) {
    try {
        const supervisorId = req.user?.id;
        const { internship_id, criterion_scores, // Array of { criterion_code, criterion_name, score }
        attendance, punctuality, comments, } = req.body;
        console.log('🔵 Creating final evaluation:', { supervisorId, internship_id, criterion_scores, attendance, punctuality });
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
            .select('id, supervisor_id, student_id, advisor_id')
            .eq('id', internship_id)
            .single();
        console.log('✅ Internship lookup result:', { internship, internshipError });
        if (internshipError || !internship) {
            return res.status(404).json({
                success: false,
                error: 'Internship not found',
                message: internshipError?.message || 'Could not find internship with provided ID',
            });
        }
        if (internship.supervisor_id !== supervisorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized',
                message: 'You are not the supervisor for this internship',
            });
        }
        // Get supervisor's university_id from users table
        const { data: supervisor, error: supervisorError } = await supabase
            .from('users')
            .select('university_id')
            .eq('id', supervisorId)
            .single();
        console.log('✅ Supervisor lookup result:', { supervisor, supervisorError });
        if (supervisorError || !supervisor) {
            return res.status(404).json({
                success: false,
                error: 'Supervisor not found',
                message: 'Could not find supervisor record',
            });
        }
        // Validate criterion scores
        if (!criterion_scores || !Array.isArray(criterion_scores) || criterion_scores.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Must provide criterion scores',
            });
        }
        if (!attendance || !punctuality) {
            console.warn('⚠️ Missing attendance or punctuality:', { attendance, punctuality });
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Attendance and punctuality are required',
            });
        }
        // Validate each score
        for (const score of criterion_scores) {
            if (!score.criterion_code || !score.criterion_name) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: 'Each criterion must have a code and name',
                });
            }
            if (score.score < 1 || score.score > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    message: `Score for criterion ${score.criterion_code} must be between 1 and 10`,
                });
            }
        }
        // Calculate total score
        const totalScore = criterion_scores.reduce((sum, s) => sum + s.score, 0);
        // Get active rubric for grade calculation
        const { data: rubric } = await supabase
            .from('evaluation_rubrics')
            .select('id')
            .eq('university_id', supervisor.university_id)
            .eq('is_active', true)
            .single();
        console.log('✅ Active rubric lookup result:', { rubric });
        let gradeEquivalent = null;
        if (rubric) {
            gradeEquivalent = await (0, rubricService_1.calculateGrade)(rubric.id, totalScore);
        }
        console.log('✅ Grade calculated:', { totalScore, gradeEquivalent, rubricId: rubric?.id });
        // Check if a draft already exists for this internship (most recent draft)
        const { data: existingDraft, error: existingDraftError } = await supabase
            .from('evaluations')
            .select('id, status, created_at')
            .eq('internship_id', internship_id)
            .eq('supervisor_id', supervisorId)
            .eq('evaluation_type', 'final')
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        console.log('🔎 Existing draft lookup:', { existingDraft, existingDraftError });
        let evaluation;
        if (existingDraft) {
            // Update existing draft
            const { data: updated, error: updateError } = await supabase
                .from('evaluations')
                .update({
                rubric_id: rubric?.id || null,
                total_score: totalScore,
                final_grade: gradeEquivalent,
                attendance,
                punctuality,
                supervisor_comments: comments?.trim() || null,
            })
                .eq('id', existingDraft.id)
                .select()
                .single();
            if (updateError) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update evaluation',
                    message: updateError.message,
                });
            }
            evaluation = updated;
            // Delete old criterion scores
            await supabase
                .from('evaluation_criterion_scores')
                .delete()
                .eq('evaluation_id', existingDraft.id);
        }
        else {
            // Create new evaluation (draft status)
            const { data: created, error: createError } = await supabase
                .from('evaluations')
                .insert({
                internship_id,
                student_id: internship.student_id,
                supervisor_id: supervisorId,
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
            console.log('🔵 Insert evaluation result:', { createError });
            if (createError) {
                console.error('❌ Failed to create evaluation:', createError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create evaluation',
                    message: createError.message,
                });
            }
            console.log('✅ Evaluation created:', created);
            evaluation = created;
        }
        // Store individual criterion scores
        const scoreInserts = criterion_scores.map((s) => ({
            evaluation_id: evaluation.id,
            criterion_code: s.criterion_code,
            criterion_name: s.criterion_name,
            score: s.score,
        }));
        console.log('🔵 Inserting criterion scores:', scoreInserts);
        const { error: scoresError } = await supabase
            .from('evaluation_criterion_scores')
            .insert(scoreInserts);
        if (scoresError) {
            console.error('❌ Failed to insert criterion scores:', scoresError);
            // Rollback evaluation if scores insert fails
            await supabase.from('evaluations').delete().eq('id', evaluation.id);
            return res.status(500).json({
                success: false,
                error: 'Failed to store criterion scores',
                message: scoresError.message,
            });
        }
        console.log('✅ Criterion scores inserted successfully');
        return res.status(201).json({
            success: true,
            data: {
                ...evaluation,
                criterion_scores,
            },
            message: 'Evaluation draft created successfully',
        });
    }
    catch (error) {
        console.error('❌ Create final evaluation error:', error);
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
async function saveFinalEvaluationDraft(req, res) {
    try {
        const { id } = req.params;
        const supervisorId = req.user?.id;
        const { criterion_scores, attendance, punctuality, comments, } = req.body;
        // Get evaluation
        const { data: evaluation, error: fetchError } = await supabase
            .from('evaluations')
            .select('*')
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
        // Get supervisor's university_id from users table
        const { data: supervisor, error: supervisorError } = await supabase
            .from('users')
            .select('university_id')
            .eq('id', supervisorId)
            .single();
        if (supervisorError || !supervisor) {
            return res.status(404).json({
                success: false,
                error: 'Supervisor not found',
                message: 'Could not find supervisor record',
            });
        }
        // Prepare updates
        const updates = {
            updated_at: new Date().toISOString(),
        };
        if (attendance)
            updates.attendance = attendance;
        if (punctuality)
            updates.punctuality = punctuality;
        if (comments !== undefined)
            updates.supervisor_comments = comments?.trim() || null;
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
            const scoreInserts = criterion_scores.map((s) => ({
                evaluation_id: id,
                criterion_code: s.criterion_code,
                criterion_name: s.criterion_name,
                score: s.score,
            }));
            await supabase
                .from('evaluation_criterion_scores')
                .insert(scoreInserts);
            // Recalculate total score
            const totalScore = criterion_scores.reduce((sum, s) => sum + s.score, 0);
            updates.total_score = totalScore;
            // Recalculate grade
            if (evaluation.rubric_id) {
                const grade = await (0, rubricService_1.calculateGrade)(evaluation.rubric_id, totalScore);
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
    }
    catch (error) {
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
async function submitFinalEvaluation(req, res) {
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
    }
    catch (error) {
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
async function getEvaluationById(req, res) {
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
        const isAuthorized = userId === evaluation.supervisor_id ||
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
    }
    catch (error) {
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
async function getEvaluationsByInternship(req, res) {
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
    }
    catch (error) {
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
async function deleteEvaluationDraft(req, res) {
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
    }
    catch (error) {
        console.error('Delete evaluation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}
//# sourceMappingURL=evaluationController.js.map