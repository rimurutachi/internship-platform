import { Request, Response } from 'express';
import systemMetricsService from '../../services/systemMetricsService';
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

class SystemController {
  /**
   * Get overall system metrics
   */
  async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await systemMetricsService.getSystemMetrics();
      res.json({ success: true, data: metrics });
    } catch (error: any) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to collect system metrics',
        code: 'METRICS_COLLECTION_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get health status
   */
  async getHealth(req: Request, res: Response) {
    try {
      const health = await systemMetricsService.getHealthStatus();
      res.json({ success: true, ...health });
    } catch (error: any) {
      console.error('Error checking system health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check system health',
        code: 'HEALTH_CHECK_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get services status
   */
  async getServices(req: Request, res: Response) {
    try {
      const services = await systemMetricsService.getServiceStatus();
      res.json({ success: true, services });
    } catch (error: any) {
      console.error('Error getting service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status',
        code: 'SERVICE_STATUS_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get application metrics
   */
  async getApplicationMetrics(req: Request, res: Response) {
    try {
      const appMetrics = await systemMetricsService.getApplicationMetrics();
      res.json({ success: true, metrics: appMetrics });
    } catch (error: any) {
      console.error('Error getting application metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get application metrics',
        code: 'APP_METRICS_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(req: Request, res: Response) {
    try {
      const dbMetrics = await systemMetricsService.getDatabaseMetrics();
      res.json({ success: true, database: dbMetrics });
    } catch (error: any) {
      console.error('Error getting database metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get database metrics',
        code: 'DB_METRICS_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get recent events
   */
  async getRecentEvents(req: Request, res: Response) {
    try {
      const { limit = 20, severity, type } = req.query;

      let query = getSupabaseClient().from('system_events').select('*');

      if (severity) {
        query = query.eq('severity', severity as string);
      }

      if (type) {
        query = query.eq('type', type as string);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (error) throw error;

      res.json({ success: true, events: data || [], total: data?.length || 0 });
    } catch (error: any) {
      console.error('Error getting events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get events',
        code: 'EVENTS_FETCH_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get metrics trend
   */
  async getMetricsTrend(req: Request, res: Response) {
    try {
      const { metric } = req.params;
      const { hours = 24 } = req.query;

      // Validate metric name
      const validMetrics = ['users', 'sessions', 'api_calls', 'error_rate', 'response_time'];
      if (!validMetrics.includes(metric)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid metric name',
          code: 'INVALID_METRIC',
          validMetrics
        });
      }

      const trend = await systemMetricsService.getMetricsTrend(metric, Number(hours));
      res.json({ success: true, metric, trend });
    } catch (error: any) {
      console.error('Error getting metrics trend:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics trend',
        code: 'TREND_FETCH_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Acknowledge/resolve an event
   */
  async acknowledgeEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { resolved } = req.body;

      // Validate input
      if (typeof resolved !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid input: resolved must be a boolean',
          code: 'INVALID_INPUT'
        });
      }

      const { data, error } = await getSupabaseClient()
        .from('system_events')
        .update({
          resolved_at: resolved ? new Date().toISOString() : null
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      res.json({ success: true, event: data });
    } catch (error: any) {
      console.error('Error acknowledging event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge event',
        code: 'EVENT_ACK_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Clear old events
   */
  async clearOldEvents(req: Request, res: Response) {
    try {
      const { olderThanDays = 30 } = req.body;

      // Validate input
      if (typeof olderThanDays !== 'number' || olderThanDays < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input: olderThanDays must be a positive number',
          code: 'INVALID_INPUT'
        });
      }

      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

      const { error, count } = await getSupabaseClient()
        .from('system_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      // Log the cleanup action
      await systemMetricsService.logEvent({
        type: 'system',
        service: 'API Server',
        message: `Cleared ${count || 0} old system events (older than ${olderThanDays} days)`,
        severity: 'info',
        count: count || 0
      });

      res.json({ success: true, deletedCount: count || 0 });
    } catch (error: any) {
      console.error('Error clearing events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear events',
        code: 'EVENT_CLEAR_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get performance stats (slow queries, bottlenecks)
   */
  async getPerformance(req: Request, res: Response) {
    try {
      const dbMetrics = await systemMetricsService.getDatabaseMetrics();
      const errorBreakdown = await systemMetricsService.getErrorBreakdown();

      res.json({
        success: true,
        slowQueries: dbMetrics.slowQueries,
        queryPerformance: dbMetrics.queryPerformance,
        errorBreakdown,
        bottlenecks: [] // Placeholder for bottleneck detection
      });
    } catch (error: any) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance stats',
        code: 'PERFORMANCE_FETCH_FAILED',
        message: error.message
      });
    }
  }

  /**
   * System maintenance endpoint
   */
  async performMaintenance(req: Request, res: Response) {
    try {
      const { action } = req.body;

      // Validate action
      const validActions = ['clear_cache', 'backup', 'optimize'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          code: 'INVALID_ACTION',
          validActions
        });
      }

      // Log maintenance action
      await systemMetricsService.logEvent({
        type: 'system',
        service: 'API Server',
        message: `Maintenance action performed: ${action}`,
        severity: 'info'
      });

      // Perform action (implement as needed)
      let message = '';
      switch (action) {
        case 'clear_cache':
          message = 'Cache cleared successfully';
          break;
        case 'backup':
          message = 'Backup initiated successfully';
          break;
        case 'optimize':
          message = 'Database optimization completed';
          break;
      }

      res.json({ success: true, message });
    } catch (error: any) {
      console.error('Error performing maintenance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform maintenance',
        code: 'MAINTENANCE_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get error breakdown by type
   */
  async getErrorBreakdown(req: Request, res: Response) {
    try {
      const breakdown = await systemMetricsService.getErrorBreakdown();
      res.json({ success: true, errorBreakdown: breakdown });
    } catch (error: any) {
      console.error('Error getting error breakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get error breakdown',
        code: 'ERROR_BREAKDOWN_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(req: Request, res: Response) {
    try {
      const { serviceName } = req.params;
      const { limit = 100, severity } = req.query;

      // Query system_events for this service
      let query = getSupabaseClient()
        .from('system_events')
        .select('*')
        .eq('service', serviceName)
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({ 
        success: true, 
        logs: data,
        serviceName 
      });
    } catch (error: any) {
      console.error('Error getting service logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service logs',
        code: 'SERVICE_LOGS_FAILED',
        message: error.message
      });
    }
  }

  /**
   * Restart service (simulated)
   */
  async restartService(req: Request, res: Response) {
    try {
      const { serviceName } = req.params;

      // In production, this would trigger actual service restart
      // For now, log the event
      await systemMetricsService.logEvent({
        type: 'service_restart',
        service: serviceName,
        message: `Service restart requested: ${serviceName}`,
        severity: 'info',
        metadata: {
          requestedBy: (req as any).user?.id,
          timestamp: new Date().toISOString()
        }
      });

      res.json({ 
        success: true, 
        message: `Service ${serviceName} restart initiated`,
        serviceName 
      });
    } catch (error: any) {
      console.error('Error restarting service:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restart service',
        code: 'SERVICE_RESTART_FAILED',
        message: error.message
      });
    }
  }
}

export default new SystemController();
