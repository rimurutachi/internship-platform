import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  details: {
    critical_alerts?: number;
    active_alerts?: number;
    failed_logins_last_hour?: number;
    api_errors_last_hour?: number;
  };
}

interface LoginAttemptResult {
  logged: boolean;
  alert_created: boolean;
  should_lock_account?: boolean;
}

class SecurityService {
  // Calculate overall security health
  async calculateSecurityHealth(): Promise<SecurityHealth> {
    try {
      // Count critical alerts
      const { count: criticalAlerts } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .eq('is_resolved', false);

      // Count all active alerts
      const { count: activeAlerts } = await supabase
        .from('security_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      // Count failed logins in last hour
      const { count: failedLogins } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Count API errors in last hour
      const { count: apiErrors } = await supabase
        .from('api_request_logs')
        .select('*', { count: 'exact', head: true })
        .gte('status_code', 500)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Calculate health score (0-100)
      let score = 100;
      score -= (criticalAlerts || 0) * 20;
      score -= (activeAlerts || 0) * 5;
      score -= Math.min((failedLogins || 0) * 2, 20);
      score -= Math.min((apiErrors || 0), 10);
      score = Math.max(0, score);

      // Determine status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalAlerts && criticalAlerts > 0) status = 'critical';
      else if (score < 70) status = 'warning';

      return {
        status,
        score,
        details: {
          critical_alerts: criticalAlerts || 0,
          active_alerts: activeAlerts || 0,
          failed_logins_last_hour: failedLogins || 0,
          api_errors_last_hour: apiErrors || 0
        }
      };
    } catch (error) {
      console.error('Error calculating security health:', error);
      return { status: 'warning', score: 50, details: {} };
    }
  }

  // Detect and log suspicious activity
  async detectSuspiciousActivity(
    userId: string, 
    action: string, 
    metadata: Record<string, any>
  ): Promise<string | null> {
    try {
      // Define suspicious patterns
      const suspiciousPatterns = {
        rapid_requests: metadata.request_count > 100, // More than 100 requests in short time
        unusual_time: new Date().getHours() < 5, // Activity between midnight and 5am
        failed_auth: metadata.failed_attempts > 3,
        data_export: action.includes('export') && metadata.record_count > 1000,
        privilege_escalation: action.includes('role') || action.includes('permission')
      };

      const detectedPatterns = Object.entries(suspiciousPatterns)
        .filter(([_, detected]) => detected)
        .map(([pattern]) => pattern);

      if (detectedPatterns.length === 0) return null;

      // Create security alert
      const { data, error } = await supabase
        .from('security_alerts')
        .insert({
          alert_type: 'suspicious_activity',
          severity: detectedPatterns.length >= 2 ? 'high' : 'medium',
          affected_user_id: userId,
          description: `Suspicious activity detected: ${detectedPatterns.join(', ')}`,
          metadata: {
            action,
            patterns: detectedPatterns,
            ...metadata
          },
          is_acknowledged: false,
          is_resolved: false
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return null;
    }
  }

  // Generate audit log entry
  async logAuditEvent(
    userId: string, 
    action: string, 
    resource: string, 
    details: Record<string, any>
  ): Promise<string | null> {
    try {
      // Log to api_request_logs (or activity_log if available)
      const { data, error } = await supabase
        .from('api_request_logs')
        .insert({
          user_id: userId,
          method: details.method || 'UNKNOWN',
          path: `/${resource}`,
          status_code: details.status_code || 200,
          response_time_ms: details.response_time_ms || 0,
          ip_address: details.ip_address,
          user_agent: details.user_agent
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return null;
    }
  }

  // Log login attempt
  async logLoginAttempt(
    email: string, 
    success: boolean, 
    ip: string | null, 
    userAgent: string | null, 
    failureReason?: string | null
  ): Promise<LoginAttemptResult> {
    try {
      // Get user_id if exists
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      // Log the attempt
      await supabase
        .from('login_attempts')
        .insert({
          user_id: user?.id,
          email,
          ip_address: ip,
          success,
          failure_reason: failureReason,
          user_agent: userAgent
        });

      // If failed, check if we should create an alert
      if (!success) {
        const failedCount = await this.getFailedLoginCount(email, 60);
        const threshold = 5; // Get from security_settings

        if (failedCount >= threshold) {
          // Create security alert
          await supabase
            .from('security_alerts')
            .insert({
              alert_type: 'failed_login',
              severity: failedCount >= threshold * 2 ? 'high' : 'medium',
              affected_user_id: user?.id,
              description: `Multiple failed login attempts detected for ${email} (${failedCount} attempts in last hour)`,
              metadata: {
                email,
                failed_count: failedCount,
                ip_address: ip,
                user_agent: userAgent
              },
              is_acknowledged: false,
              is_resolved: false
            });

          return { 
            logged: true, 
            alert_created: true, 
            should_lock_account: failedCount >= threshold * 2 
          };
        }
      }

      return { logged: true, alert_created: false };
    } catch (error) {
      console.error('Error logging login attempt:', error);
      return { logged: false, alert_created: false };
    }
  }

  // Get failed login count
  async getFailedLoginCount(email: string, windowMinutes: number = 60): Promise<number> {
    try {
      const { count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

      return count || 0;
    } catch (error) {
      console.error('Error getting failed login count:', error);
      return 0;
    }
  }

  // Mask IP address for display
  maskIpAddress(ip: string | null): string {
    if (!ip) return '***.***.***.***';
    
    const parts = ip.split('.');
    if (parts.length !== 4) return '***.***.***.***';
    
    // Mask middle two octets
    return `${parts[0]}.***.***.${parts[3]}`;
  }

  // Check if IP should be shown based on settings
  async shouldShowIpAddress(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'show_ip_in_logs')
        .single();

      return data?.setting_value?.enabled || false;
    } catch (error) {
      return false;
    }
  }

  // Get security setting value
  async getSecuritySetting(key: string): Promise<any> {
    try {
      const { data } = await supabase
        .from('security_settings')
        .select('setting_value, setting_type')
        .eq('setting_key', key)
        .single();

      if (!data) return null;

      // Extract value based on type
      if (data.setting_type === 'boolean') {
        return data.setting_value?.enabled || false;
      } else if (data.setting_type === 'number') {
        return data.setting_value?.value || 0;
      }
      
      return data.setting_value;
    } catch (error) {
      console.error(`Error getting security setting ${key}:`, error);
      return null;
    }
  }
}

export default new SecurityService();
