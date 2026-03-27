/**
 * AI Service Routes
 * Proxies requests to the AI Service (FastAPI on port 8000)
 */
import { Router, Request, Response } from 'express';

const router = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';


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
