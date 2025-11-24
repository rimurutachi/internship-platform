// Admin profile settings
export interface AdminProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

// Platform settings
export interface PlatformSettings {
  platform_name: string;
  platform_url: string;
  support_email: string;
  max_file_upload_mb: number;
  session_timeout_minutes: number;
  platform_timezone: string;
  platform_announcement?: string;
}

// Notification preferences
export interface NotificationSettings {
  notify_system_alerts: boolean;
  notify_user_management: boolean;
  notify_security_events: boolean;
  notify_platform_performance: boolean;
}

// Advanced settings
export interface AdvancedSettings {
  maintenance_mode_enabled: boolean;
  api_rate_limit_per_minute: number;
  last_backup_timestamp?: string | null;
  last_backup_size?: number | null;
  last_cache_clear_timestamp?: string | null;
}

// Backup status
export interface BackupStatus {
  backup_id?: string;
  status: 'starting' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp?: string;
  size?: number;
}

// Cache clear result
export interface CacheClearResult {
  cleared_caches: string[];
  status: string;
}

// System health
export interface SystemHealth {
  system_health: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  backup_status: string;
  cache_status: string;
  error_count?: number;
  failed_requests?: number;
  total_requests?: number;
}

// Timezone option
export interface Timezone {
  value: string;
  label: string;
}

// API response types
export interface TimezonesResponse {
  timezones: Timezone[];
}

// Update profile request
export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  phone?: string;
}

// Upload avatar response
export interface UploadAvatarResponse {
  avatar_url: string;
}
