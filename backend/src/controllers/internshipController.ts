import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { internshipService } from '../services/internship.service';
import { ensureString } from '../utils/typeGuards';

export async function createInternship(req: Request, res: Response) {
    try {
        const internship = await internshipService.create(req.body);
        res.status(201).json({ success: true, data: internship });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
}

export async function getInternship(req: Request, res: Response) {
    try {
        const internship = await internshipService.getById(ensureString(req.params.id, 'id'));
        if (!internship) {
            return res.status(404).json({success: false, error: 'Internship not found.'});
        }
        res.json({success: true, data: internship});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function getAllInternships(req: Request, res: Response) {
    try {
        const internships = await internshipService.getAll(req.query);
        res.json({success: true, data: internships, count: internships.length});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function updateInternship(req: Request, res: Response) {
    try {
        const internship = await internshipService.update(ensureString(req.params.id, 'id'), req.body);
        res.json({success: true, data: internship});
    } catch (error: any) {
        res.status(400).json({success: false, error: error.message});
    }
}

export async function deleteInternship(req: Request, res: Response) {
    try {
        await internshipService.delete(ensureString(req.params.id, 'id'));
        res.json({success: true, message: 'Internship deleted successfully.'});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message});
    }
}

export async function getMyInternships(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({success: false, error: 'User not authenticated'});
        }

        let internships;
        if (userRole === 'student') {
            internships = await internshipService.getStudentInternships(userId);
        } else if (userRole === 'advisor') {
            internships = await internshipService.getAdvisorInternships(userId);
        } else if (userRole === 'supervisor') {
            internships = await internshipService.getSupervisorInternships(userId);
        } else {
            return res.status(403).json({success: false, error: 'Unauthorized role'});
        }

    res.json({success: true, data: internships});
    } catch (error: any) {
        res.status(500).json({success: false, error: error.message})
    }
}