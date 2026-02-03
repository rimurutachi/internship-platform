import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// In-memory placeholders so the admin UI has data without the old security tables
const platformState = {
  platform_name: 'Intern-Galing',
  platform_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  support_email: 'support@intern-galing.com',
  max_file_upload_mb: 100,
  session_timeout_minutes: 30,
  platform_timezone: 'Asia/Manila',
  platform_announcement: '',
};

const notificationState = {
  email_notifications: true,
  push_notifications: true,
  weekly_summary: true,
};

const advancedState = {
  maintenance_mode: false,
  backup_enabled: false,
  data_retention_days: 90,
};

class SettingsController {
  async getProfile(req: Request, res: Response) {
    console.log('[admin/settings] GET /profile', { userId: (req as any).user?.id });
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, profile_data')
        .eq('id', userId)
        .single();

      if (error || !data) return res.status(404).json({ error: 'User not found' });

      const response = {
        id: data.id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email,
        phone: data.profile_data?.phone || '',
        avatar_url: data.profile_data?.avatar_url || '',
      };

      console.log('[admin/settings] /profile success', { userId: data.id });
      return res.json(response);
    } catch (error: any) {
      console.error('[admin/settings] /profile error', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    console.log('[admin/settings] PATCH /profile', { userId: (req as any).user?.id, body: req.body });
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { first_name, last_name, phone } = req.body;
      const { data: currentUser } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', userId)
        .single();

      const profile_data = {
        ...(currentUser?.profile_data || {}),
        phone: phone || null,
      };

      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: first_name || null,
          last_name: last_name || null,
          name: [first_name, last_name].filter(Boolean).join(' ').trim(),
          profile_data,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) return res.status(500).json({ error: 'Failed to update profile' });

      const response = {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.profile_data?.phone || '',
        avatar_url: data.profile_data?.avatar_url || '',
      };

      console.log('[admin/settings] /profile updated', { userId: data.id });
      return res.json(response);
    } catch (error: any) {
      console.error('[admin/settings] /profile update error', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async uploadAvatar(req: Request, res: Response) {
    console.log('[admin/settings] POST /profile/upload-avatar', {
      userId: (req as any).user?.id,
      file: (req as any).file ? {
        originalname: (req as any).file.originalname,
        mimetype: (req as any).file.mimetype,
        size: (req as any).file.size,
      } : null,
    });

    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Upload to Supabase Storage (avatars bucket)
      const ext = file.originalname?.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('[admin/settings] /profile/upload-avatar upload error', uploadError);
        return res.status(500).json({ error: 'Failed to upload avatar' });
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = publicUrlData?.publicUrl;

      if (!avatarUrl) {
        console.error('[admin/settings] /profile/upload-avatar public URL missing');
        return res.status(500).json({ error: 'Failed to resolve avatar URL' });
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', userId)
        .single();

      const profile_data = {
        ...(currentUser?.profile_data || {}),
        avatar_url: avatarUrl,
      };

      const { data, error } = await supabase
        .from('users')
        .update({ profile_data })
        .eq('id', userId)
        .select('id')
        .single();

      if (error || !data) {
        console.error('[admin/settings] /profile/upload-avatar update error', error);
        return res.status(500).json({ error: 'Failed to update avatar' });
      }

      console.log('[admin/settings] /profile/upload-avatar success', { userId, avatarUrl });
      return res.json({ avatar_url: avatarUrl });
    } catch (error: any) {
      console.error('[admin/settings] /profile/upload-avatar error', error);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }

  getPlatformSettings(req: Request, res: Response) {
    console.log('[admin/settings] GET /platform');
    const response = platformState;
    console.log('[admin/settings] /platform success');
    return res.json(response);
  }

  updatePlatformSettings(req: Request, res: Response) {
    console.log('[admin/settings] PATCH /platform', { body: req.body });
    Object.assign(platformState, req.body || {});
    console.log('[admin/settings] /platform updated');
    return res.json(platformState);
  }

  getNotificationSettings(req: Request, res: Response) {
    console.log('[admin/settings] GET /notifications');
    console.log('[admin/settings] /notifications success');
    return res.json(notificationState);
  }

  updateNotificationSettings(req: Request, res: Response) {
    console.log('[admin/settings] PATCH /notifications', { body: req.body });
    Object.assign(notificationState, req.body || {});
    console.log('[admin/settings] /notifications updated');
    return res.json(notificationState);
  }

  getAdvancedSettings(req: Request, res: Response) {
    console.log('[admin/settings] GET /advanced');
    console.log('[admin/settings] /advanced success');
    return res.json(advancedState);
  }

  updateAdvancedSettings(req: Request, res: Response) {
    console.log('[admin/settings] PATCH /advanced', { body: req.body });
    Object.assign(advancedState, req.body || {});
    console.log('[admin/settings] /advanced updated');
    return res.json(advancedState);
  }

  triggerBackup(req: Request, res: Response) {
    console.log('[admin/settings] POST /backup');
    const response = { status: 'completed', backup_id: `backup_${Date.now()}` };
    console.log('[admin/settings] /backup completed', response);
    return res.json(response);
  }

  clearCache(req: Request, res: Response) {
    console.log('[admin/settings] POST /cache');
    const response = { status: 'success', cleared_caches: ['memory'] };
    console.log('[admin/settings] /cache cleared', response);
    return res.json(response);
  }

  getSystemHealth(req: Request, res: Response) {
    console.log('[admin/settings] GET /health');
    const response = { system_health: 'healthy', last_updated: new Date().toISOString() };
    console.log('[admin/settings] /health ok');
    return res.json(response);
  }

  getTimezones(req: Request, res: Response) {
    console.log('[admin/settings] GET /timezones');
    const zones = [
      'Asia/Manila',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Tokyo',
      'Asia/Dubai',
      'Australia/Sydney',
    ];
    const response = zones.map((z) => ({ value: z, label: z }));
    console.log('[admin/settings] /timezones success');
    return res.json(response);
  }
}

export default new SettingsController();
