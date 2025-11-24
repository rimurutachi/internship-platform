import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dashboardService from '../../services/dashboardService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class DashboardController {
  /**
   * Get all KPI metrics for dashboard cards
   * GET /admin/dashboard/kpis
   */
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      // Total Active Users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      if (usersError) throw usersError;

      // System Uptime (last 24h)
      const systemUptime = await dashboardService.calculateUptime(24);

      // Average Response Time (last 24h)
      const responseTime = await dashboardService.calculateAverageResponseTime(24);

      // CPU Usage (latest)
      const cpuUsage = await dashboardService.getLatestCPUUsage();

      // Active Internships
      const { count: activeInternships, error: internshipsError } = await supabase
        .from('internships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      if (internshipsError) throw internshipsError;

      // Security Alerts (last 24h)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: securityAlerts, error: alertsError } = await supabase
        .from('security_alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo);

      if (alertsError) throw alertsError;

      res.json({
        success: true,
        data: {
          total_users: totalUsers || 0,
          system_uptime: systemUptime,
          response_time: responseTime,
          cpu_usage: cpuUsage,
          active_internships: activeInternships || 0,
          security_alerts_24h: securityAlerts || 0
        }
      });
    } catch (error) {
      console.error('Error getting KPIs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch KPI metrics'
      });
    }
  }

  /**
   * Get user growth by role over months
   * GET /admin/dashboard/usage-engagement?months=6
   */
  async getUsageEngagement(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;
      
      const data = await dashboardService.getUserGrowthByRole(months);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting usage engagement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch usage engagement data'
      });
    }
  }

  /**
   * Get system performance metrics over hours
   * GET /admin/dashboard/performance-metrics?hours=24
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      
      const data = await dashboardService.getPerformanceMetrics(hours);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance metrics'
      });
    }
  }

  /**
   * Get feature usage analytics
   * GET /admin/dashboard/feature-usage
   */
  async getFeatureUsage(req: Request, res: Response): Promise<void> {
    try {
      const data = await dashboardService.calculateFeatureUsage();

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error getting feature usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feature usage analytics'
      });
    }
  }

  /**
   * Get complete dashboard overview (all data in one call)
   * GET /admin/dashboard/overview
   */
  async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      // Fetch all data in parallel for better performance
      const [
        kpisResult,
        usageEngagement,
        performanceMetrics,
        featureUsage
      ] = await Promise.all([
        this.fetchKPIsData(),
        dashboardService.getUserGrowthByRole(6),
        dashboardService.getPerformanceMetrics(24),
        dashboardService.calculateFeatureUsage()
      ]);

      res.json({
        success: true,
        data: {
          kpis: kpisResult,
          usage_engagement: usageEngagement,
          performance_metrics: performanceMetrics,
          feature_usage: featureUsage
        }
      });
    } catch (error) {
      console.error('Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard overview'
      });
    }
  }

  /**
   * Helper method to fetch KPIs data (used by getDashboardOverview)
   */
  private async fetchKPIsData() {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const systemUptime = await dashboardService.calculateUptime(24);
    const responseTime = await dashboardService.calculateAverageResponseTime(24);
    const cpuUsage = await dashboardService.getLatestCPUUsage();

    const { count: activeInternships } = await supabase
      .from('internships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: securityAlerts } = await supabase
      .from('security_alerts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo);

    return {
      total_users: totalUsers || 0,
      system_uptime: systemUptime,
      response_time: responseTime,
      cpu_usage: cpuUsage,
      active_internships: activeInternships || 0,
      security_alerts_24h: securityAlerts || 0
    };
  }
}

export default new DashboardController();
