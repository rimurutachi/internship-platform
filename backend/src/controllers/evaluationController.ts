import { Request, Response } from "express";
import { EvaluationService } from "../services/evaluationService";

const evaluationService = new EvaluationService();

/**
 * Analyze draft evaluation text (real-time feedback)
 * POST /api/evaluations/analyze-draft
 */
export async function analyzeDraftEvaluation(req: Request, res: Response) {
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
    } catch (error: any) {
        console.error('Draft analysis error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze draft evaluation',
        });
    }
}

export async function createEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.create(req.body);
        res.status(201).json({success: true, data: evaluation});
    } catch (error: any) {
        res.status(400).json({success: false, error: error.message});
    }
}

export async function getEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.getById(req.params.id);
        if (!evaluation) {
            return res.status(404).json({success: false, error: 'Evaluation not found'});
        }
        res.json({success: true, data: evaluation});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function submitEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.submit(req.params.id);
        res.json({success: true, data: evaluation, message: 'Evaluation submitted and processing!'});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function approveEvaluation(req: Request, res: Response) {
    try {
        const { final_grade } = req.body;
        const evaluation = await evaluationService.approve(req.params.id, final_grade);
        res.json({success: true, data: evaluation});
    } catch (error:any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function getInternshipEvaluations(req: Request, res: Response) {
    try {
        const evaluations = await evaluationService.getByInternship(req.params.internshipId);
        res.json({success: true, data: evaluations})
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message})
    }
}

/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft
 */
export async function getEvaluations(req: Request, res: Response) {
    try {
        const { supervisor_id, status, limit, offset } = req.query;

        const evaluations = await evaluationService.getAll({
            supervisor_id: supervisor_id as string,
            status: status as string,
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
        });

        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}