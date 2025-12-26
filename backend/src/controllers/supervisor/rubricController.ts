/**
 * Evaluation Rubric Controller
 * 
 * Handles HTTP requests for evaluation rubric operations
 */

import { Request, Response } from 'express';
import evaluationRubricService from '../../services/evaluationRubricService';

// Extend Express Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    university_id?: string;
  };
}

/**
 * Get the active rubric for the logged-in user's university
 */
export const getActiveRubric = async (req: AuthRequest, res: Response) => {
  try {
    const universityId = req.user?.university_id;

    if (!universityId) {
      return res.status(400).json({ 
        success: false,
        error: 'University ID not found for user' 
      });
    }

    const rubric = await evaluationRubricService.getActiveRubric(universityId);

    if (!rubric) {
      return res.status(404).json({
        success: false,
        error: 'No active rubric found for your university',
      });
    }

    return res.json({
      success: true,
      data: rubric,
    });
  } catch (error: any) {
    console.error('Error fetching active rubric:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch active rubric',
    });
  }
};

/**
 * Get all rubrics for the logged-in user's university
 */
export const getRubricsByUniversity = async (req: AuthRequest, res: Response) => {
  try {
    const universityId = req.user?.university_id;

    if (!universityId) {
      return res.status(400).json({ 
        success: false,
        error: 'University ID not found for user' 
      });
    }

    const rubrics = await evaluationRubricService.getRubricsByUniversity(universityId);

    return res.json({
      success: true,
      data: rubrics,
      count: rubrics.length,
    });
  } catch (error: any) {
    console.error('Error fetching rubrics:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch rubrics',
    });
  }
};

/**
 * Get a specific rubric by ID
 */
export const getRubricById = async (req: AuthRequest, res: Response) => {
  try {
    const { rubricId } = req.params;

    if (!rubricId) {
      return res.status(400).json({ 
        success: false,
        error: 'Rubric ID is required' 
      });
    }

    const rubric = await evaluationRubricService.getRubricById(rubricId);

    if (!rubric) {
      return res.status(404).json({
        success: false,
        error: 'Rubric not found',
      });
    }

    return res.json({
      success: true,
      data: rubric,
    });
  } catch (error: any) {
    console.error('Error fetching rubric:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch rubric',
    });
  }
};
