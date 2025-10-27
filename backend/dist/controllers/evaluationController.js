"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvaluation = createEvaluation;
exports.getEvaluation = getEvaluation;
exports.submitEvaluation = submitEvaluation;
exports.approveEvaluation = approveEvaluation;
exports.getInternshipEvaluations = getInternshipEvaluations;
const evaluationService_1 = require("../services/evaluationService");
const evaluationService = new evaluationService_1.EvaluationService();
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
async function submitEvaluation(req, res) {
    try {
        const evaluation = await evaluationService.submit(req.params.id);
        res.json({ success: true, data: evaluation, message: 'Evaluation submitted and processing!' });
    }
    catch (error) {
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
//# sourceMappingURL=evaluationController.js.map