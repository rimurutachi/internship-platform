import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import settingsService from '../../services/settingsService';
import multer from 'multer';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
    }
  }
}).single('avatar');

export class SettingsController {
  // Get admin profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, name, profile_data')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const profile = {
        id: user.id,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.profile_data?.phone || '',
        avatar_url: user.profile_data?.avatar_url || ''
      };

      res.status(200).json(profile);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  // Update admin profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { first_name, last_name, phone } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validation
      if (!first_name || !last_name) {
        res.status(400).json({ error: 'First name and last name are required' });
        return;
      }

      if (first_name.trim().length === 0 || last_name.trim().length === 0) {
        res.status(400).json({ error: 'First name and last name cannot be empty' });
        return;
      }

      // Validate phone if provided
      if (phone && phone.trim() !== '') {
        try {
          settingsService.validatePhone(phone);
        } catch (error: any) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      // Get current profile data
      const { data: currentUser } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', userId)
        .single();

      const updatedProfileData = {
        ...(currentUser?.profile_data || {}),
        phone: phone || null
      };

      // Update user profile
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          name: `${first_name.trim()} ${last_name.trim()}`,
          profile_data: updatedProfileData
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log activity
      await settingsService.logActivity(
        userId,
        'profile_updated',
        { first_name, last_name, phone }
      );

      res.status(200).json({
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.profile_data?.phone || '',
        avatar_url: updatedUser.profile_data?.avatar_url || ''
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  // Upload avatar
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    upload(req, res, async (err) => {
      try {
        const userId = (req as any).user?.id;

        if (!userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
            return;
          }
          res.status(400).json({ error: err.message });
          return;
        } else if (err) {
          res.status(400).json({ error: err.message });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(req.file.originalname);
        const filename = `${userId}_${timestamp}${ext}`;
        const filePath = `avatars/${userId}/${filename}`;

        // Upload to Supabase Storage
        const avatarUrl = await settingsService.uploadToStorage(
          req.file.buffer,
          'avatars',
          filePath,
          req.file.mimetype
        );

        // Update user profile with avatar URL
        const { data: currentUser } = await supabase
          .from('users')
          .select('profile_data')
          .eq('id', userId)
          .single();

        const updatedProfileData = {
          ...(currentUser?.profile_data || {}),
          avatar_url: avatarUrl
        };

        await supabase
          .from('users')
          .update({ profile_data: updatedProfileData })
          .eq('id', userId);

        // Log activity
        await settingsService.logActivity(userId, 'avatar_uploaded', { avatar_url: avatarUrl });

        res.status(200).json({ avatar_url: avatarUrl });
      } catch (error: any) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
      }
    });
  }

  // Get platform settings
  async getPlatformSettings(req: Request, res: Response): Promise<void> {
    try {
      const settingKeys = [
        'platform_name',
        'platform_url',
        'support_email',
        'max_file_upload_mb',
        'session_timeout_minutes',
        'platform_timezone',
        'platform_announcement'
      ];

      const { data: settings, error } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value')
        .in('setting_key', settingKeys);

      if (error) throw error;

      // Convert array to object with defaults
      const platformSettings: any = {
        platform_name: 'Intern-Galing',
        platform_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        support_email: 'support@intern-galing.com',
        max_file_upload_mb: 100,
        session_timeout_minutes: 30,
        platform_timezone: 'America/Los_Angeles',
        platform_announcement: ''
      };

      settings?.forEach((setting) => {
        platformSettings[setting.setting_key] = setting.setting_value;
      });

      res.status(200).json(platformSettings);
    } catch (error: any) {
      console.error('Get platform settings error:', error);
      res.status(500).json({ error: 'Failed to fetch platform settings' });
    }
  }

  // Update platform settings
  async updatePlatformSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const {
        platform_name,
        platform_url,
        support_email,
        max_file_upload_mb,
        session_timeout_minutes,
        platform_timezone,
        platform_announcement
      } = req.body;

      // Validation
      if (!platform_name || platform_name.trim().length === 0) {
        res.status(400).json({ error: 'Platform name is required' });
        return;
      }

      if (platform_name.length > 100) {
        res.status(400).json({ error: 'Platform name must be less than 100 characters' });
        return;
      }

      if (!platform_url) {
        res.status(400).json({ error: 'Platform URL is required' });
        return;
      }

      try {
        settingsService.validateUrl(platform_url);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (!support_email) {
        res.status(400).json({ error: 'Support email is required' });
        return;
      }

      try {
        settingsService.validateEmail(support_email);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (typeof max_file_upload_mb !== 'number' || max_file_upload_mb <= 0 || max_file_upload_mb > 1000) {
        res.status(400).json({ error: 'Max file upload size must be between 1 and 1000 MB' });
        return;
      }

      if (typeof session_timeout_minutes !== 'number' || session_timeout_minutes < 1 || session_timeout_minutes > 1440) {
        res.status(400).json({ error: 'Session timeout must be between 1 and 1440 minutes' });
        return;
      }

      try {
        settingsService.validateTimezone(platform_timezone);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (platform_announcement && platform_announcement.length > 1000) {
        res.status(400).json({ error: 'Platform announcement must be less than 1000 characters' });
        return;
      }

      // Update each setting
      const settingsToUpdate = [
        { key: 'platform_name', value: platform_name, type: 'platform', description: 'Platform display name' },
        { key: 'platform_url', value: platform_url, type: 'platform', description: 'Platform base URL' },
        { key: 'support_email', value: support_email, type: 'platform', description: 'Support contact email' },
        { key: 'max_file_upload_mb', value: max_file_upload_mb, type: 'platform', description: 'Maximum file upload size in MB' },
        { key: 'session_timeout_minutes', value: session_timeout_minutes, type: 'platform', description: 'Session timeout in minutes' },
        { key: 'platform_timezone', value: platform_timezone, type: 'platform', description: 'Platform timezone' },
        { key: 'platform_announcement', value: platform_announcement || '', type: 'platform', description: 'Platform-wide announcement' }
      ];

      for (const setting of settingsToUpdate) {
        await settingsService.updateSetting(setting.key, setting.value, setting.type, setting.description);
      }

      // Log activity
      await settingsService.logActivity(userId, 'platform_settings_updated', req.body);

      res.status(200).json({
        platform_name,
        platform_url,
        support_email,
        max_file_upload_mb,
        session_timeout_minutes,
        platform_timezone,
        platform_announcement
      });
    } catch (error: any) {
      console.error('Update platform settings error:', error);
      res.status(500).json({ error: 'Failed to update platform settings' });
    }
  }

  // Get notification settings
  async getNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const settingKeys = [
        'notify_system_alerts',
        'notify_user_management',
        'notify_security_events',
        'notify_platform_performance'
      ];

      const { data: settings, error } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value')
        .in('setting_key', settingKeys);

      if (error) throw error;

      // Convert array to object with defaults
      const notificationSettings: any = {
        notify_system_alerts: true,
        notify_user_management: true,
        notify_security_events: true,
        notify_platform_performance: false
      };

      settings?.forEach((setting) => {
        notificationSettings[setting.setting_key] = setting.setting_value;
      });

      res.status(200).json(notificationSettings);
    } catch (error: any) {
      console.error('Get notification settings error:', error);
      res.status(500).json({ error: 'Failed to fetch notification settings' });
    }
  }

  // Update notification settings
  async updateNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const {
        notify_system_alerts,
        notify_user_management,
        notify_security_events,
        notify_platform_performance
      } = req.body;

      // Validation
      if (typeof notify_system_alerts !== 'boolean' ||
          typeof notify_user_management !== 'boolean' ||
          typeof notify_security_events !== 'boolean' ||
          typeof notify_platform_performance !== 'boolean') {
        res.status(400).json({ error: 'All notification settings must be boolean values' });
        return;
      }

      // Update each setting
      const settingsToUpdate = [
        { key: 'notify_system_alerts', value: notify_system_alerts, type: 'notification', description: 'Enable system alerts notifications' },
        { key: 'notify_user_management', value: notify_user_management, type: 'notification', description: 'Enable user management notifications' },
        { key: 'notify_security_events', value: notify_security_events, type: 'notification', description: 'Enable security events notifications' },
        { key: 'notify_platform_performance', value: notify_platform_performance, type: 'notification', description: 'Enable platform performance notifications' }
      ];

      for (const setting of settingsToUpdate) {
        await settingsService.updateSetting(setting.key, setting.value, setting.type, setting.description);
      }

      // Log activity
      await settingsService.logActivity(userId, 'notification_settings_updated', req.body);

      res.status(200).json({
        notify_system_alerts,
        notify_user_management,
        notify_security_events,
        notify_platform_performance
      });
    } catch (error: any) {
      console.error('Update notification settings error:', error);
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  }

  // Get advanced settings
  async getAdvancedSettings(req: Request, res: Response): Promise<void> {
    try {
      const settingKeys = [
        'maintenance_mode_enabled',
        'api_rate_limit_per_minute',
        'last_backup_timestamp',
        'last_backup_size',
        'last_cache_clear_timestamp'
      ];

      const { data: settings, error } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value')
        .in('setting_key', settingKeys);

      if (error) throw error;

      // Convert array to object with defaults
      const advancedSettings: any = {
        maintenance_mode_enabled: false,
        api_rate_limit_per_minute: 1000,
        last_backup_timestamp: null,
        last_backup_size: null,
        last_cache_clear_timestamp: null
      };

      settings?.forEach((setting) => {
        advancedSettings[setting.setting_key] = setting.setting_value;
      });

      res.status(200).json(advancedSettings);
    } catch (error: any) {
      console.error('Get advanced settings error:', error);
      res.status(500).json({ error: 'Failed to fetch advanced settings' });
    }
  }

  // Update advanced settings
  async updateAdvancedSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { maintenance_mode_enabled, api_rate_limit_per_minute } = req.body;

      // Validation
      if (typeof maintenance_mode_enabled !== 'boolean') {
        res.status(400).json({ error: 'Maintenance mode must be a boolean value' });
        return;
      }

      if (typeof api_rate_limit_per_minute !== 'number' || 
          api_rate_limit_per_minute <= 0 || 
          api_rate_limit_per_minute > 10000) {
        res.status(400).json({ error: 'API rate limit must be between 1 and 10000 requests per minute' });
        return;
      }

      // Update settings
      await settingsService.updateSetting(
        'maintenance_mode_enabled',
        maintenance_mode_enabled,
        'system',
        'Maintenance mode enabled flag'
      );

      await settingsService.updateSetting(
        'api_rate_limit_per_minute',
        api_rate_limit_per_minute,
        'system',
        'API rate limit per minute'
      );

      // Log activity
      await settingsService.logActivity(userId, 'advanced_settings_updated', req.body);

      res.status(200).json({
        maintenance_mode_enabled,
        api_rate_limit_per_minute
      });
    } catch (error: any) {
      console.error('Update advanced settings error:', error);
      res.status(500).json({ error: 'Failed to update advanced settings' });
    }
  }

  // Trigger backup
  async triggerBackup(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      const backupResult = await settingsService.triggerBackup();

      // Log activity
      await settingsService.logActivity(userId, 'backup_triggered', backupResult);

      res.status(200).json(backupResult);
    } catch (error: any) {
      console.error('Trigger backup error:', error);
      
      if (error.message === 'Backup already in progress') {
        res.status(503).json({ error: 'Backup already in progress. Please wait.' });
        return;
      }

      res.status(500).json({ error: 'Failed to trigger backup' });
    }
  }

  // Clear cache
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      const result = await settingsService.clearSystemCache();

      // Log activity
      await settingsService.logActivity(userId, 'cache_cleared', result);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Clear cache error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  // Get system health
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await settingsService.getSystemHealth();
      res.status(200).json(health);
    } catch (error: any) {
      console.error('Get system health error:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }

  // Get timezones
  async getTimezones(req: Request, res: Response): Promise<void> {
    try {
      const timezones = settingsService.getTimezones();
      res.status(200).json({ timezones });
    } catch (error: any) {
      console.error('Get timezones error:', error);
      res.status(500).json({ error: 'Failed to fetch timezones' });
    }
  }
}

export default new SettingsController();
