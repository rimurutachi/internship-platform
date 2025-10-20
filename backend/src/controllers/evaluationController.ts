import { Request, Response } from "express";
import { EvaluationService } from "../services/evaluationService";

const evaluationService = new EvaluationService();

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