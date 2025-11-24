import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client lazily
let supabase: SupabaseClient;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file'
      );
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

/**
 * Middleware to track all API requests for system metrics
 * Logs request details to api_request_logs table
 */
export const requestTracker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Capture response finish event
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      const userId = (req as any).user?.id || null;

      // Log to database
      await getSupabaseClient()
        .from('api_request_logs')
        .insert({
          method: req.method,
          path: req.path,
          status_code: res.statusCode,
          response_time_ms: responseTime,
          user_id: userId,
          ip_address: req.ip || req.socket.remoteAddress || null,
          user_agent: req.get('user-agent') || null,
          created_at: new Date().toISOString()
        });

      // Track in memory for real-time metrics
      if (global.systemMetrics) {
        global.systemMetrics.trackRequest(responseTime, res.statusCode >= 400);
        
        // Track session activity if user is authenticated
        // BUT NOT for logout endpoint (since user is logging out)
        if (userId && !req.path.includes('/auth/logout')) {
          global.systemMetrics.trackSession(userId);
        }
      }
    } catch (error) {
      // Silently fail to not disrupt request flow
      console.error('Failed to log request:', error);
    }
  });

  next();
};

// Declare global type for metrics tracker
declare global {
  var systemMetrics: {
    trackRequest: (responseTime: number, isError: boolean) => void;
    trackSession: (userId: string) => void;
    removeSession: (userId: string) => void;
    getActiveSessionsCount: () => number;
  } | undefined;
}
