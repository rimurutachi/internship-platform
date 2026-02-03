export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource: string;
  entity_type?: string;
  status: 'success' | 'failed';
  ip_address: string;
  user_agent?: string;
  description?: string;
  created_at: string;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_user_id?: string;
  description: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  is_resolved: boolean;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  success: boolean;
  failure_reason?: string;
  user_agent?: string;
  created_at: string;
}

export interface SecuritySettings {
  twofa_required: boolean;
  ip_whitelist_enabled: boolean;
  session_timeout_minutes: number;
  api_key_rotation_days: number;
  show_ip_in_logs: boolean;
  failed_login_threshold: number;
}

export interface SecurityHealth {
  status: 'healthy' | 'warning' | 'critical';
  encryption: boolean;
  tls: boolean;
  active_alerts: number;
  failed_logins_last_hour: number;
}
