import { Request, Response } from "express";
import { evaluationService } from "../services/evaluation.service";
import { ensureString } from '../utils/typeGuards';

// NOTE: analyzeDraftEvaluation removed in v2.0.0
// AI is now used only for historical trend analysis (admin dashboard)
// Not for individual evaluation assistance during supervisor draft writing

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
        const evaluation = await evaluationService.getById(ensureString(req.params.id, 'id'));
        if (!evaluation) {
            return res.status(404).json({success: false, error: 'Evaluation not found'});
        }
        res.json({success: true, data: evaluation});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function updateEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.update(ensureString(req.params.id, 'id'), req.body);
        res.json({success: true, data: evaluation});
    } catch (error: any) {
        console.error('Update evaluation error:', error);
        res.status(500).json({success: false, error: error.message});
    }
}

export async function submitEvaluation(req: Request, res: Response) {
    try {
        const evaluation = await evaluationService.submit(ensureString(req.params.id, 'id'));
        res.json({success: true, data: evaluation, message: 'Evaluation submitted and processing!'});
    } catch (error: any) {
        console.error('Submit evaluation error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({success: false, error: error.message});
    }
}

export async function approveEvaluation(req: Request, res: Response) {
    try {
        const { final_grade } = req.body;
        const evaluation = await evaluationService.approve(ensureString(req.params.id, 'id'), final_grade);
        res.json({success: true, data: evaluation});
    } catch (error:any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function getInternshipEvaluations(req: Request, res: Response) {
    try {
        const evaluations = await evaluationService.getByInternship(ensureString(req.params.internshipId, 'internshipId'));
        res.json({success: true, data: evaluations})
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message})
    }
}

/**
 * Get evaluations with optional filters
 * GET /api/evaluations?supervisor_id=xxx&status=draft&evaluation_type=weekly
 */
export async function getEvaluations(req: Request, res: Response) {
    try {
        const { supervisor_id, status, evaluation_type, limit, offset } = req.query;

        const evaluations = await evaluationService.getAll({
            supervisor_id: supervisor_id as string,
            status: status as string,
            evaluation_type: evaluation_type as 'weekly' | 'midterm' | 'final' | undefined,
            limit: limit ? Number(limit as string) : undefined,
            offset: offset ? Number(offset as string) : undefined,
        });

        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluation timeline for an internship
 * GET /api/evaluations/timeline/:internshipId
 */
export async function getEvaluationTimeline(req: Request, res: Response) {
    try {
        const internshipId = ensureString(req.params.internshipId, 'internshipId');
        const timeline = await evaluationService.getTimelineByInternship(internshipId);
        res.json({ success: true, data: timeline });
    } catch (error: any) {
        console.error('Get timeline error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluations by type for an internship
 * GET /api/evaluations/internship/:internshipId/type/:evaluationType
 */
export async function getEvaluationsByType(req: Request, res: Response) {
    try {
        const internshipId = ensureString(req.params.internshipId, 'internshipId');
        const evaluationType = ensureString(req.params.evaluationType, 'evaluationType');
        
        if (!['weekly', 'midterm', 'final'].includes(evaluationType)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid evaluation type. Must be weekly, midterm, or final' 
            });
        }

        const evaluations = await evaluationService.getByType(
            internshipId, 
            evaluationType as 'weekly' | 'midterm' | 'final'
        );
        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get evaluations by type error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get overdue evaluations
 * GET /api/evaluations/overdue?supervisor_id=xxx
 */
export async function getOverdueEvaluations(req: Request, res: Response) {
    try {
        const { supervisor_id } = req.query;
        const evaluations = await evaluationService.getOverdueEvaluations(supervisor_id as string);
        res.json({ success: true, data: evaluations });
    } catch (error: any) {
        console.error('Get overdue evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get evaluation progress summary for an internship
 * GET /api/evaluations/progress/:internshipId
 */
export async function getEvaluationProgress(req: Request, res: Response) {
    try {
        const internshipId = ensureString(req.params.internshipId, 'internshipId');
        const progress = await evaluationService.getProgressSummary(internshipId);
        res.json({ success: true, data: progress });
    } catch (error: any) {
        console.error('Get evaluation progress error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
