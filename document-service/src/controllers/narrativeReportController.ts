import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { narrativeReportDocxGenerator, NarrativeReportData } from '../utils/narrativeReportDocxGenerator';

/**
 * Controller to generate and stream the CvSU Standard OJT Narrative Report (.docx)
 */
export async function generateNarrativeReport(req: AuthRequest, res: Response) {
  try {
    const data: NarrativeReportData = req.body;
    console.log('📝 [NarrativeReport] Generating report for:', data.studentName);

    if (!data.studentName) {
      return res.status(400).json({
        success: false,
        error: 'Student name is required.',
      });
    }

    const buffer = await narrativeReportDocxGenerator.generate(data);
    const safeStudentName = (data.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeStudentName}_OJT_Narrative_Report_CvSU.docx`;

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
    console.error('❌ [NarrativeReport] Error generating report:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate narrative report',
    });
  }
}
