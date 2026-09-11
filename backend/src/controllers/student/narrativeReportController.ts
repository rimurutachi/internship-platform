import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { narrativeReportService } from '../../services/narrativeReportService';

export const narrativeReportController = {
  /**
   * GET /api/student/narrative-report/eligibility
   * Check if current student has rendered >= 80% hours and fetch metadata
   */
  async getEligibility(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await narrativeReportService.checkEligibility(studentId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ [NarrativeReportController] getEligibility error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to check eligibility',
      });
    }
  },

  /**
   * GET /api/student/narrative-report/writing-guide
   * Get ethical AI writing prompts and section guides
   */
  async getWritingGuide(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await narrativeReportService.getWritingGuide(studentId);
      return res.json(result);
    } catch (error: any) {
      console.error('❌ [NarrativeReportController] getWritingGuide error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve writing guide',
      });
    }
  },

  /**
   * POST /api/student/narrative-report/generate
   * Validate >= 80% requirement and generate downloadable .docx document
   */
  async generateReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const customMetadata = req.body || {};
      const authToken = req.headers.authorization;

      const { buffer, fileName } = await narrativeReportService.generateDocx(
        studentId,
        customMetadata,
        authToken
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      res.setHeader('Content-Length', buffer.length);

      return res.send(buffer);
    } catch (error: any) {
      console.error('❌ [NarrativeReportController] generateReport error:', error);
      const isForbidden = error.message?.includes('Ineligible');
      return res.status(isForbidden ? 403 : 500).json({
        success: false,
        error: error.message || 'Failed to generate narrative report',
      });
    }
  },
};
