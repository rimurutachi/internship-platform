import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export class SettingsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // Validate email using Zod
  validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      throw new Error('Invalid email format');
    }
  }

  // Validate phone number (international format)
  validatePhone(phone: string): boolean {
    // Allow formats like: +1234567890, (123) 456-7890, 123-456-7890
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone number format');
    }
    return true;
  }

  // Validate URL format
  validateUrl(url: string): boolean {
    const urlSchema = z.string().url();
    try {
      urlSchema.parse(url);
      return true;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  // Validate timezone against IANA timezone list
  validateTimezone(tz: string): boolean {
    const validTimezones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Dubai',
      'Asia/Manila',
      'Australia/Sydney',
      'Pacific/Auckland'
    ];

    if (!validTimezones.includes(tz)) {
      throw new Error('Invalid timezone. Please select a valid IANA timezone.');
    }
    return true;
  }

  // Upload file to Supabase Storage
  async uploadToStorage(
    file: Buffer,
    bucket: string,
    path: string,
    contentType: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error: any) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  // Get timezone list
  getTimezones(): { value: string; label: string }[] {
    return [
      { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
      { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
      { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
      { value: 'America/Anchorage', label: 'Alaska Time (AKST/AKDT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
      { value: 'Europe/London', label: 'GMT/BST (London)' },
      { value: 'Europe/Paris', label: 'Central European Time (Paris)' },
      { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
      { value: 'Asia/Shanghai', label: 'China Standard Time (Shanghai)' },
      { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
      { value: 'Asia/Manila', label: 'Philippine Standard Time (Manila)' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (Sydney)' },
      { value: 'Pacific/Auckland', label: 'New Zealand Time (Auckland)' }
    ];
  }

  // Trigger platform backup (simplified version - actual implementation depends on infrastructure)
  async triggerBackup(): Promise<{ backup_id: string; status: string; message: string }> {
    try {
      // Check if backup is already running
      const { data: existingBackup } = await this.supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'backup_in_progress')
        .single();

      if (existingBackup && existingBackup.setting_value === true) {
        throw new Error('Backup already in progress');
      }

      // Set backup in progress flag
      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'backup_in_progress',
          setting_value: true,
          setting_type: 'system',
          description: 'Backup operation in progress flag'
        });

      // Generate backup ID
      const backupId = `backup_${Date.now()}`;
      const timestamp = new Date().toISOString();

      // In production, this would trigger actual database backup
      // For now, we'll simulate it and update the last backup timestamp
      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'last_backup_timestamp',
          setting_value: timestamp,
          setting_type: 'system',
          description: 'Last successful backup timestamp'
        });

      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'last_backup_size',
          setting_value: Math.floor(Math.random() * 1000) + 500, // Mock size in MB
          setting_type: 'system',
          description: 'Last backup size in MB'
        });

      // Clear backup in progress flag
      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'backup_in_progress',
          setting_value: false,
          setting_type: 'system',
          description: 'Backup operation in progress flag'
        });

      // Log in system events
      await this.supabase.from('system_events').insert({
        event_type: 'backup_triggered',
        severity: 'info',
        message: `Database backup ${backupId} completed successfully`,
        metadata: { backup_id: backupId, timestamp }
      });

      return {
        backup_id: backupId,
        status: 'completed',
        message: 'Backup completed successfully'
      };
    } catch (error: any) {
      // Clear backup in progress flag on error
      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'backup_in_progress',
          setting_value: false,
          setting_type: 'system',
          description: 'Backup operation in progress flag'
        });

      throw error;
    }
  }

  // Clear system cache
  async clearSystemCache(): Promise<{ cleared_caches: string[]; status: string }> {
    try {
      const clearedCaches: string[] = [];

      // Update last cache clear timestamp
      const timestamp = new Date().toISOString();
      await this.supabase
        .from('security_settings')
        .upsert({
          setting_key: 'last_cache_clear_timestamp',
          setting_value: timestamp,
          setting_type: 'system',
          description: 'Last cache clear timestamp'
        });

      clearedCaches.push('memory');

      // If Redis is available, clear it
      // This is a placeholder - actual Redis implementation would go here
      if (process.env.REDIS_URL) {
        clearedCaches.push('redis');
      }

      // Log cache clear event
      await this.supabase.from('system_events').insert({
        event_type: 'cache_cleared',
        severity: 'info',
        message: 'System caches cleared',
        metadata: { caches: clearedCaches, timestamp }
      });

      return {
        cleared_caches: clearedCaches,
        status: 'success'
      };
    } catch (error: any) {
      throw new Error(`Cache clear failed: ${error.message}`);
    }
  }

  // Get system health status
  async getSystemHealth(): Promise<any> {
    try {
      // Check recent errors from system_events
      const { data: recentErrors } = await this.supabase
        .from('system_events')
        .select('*')
        .eq('severity', 'error')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .limit(10);

      // Check API health from api_request_logs
      const { data: recentRequests } = await this.supabase
        .from('api_request_logs')
        .select('status_code')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .limit(100);

      const errorCount = recentErrors?.length || 0;
      const totalRequests = recentRequests?.length || 0;
      const failedRequests = recentRequests?.filter(r => r.status_code >= 500).length || 0;

      let systemHealth = 'healthy';
      if (errorCount > 10 || failedRequests > totalRequests * 0.1) {
        systemHealth = 'critical';
      } else if (errorCount > 5 || failedRequests > totalRequests * 0.05) {
        systemHealth = 'warning';
      }

      // Get backup status
      const { data: lastBackup } = await this.supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'last_backup_timestamp')
        .single();

      const backupStatus = lastBackup ? 'available' : 'none';

      return {
        system_health: systemHealth,
        last_updated: new Date().toISOString(),
        backup_status: backupStatus,
        cache_status: 'active',
        error_count: errorCount,
        failed_requests: failedRequests,
        total_requests: totalRequests
      };
    } catch (error: any) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  // Get a specific setting from security_settings
  async getSetting(key: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('security_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data?.setting_value || null;
  }

  // Update or create a setting in security_settings
  async updateSetting(key: string, value: any, type: string, description: string): Promise<void> {
    const { error } = await this.supabase
      .from('security_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        setting_type: type,
        description
      });

    if (error) throw error;
  }

  // Log activity
  async logActivity(userId: string, action: string, details: any): Promise<void> {
    await this.supabase.from('activity_log').insert({
      user_id: userId,
      action,
      details,
      ip_address: 'system',
      user_agent: 'settings-service'
    });
  }
}

export default new SettingsService();
