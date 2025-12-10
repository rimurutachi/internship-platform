"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDraftEvaluation = analyzeDraftEvaluation;
exports.createEvaluation = createEvaluation;
exports.getEvaluation = getEvaluation;
exports.updateEvaluation = updateEvaluation;
exports.submitEvaluation = submitEvaluation;
exports.approveEvaluation = approveEvaluation;
exports.getInternshipEvaluations = getInternshipEvaluations;
exports.getEvaluations = getEvaluations;
exports.getEvaluationTimeline = getEvaluationTimeline;
exports.getEvaluationsByType = getEvaluationsByType;
exports.getOverdueEvaluations = getOverdueEvaluations;
exports.getEvaluationProgress = getEvaluationProgress;
const evaluationService_1 = require("../services/evaluationService");
const evaluationService = new evaluationService_1.EvaluationService();
/**
 * Analyze draft evaluation text (real-time feedback)
 * POST /api/evaluations/analyze-draft
 */
async function analyzeDraftEvaluation(req, res) {
    try {
        const { text } = req.body;
        // Validation
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Text field is required and must be a string',
            });
        }
        if (text.trim().length < 5) {
            return res.status(400).json({
                success: false,
                error: 'Text is too short for analysis (minimum 5 characters)',
            });
        }
        // Call service
        const result = await evaluationService.analyzeDraft(text);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('Draft analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze draft evaluation',
        });
    }
}
async function createEvaluation(req, res) {
    try {
        const evaluation = await evaluationService.create(req.body);
        res.status(201).json({ success: true, data: evaluation });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
async function getEvaluation(req, res) {
    try {
        const evaluation = await evaluationService.getById(req.params.id);
        if (!evaluation) {
            return res.status(404).json({ success: false, error: 'Evaluation not found' });
        }
        res.json({ success: true, data: evaluation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function updateEvaluation(req, res) {
    try {
        const evaluation = await evaluationService.update(req.params.id, req.body);
        res.json({ success: true, data: evaluation });
    }
    catch (error) {
        console.error('Update evaluation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
async function submitEvaluation(req, res) {
    try {
        const evaluation = await evaluationService.submit(req.params.id);
        res.json({ success: true, data: evaluation, message: 'Evaluation submitted and processing!' });
    }
    catch (error) {
        console.error('Submit evaluation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, error: error.message });
    }
}
async function approveEvaluation(req, res) {
    try {
        const { final_grade } = req.body;
        const evaluation = await evaluationService.approve(req.params.id, final_grade);
        res.json({ success: true, data: evaluation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function getInternshipEvaluations(req, res) {
    try {
        const evaluations = await evaluationService.getByInternship(req.params.internshipId);
        res.json({ success: true, data: evaluations });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft&evaluation_type=weekly
 */
async function getEvaluations(req, res) {
    try {
        const { supervisor_id, status, evaluation_type, limit, offset } = req.query;
        const evaluations = await evaluationService.getAll({
            supervisor_id: supervisor_id,
            status: status,
            evaluation_type: evaluation_type,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
        res.json({ success: true, data: evaluations });
    }
    catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
/**
 * Get evaluation timeline for an internship
 * GET /api/evaluations/timeline/:internshipId
 */
async function getEvaluationTimeline(req, res) {
    try {
        const { internshipId } = req.params;
        const timeline = await evaluationService.getTimelineByInternship(internshipId);
        res.json({ success: true, data: timeline });
    }
    catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
/**
 * Get evaluations by type for an internship
 * GET /api/evaluations/internship/:internshipId/type/:evaluationType
 */
async function getEvaluationsByType(req, res) {
    try {
        const { internshipId, evaluationType } = req.params;
        if (!['weekly', 'midterm', 'final'].includes(evaluationType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid evaluation type. Must be weekly, midterm, or final'
            });
        }
        const evaluations = await evaluationService.getByType(internshipId, evaluationType);
        res.json({ success: true, data: evaluations });
    }
    catch (error) {
        console.error('Get evaluations by type error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
/**
 * Get overdue evaluations
 * GET /api/evaluations/overdue?supervisor_id=xxx
 */
async function getOverdueEvaluations(req, res) {
    try {
        const { supervisor_id } = req.query;
        const evaluations = await evaluationService.getOverdueEvaluations(supervisor_id);
        res.json({ success: true, data: evaluations });
    }
    catch (error) {
        console.error('Get overdue evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
/**
 * Get evaluation progress summary for an internship
 * GET /api/evaluations/progress/:internshipId
 */
async function getEvaluationProgress(req, res) {
    try {
        const { internshipId } = req.params;
        const progress = await evaluationService.getProgressSummary(internshipId);
        res.json({ success: true, data: progress });
    }
    catch (error) {
        console.error('Get evaluation progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
//# sourceMappingURL=evaluationController.js.map