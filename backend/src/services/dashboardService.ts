import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class DashboardService {
  /**
   * Calculate system uptime based on API request logs
   */
  async calculateUptime(hoursBack: number = 24): Promise<number> {
    try {
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from('api_request_logs')
        .select('status_code')
        .gte('created_at', startTime);

      if (error) throw error;
      if (!logs || logs.length === 0) return 100; // Default if no data

      const successfulRequests = logs.filter(log => log.status_code >= 200 && log.status_code < 400).length;
      const uptimePercent = (successfulRequests / logs.length) * 100;

      return Math.round(uptimePercent * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Error calculating uptime:', error);
      return 100; // Default fallback
    }
  }

  /**
   * Calculate average response time from API logs
   */
  async calculateAverageResponseTime(hoursBack: number = 24): Promise<number> {
    try {
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from('api_request_logs')
        .select('response_time_ms')
        .gte('created_at', startTime);

      if (error) throw error;
      if (!logs || logs.length === 0) return 0;

      const totalResponseTime = logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0);
      const avgResponseTime = totalResponseTime / logs.length;

      return Math.round(avgResponseTime * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('Error calculating response time:', error);
      return 0;
    }
  }

  /**
   * Get latest CPU usage from system metrics
   */
  async getLatestCPUUsage(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('system_metrics_history')
        .select('metric_value')
        .eq('metric_name', 'cpu_usage')
        .order('recorded_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return 0;
      
      return data[0]?.metric_value || 0;
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return 0;
    }
  }

  /**
   * Calculate feature usage analytics
   */
  async calculateFeatureUsage(): Promise<Array<{ feature: string; usage_percent: number }>> {
    try {
      // AI Evaluations usage
      const { count: evalsCount } = await supabase
        .from('evaluations')
        .select('id', { count: 'exact', head: true });

      const { count: internshipsCount } = await supabase
        .from('internships')
        .select('id', { count: 'exact', head: true });

      const aiUsage = internshipsCount ? (evalsCount || 0) / internshipsCount * 100 : 0;

      // Document Collaboration usage
      const { count: docsWithCollab } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .not('collaboration_sessions', 'is', null);

      const { count: totalDocs } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true });

      const collabUsage = totalDocs ? (docsWithCollab || 0) / totalDocs * 100 : 0;

      // Real-time Chat usage (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: chatUsers } = await supabase
        .from('messages')
        .select('sender_id')
        .gte('created_at', thirtyDaysAgo);

      const { count: activeUsers } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const uniqueChatUsers = new Set(chatUsers?.map(m => m.sender_id) || []).size;
      const chatUsage = activeUsers ? (uniqueChatUsers / activeUsers) * 100 : 0;

      // Analytics Dashboard usage (last 30 days)
      const { count: activityLogs } = await supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const analyticsUsage = activeUsers ? (activityLogs || 0) / (activeUsers * 30) * 100 : 0;

      return [
        { feature: 'AI Evaluations', usage_percent: Math.min(Math.round(aiUsage * 10) / 10, 100) },
        { feature: 'Document Collaboration', usage_percent: Math.min(Math.round(collabUsage * 10) / 10, 100) },
        { feature: 'Real-time Chat', usage_percent: Math.min(Math.round(chatUsage * 10) / 10, 100) },
        { feature: 'Analytics Dashboard', usage_percent: Math.min(Math.round(analyticsUsage * 10) / 10, 100) }
      ];
    } catch (error) {
      console.error('Error calculating feature usage:', error);
      return [
        { feature: 'AI Evaluations', usage_percent: 0 },
        { feature: 'Document Collaboration', usage_percent: 0 },
        { feature: 'Real-time Chat', usage_percent: 0 },
        { feature: 'Analytics Dashboard', usage_percent: 0 }
      ];
    }
  }

  /**
   * Get user growth by role over months
   */
  async getUserGrowthByRole(monthsBack: number = 6): Promise<Array<{
    month: string;
    students: number;
    advisors: number;
    supervisors: number;
    admins: number;
  }>> {
    try {
      const result = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Get start and end of month
        const startOfMonth = new Date(year, month, 1).toISOString();
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

        // Count users by role created up to this month
        const { count: students } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'student')
          .lte('created_at', endOfMonth);

        const { count: advisors } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'advisor')
          .lte('created_at', endOfMonth);

        const { count: supervisors } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'supervisor')
          .lte('created_at', endOfMonth);

        const { count: admins } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin')
          .lte('created_at', endOfMonth);

        result.push({
          month: monthNames[month],
          students: students || 0,
          advisors: advisors || 0,
          supervisors: supervisors || 0,
          admins: admins || 0
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting user growth:', error);
      return [];
    }
  }

  /**
   * Get system performance metrics over hours
   */
  async getPerformanceMetrics(hoursBack: number = 24): Promise<Array<{
    time: string;
    response_time: number;
    cpu_usage: number;
    ai_processing: number;
  }>> {
    try {
      const result = [];

      for (let i = hoursBack - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 60 * 60 * 1000);
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = '00';
        const timeLabel = `${hour}:${minute}`;

        // Get start and end of hour
        const startOfHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0).toISOString();
        const endOfHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 59, 59).toISOString();

        // Average response time for this hour
        const { data: responseLogs } = await supabase
          .from('api_request_logs')
          .select('response_time_ms')
          .gte('created_at', startOfHour)
          .lte('created_at', endOfHour);

        const avgResponseTime = responseLogs && responseLogs.length > 0
          ? responseLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / responseLogs.length
          : 0;

        // Average CPU usage for this hour
        const { data: cpuMetrics } = await supabase
          .from('system_metrics_history')
          .select('metric_value')
          .eq('metric_name', 'cpu_usage')
          .gte('recorded_at', startOfHour)
          .lte('recorded_at', endOfHour);

        const avgCpuUsage = cpuMetrics && cpuMetrics.length > 0
          ? cpuMetrics.reduce((sum, metric) => sum + (metric.metric_value || 0), 0) / cpuMetrics.length
          : 0;

        // Average AI processing time for this hour
        const { data: aiMetrics } = await supabase
          .from('system_metrics_history')
          .select('metric_value')
          .eq('metric_name', 'ai_processing_time')
          .gte('recorded_at', startOfHour)
          .lte('recorded_at', endOfHour);

        const avgAiProcessing = aiMetrics && aiMetrics.length > 0
          ? aiMetrics.reduce((sum, metric) => sum + (metric.metric_value || 0), 0) / aiMetrics.length
          : 0;

        result.push({
          time: timeLabel,
          response_time: Math.round(avgResponseTime * 10) / 10,
          cpu_usage: Math.round(avgCpuUsage * 10) / 10,
          ai_processing: Math.round(avgAiProcessing * 10) / 10
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }
}

export default new DashboardService();
