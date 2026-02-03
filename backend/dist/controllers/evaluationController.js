"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const evaluation_service_1 = require("../services/evaluation.service");
const typeGuards_1 = require("../utils/typeGuards");
// NOTE: analyzeDraftEvaluation removed in v2.0.0
// AI is now used only for historical trend analysis (admin dashboard)
// Not for individual evaluation assistance during supervisor draft writing
async function createEvaluation(req, res) {
    try {
        const evaluation = await evaluation_service_1.evaluationService.create(req.body);
        res.status(201).json({ success: true, data: evaluation });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
}
async function getEvaluation(req, res) {
    try {
        const evaluation = await evaluation_service_1.evaluationService.getById((0, typeGuards_1.ensureString)(req.params.id, 'id'));
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
        const evaluation = await evaluation_service_1.evaluationService.update((0, typeGuards_1.ensureString)(req.params.id, 'id'), req.body);
        res.json({ success: true, data: evaluation });
    }
    catch (error) {
        console.error('Update evaluation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
async function submitEvaluation(req, res) {
    try {
        const evaluation = await evaluation_service_1.evaluationService.submit((0, typeGuards_1.ensureString)(req.params.id, 'id'));
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
        const evaluation = await evaluation_service_1.evaluationService.approve((0, typeGuards_1.ensureString)(req.params.id, 'id'), final_grade);
        res.json({ success: true, data: evaluation });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
async function getInternshipEvaluations(req, res) {
    try {
        const evaluations = await evaluation_service_1.evaluationService.getByInternship((0, typeGuards_1.ensureString)(req.params.internshipId, 'internshipId'));
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
        const evaluations = await evaluation_service_1.evaluationService.getAll({
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
        const internshipId = (0, typeGuards_1.ensureString)(req.params.internshipId, 'internshipId');
        const timeline = await evaluation_service_1.evaluationService.getTimelineByInternship(internshipId);
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
        const internshipId = (0, typeGuards_1.ensureString)(req.params.internshipId, 'internshipId');
        const evaluationType = (0, typeGuards_1.ensureString)(req.params.evaluationType, 'evaluationType');
        if (!['weekly', 'midterm', 'final'].includes(evaluationType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid evaluation type. Must be weekly, midterm, or final'
            });
        }
        const evaluations = await evaluation_service_1.evaluationService.getByType(internshipId, evaluationType);
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
        const evaluations = await evaluation_service_1.evaluationService.getOverdueEvaluations(supervisor_id);
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
        const internshipId = (0, typeGuards_1.ensureString)(req.params.internshipId, 'internshipId');
        const progress = await evaluation_service_1.evaluationService.getProgressSummary(internshipId);
        res.json({ success: true, data: progress });
    }
    catch (error) {
        console.error('Get evaluation progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
//# sourceMappingURL=evaluationController.js.map