"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingEvaluations = getPendingEvaluations;
exports.getEvaluationsByStatus = getEvaluationsByStatus;
exports.approveEvaluation = approveEvaluation;
exports.requestRevision = requestRevision;
exports.getWeeklyReportsForContext = getWeeklyReportsForContext;
exports.getEvaluationStatistics = getEvaluationStatistics;
exports.getEvaluationWithContext = getEvaluationWithContext;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Get pending evaluations for an advisor
 */
async function getPendingEvaluations(advisorId) {
    try {
        // Get all internships for this advisor
        const { data: internships, error: internshipsError } = await supabase
            .from('internships')
            .select('id')
            .eq('advisor_id', advisorId);
        if (internshipsError || !internships || internships.length === 0) {
            return {
                success: true,
                data: [],
            };
        }
        const internshipIds = internships.map(i => i.id);
        // Get evaluations
        const { data: evaluations, error: evalsError } = await supabase
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
            .in('internship_id', internshipIds)
            .eq('status', 'submitted')
            .order('submitted_at', { ascending: true });
        if (evalsError) {
            throw new Error(`Failed to fetch evaluations: ${evalsError.message}`);
        }
        return {
            success: true,
            data: evaluations || [],
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get evaluations by status for advisor
 */
async function getEvaluationsByStatus(advisorId, status) {
    try {
        // Get all internships for this advisor
        const { data: internships, error: internshipsError } = await supabase
            .from('internships')
            .select('id')
            .eq('advisor_id', advisorId);
        if (internshipsError || !internships || internships.length === 0) {
            return {
                success: true,
                data: [],
            };
        }
        const internshipIds = internships.map(i => i.id);
        // Get evaluations
        const { data: evaluations, error: evalsError } = await supabase
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
          companies(name)
        )
      `)
            .in('internship_id', internshipIds)
            .eq('status', status)
            .order('submitted_at', { ascending: false });
        if (evalsError) {
            throw new Error(`Failed to fetch evaluations: ${evalsError.message}`);
        }
        return {
            success: true,
            data: evaluations || [],
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Approve evaluation
 * Optionally override final grade with justification
 * AI analytics will be triggered AFTER approval
 */
async function approveEvaluation(evaluationId, advisorId, approvalData) {
    try {
        const { final_grade_override, grade_override_reason, approval_comments } = approvalData;
        if (!approval_comments || approval_comments.trim().length < 10) {
            throw new Error('Approval comments must be at least 10 characters');
        }
        // Get evaluation
        const { data: evaluation, error: fetchError } = await supabase
            .from('evaluations')
            .select(`
        *,
        internship:internships(advisor_id, student_id, supervisor_id, university_id)
      `)
            .eq('id', evaluationId)
            .single();
        if (fetchError || !evaluation) {
            throw new Error('Evaluation not found');
        }
        // Verify advisor is assigned
        if (evaluation.internship.advisor_id !== advisorId) {
            throw new Error('You are not authorized to approve this evaluation');
        }
        if (evaluation.status !== 'submitted' && evaluation.status !== 'revision_requested') {
            throw new Error('Evaluation is not in a state that can be approved');
        }
        // Validate grade override
        if (final_grade_override !== undefined) {
            if (!grade_override_reason || grade_override_reason.trim().length < 20) {
                throw new Error('Grade override requires detailed justification (min 20 characters)');
            }
            if (final_grade_override < 1.0 || final_grade_override > 5.0) {
                throw new Error('Grade must be between 1.0 and 5.0');
            }
        }
        // Prepare update data
        const updates = {
            status: 'approved',
            advisor_approved_at: new Date().toISOString(),
            advisor_approved_by: advisorId,
            advisor_comments: approval_comments.trim(),
            updated_at: new Date().toISOString(),
        };
        if (final_grade_override !== undefined) {
            updates.final_grade = final_grade_override;
            updates.grade_override_reason = grade_override_reason?.trim();
        }
        // Update evaluation
        const { data: approvedEval, error: updateError } = await supabase
            .from('evaluations')
            .update(updates)
            .eq('id', evaluationId)
            .select()
            .single();
        if (updateError) {
            throw new Error(`Failed to approve evaluation: ${updateError.message}`);
        }
        // Log activity
        await supabase.from('activity_logs').insert({
            user_id: advisorId,
            action: 'evaluation_approved',
            entity_type: 'evaluation',
            entity_id: evaluationId,
            details: {
                internship_id: evaluation.internship_id,
                student_id: evaluation.student_id,
                final_grade: updates.final_grade || evaluation.final_grade,
                grade_overridden: final_grade_override !== undefined,
            },
        });
        // Notify supervisor
        await supabase.from('notifications').insert({
            user_id: evaluation.internship.supervisor_id,
            type: 'evaluation_approved',
            title: 'Evaluation Approved',
            message: 'Your evaluation has been approved by the advisor',
            data: {
                evaluation_id: evaluationId,
                comments: approval_comments.trim(),
            },
        });
        // Notify student
        await supabase.from('notifications').insert({
            user_id: evaluation.internship.student_id,
            type: 'evaluation_approved',
            title: 'Final Evaluation Approved',
            message: `Your final evaluation has been approved. Grade: ${updates.final_grade || evaluation.final_grade}`,
            data: {
                evaluation_id: evaluationId,
                final_grade: updates.final_grade || evaluation.final_grade,
            },
        });
        // Trigger AI analytics generation (post-approval)
        try {
            await triggerAIAnalytics(evaluationId, evaluation.internship.university_id);
        }
        catch (aiError) {
            console.error('AI analytics generation failed (non-critical):', aiError);
            // Don't fail the approval if AI fails
        }
        return {
            success: true,
            data: approvedEval,
            message: 'Evaluation approved successfully. AI analytics are being generated.',
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Request revision on evaluation
 * Sends evaluation back to supervisor for changes
 */
async function requestRevision(evaluationId, advisorId, revisionReason) {
    try {
        if (!revisionReason || revisionReason.trim().length < 20) {
            throw new Error('Revision reason must be at least 20 characters');
        }
        // Get evaluation
        const { data: evaluation, error: fetchError } = await supabase
            .from('evaluations')
            .select(`
        *,
        internship:internships(advisor_id, student_id, supervisor_id)
      `)
            .eq('id', evaluationId)
            .single();
        if (fetchError || !evaluation) {
            throw new Error('Evaluation not found');
        }
        // Verify advisor is assigned
        if (evaluation.internship.advisor_id !== advisorId) {
            throw new Error('You are not authorized to request revision on this evaluation');
        }
        if (evaluation.status === 'approved') {
            throw new Error('Cannot request revision on approved evaluation');
        }
        // Update evaluation
        const { data: updatedEval, error: updateError } = await supabase
            .from('evaluations')
            .update({
            status: 'revision_requested',
            revision_requested_at: new Date().toISOString(),
            revision_requested_by: advisorId,
            revision_reason: revisionReason.trim(),
            updated_at: new Date().toISOString(),
        })
            .eq('id', evaluationId)
            .select()
            .single();
        if (updateError) {
            throw new Error(`Failed to request revision: ${updateError.message}`);
        }
        // Log activity
        await supabase.from('activity_logs').insert({
            user_id: advisorId,
            action: 'evaluation_revision_requested',
            entity_type: 'evaluation',
            entity_id: evaluationId,
            details: {
                internship_id: evaluation.internship_id,
                supervisor_id: evaluation.supervisor_id,
                revision_reason: revisionReason.trim(),
            },
        });
        // Notify supervisor with detailed feedback
        await supabase.from('notifications').insert({
            user_id: evaluation.internship.supervisor_id,
            type: 'evaluation_revision_requested',
            title: 'Evaluation Revision Requested',
            message: `The advisor has requested revisions on your evaluation: ${revisionReason}`,
            data: {
                evaluation_id: evaluationId,
                revision_reason: revisionReason.trim(),
            },
        });
        return {
            success: true,
            data: updatedEval,
            message: 'Revision requested. Supervisor has been notified.',
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get weekly reports for context
 * Advisor can view alongside evaluation
 */
async function getWeeklyReportsForContext(internshipId) {
    try {
        const { data: reports, error } = await supabase
            .from('student_weekly_accomplishments')
            .select(`
        *,
        student:users!student_id(first_name, last_name)
      `)
            .eq('internship_id', internshipId)
            .order('week_number', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch weekly reports: ${error.message}`);
        }
        return {
            success: true,
            data: reports || [],
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get evaluation statistics for advisor dashboard
 */
async function getEvaluationStatistics(advisorId) {
    try {
        // Get all internships for this advisor
        const { data: internships, error: internshipsError } = await supabase
            .from('internships')
            .select('id')
            .eq('advisor_id', advisorId);
        if (internshipsError || !internships || internships.length === 0) {
            return {
                success: true,
                data: {
                    total: 0,
                    pending: 0,
                    revision_requested: 0,
                    approved: 0,
                },
            };
        }
        const internshipIds = internships.map(i => i.id);
        // Get counts by status
        const [totalResult, pendingResult, revisionResult, approvedResult] = await Promise.all([
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .in('internship_id', internshipIds),
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .in('internship_id', internshipIds)
                .eq('status', 'submitted'),
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .in('internship_id', internshipIds)
                .eq('status', 'revision_requested'),
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .in('internship_id', internshipIds)
                .eq('status', 'approved'),
        ]);
        return {
            success: true,
            data: {
                total: totalResult.count || 0,
                pending: pendingResult.count || 0,
                revision_requested: revisionResult.count || 0,
                approved: approvedResult.count || 0,
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Trigger AI analytics generation (post-approval only)
 * This calls the AI service to generate historical insights from approved evaluations
 *
 * @param evaluationId - The newly approved evaluation ID
 * @param universityId - University context for filtering
 */
async function triggerAIAnalytics(evaluationId, universityId) {
    try {
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        // Get recent approved evaluations (including the one just approved)
        const { data: approvedEvaluations, error: fetchError } = await supabase
            .from('evaluations')
            .select(`
        id,
        internship_id,
        student_id,
        supervisor_id,
        supervisor_comments,
        advisor_comments,
        final_grade,
        created_at,
        approved_at:advisor_approved_at,
        criterion_scores:evaluation_criterion_scores(
          criterion_type,
          score
        )
      `)
            .eq('status', 'approved')
            .order('advisor_approved_at', { ascending: false })
            .limit(50); // Last 50 approved evaluations for trends
        if (fetchError) {
            console.error('Error fetching evaluations for AI analysis:', fetchError);
            return;
        }
        if (!approvedEvaluations || approvedEvaluations.length === 0) {
            console.log('No approved evaluations to analyze');
            return;
        }
        // Transform data to match AI service expected format
        const evaluationsForAI = approvedEvaluations.map((evaluation) => ({
            evaluation_id: evaluation.id,
            text: `${evaluation.supervisor_comments || ''} ${evaluation.advisor_comments || ''}`.trim(),
            ratings: evaluation.criterion_scores?.reduce((acc, cs) => {
                acc[cs.criterion_type] = cs.score;
                return acc;
            }, {}) || {},
            student_id: evaluation.student_id,
            supervisor_id: evaluation.supervisor_id,
            created_at: evaluation.created_at,
            final_grade: evaluation.final_grade,
        }));
        // Call AI service analytics endpoint
        const response = await fetch(`${AI_SERVICE_URL}/api/evaluate-post-approval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(evaluationsForAI),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI service returned ${response.status}: ${errorText}`);
        }
        const analyticsResult = await response.json();
        // Store analytics insights in database
        if (analyticsResult?.insights && analyticsResult.insights.length > 0) {
            await supabase.from('evaluation_analytics').insert({
                evaluation_id: evaluationId,
                university_id: universityId,
                insights: analyticsResult.insights,
                total_evaluations_analyzed: analyticsResult.total_evaluations_analyzed,
                generated_at: analyticsResult.generated_at || new Date().toISOString(),
            });
            console.log(`AI analytics generated successfully: ${analyticsResult.insights.length} insights for evaluation ${evaluationId}`);
        }
        else {
            console.log('AI analytics returned no insights');
        }
    }
    catch (error) {
        console.error('Failed to generate AI analytics (non-critical):', error);
        // Don't throw - analytics failure shouldn't block evaluation approval
    }
}
/**
 * Get evaluation with full context (for advisor review)
 */
async function getEvaluationWithContext(evaluationId, advisorId) {
    try {
        // Get evaluation
        const { data: evaluation, error: evalError } = await supabase
            .from('evaluations')
            .select(`
        *,
        criterion_scores:evaluation_criterion_scores(*),
        student:users!student_id(id, first_name, last_name, student_number),
        supervisor:users!supervisor_id(id, first_name, last_name),
        internship:internships(
          *,
          companies(name),
          advisor_id
        )
      `)
            .eq('id', evaluationId)
            .single();
        if (evalError || !evaluation) {
            throw new Error('Evaluation not found');
        }
        // Verify advisor authorization
        if (evaluation.internship.advisor_id !== advisorId) {
            throw new Error('Not authorized to view this evaluation');
        }
        // Get weekly reports for context
        const { data: weeklyReports } = await supabase
            .from('student_weekly_accomplishments')
            .select('*')
            .eq('internship_id', evaluation.internship_id)
            .order('week_number', { ascending: true });
        return {
            success: true,
            data: {
                evaluation,
                weekly_reports: weeklyReports || [],
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
//# sourceMappingURL=advisorEvaluationService.js.map