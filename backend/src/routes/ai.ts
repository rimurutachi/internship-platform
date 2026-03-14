/**
 * AI Service Routes
 * Proxies requests to the AI Service (FastAPI on port 8000)
 */
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/ai/generate-narrative
 * Generate internship narrative from daily reports using AI
 * @access Authenticated users (students)
 */
router.post('/generate-narrative', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    console.log('🤖 [AI] Generate narrative request from user:', userId);
    
    const { 
      student_name,
      company_name,
      position,
      department,
      start_date,
      end_date,
      total_hours,
      daily_reports 
    } = req.body;

    // Validate required fields
    if (!student_name || !company_name || !position || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: student_name, company_name, position, start_date, end_date'
      });
    }

    if (!daily_reports || !Array.isArray(daily_reports) || daily_reports.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one daily report is required'
      });
    }

    console.log('📝 [AI] Generating narrative for', student_name, 'with', daily_reports.length, 'reports');

    // Forward to AI service
    const aiResponse = await fetch(`${AI_SERVICE_URL}/api/generate-narrative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name,
        company_name,
        position,
        department,
        start_date,
        end_date,
        total_hours,
        daily_reports
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ [AI] Service error:', aiResponse.status, errorText);
      return res.status(aiResponse.status).json({
        success: false,
        error: 'AI service error: ' + (errorText || aiResponse.statusText)
      });
    }

    const result = await aiResponse.json() as { word_count?: number };
    console.log('✅ [AI] Narrative generated:', result.word_count || 0, 'words');

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ [AI] Generate narrative error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate narrative: ' + error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Check AI service health status
 * @access Public
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const aiResponse = await fetch(`${AI_SERVICE_URL}/health`);
    const health = await aiResponse.json();
    
    return res.json({
      success: true,
      ai_service: health
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      error: 'AI service unavailable',
      message: error.message
    });
  }
});

export default router;
