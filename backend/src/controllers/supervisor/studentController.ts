/**
 * Supervisor Student Controller
 * 
 * Handles HTTP requests for supervisor student management
 */

import { Request, Response } from 'express';
import supervisorStudentService from '../../services/supervisorStudentService';

// Extend Express Request type to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Get all students assigned to the logged-in supervisor
 */
export const getMyStudents = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.id;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const students = await supervisorStudentService.getMyStudents(supervisorId);

    // Prevent caching for dynamic data
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error: any) {
    console.error('Supervisor getMyStudents error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch students',
    });
  }
};

/**
 * Get detailed information about a specific student
 */
export const getStudentDetails = async (req: AuthRequest, res: Response) => {
  try {
    const supervisorId = req.user?.id;
    const { studentId } = req.params;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const student = await supervisorStudentService.getStudentDetails(
      supervisorId,
      studentId
    );

    return res.json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    console.error('Error fetching student details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch student details',
    });
  }
};
