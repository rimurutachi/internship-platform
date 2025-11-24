import { createSupabaseClient } from '../supabase';
import type {
  AdminProfile,
  PlatformSettings,
  NotificationSettings,
  AdvancedSettings,
  BackupStatus,
  CacheClearResult,
  SystemHealth,
  TimezonesResponse,
  UpdateProfileRequest,
  UploadAvatarResponse
} from '../../types/settings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

async function getAuthHeadersMultipart(): Promise<HeadersInit> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`
  };
}

export const adminSettingsAPI = {
  getProfile: async (): Promise<AdminProfile> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/profile`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<AdminProfile> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  },

  uploadAvatar: async (file: File): Promise<UploadAvatarResponse> => {
    const headers = await getAuthHeadersMultipart();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${API_BASE_URL}/api/admin/settings/profile/upload-avatar`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    return response.json();
  },

  getPlatformSettings: async (): Promise<PlatformSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/platform`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch platform settings');
    }

    return response.json();
  },

  updatePlatformSettings: async (settings: PlatformSettings): Promise<PlatformSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/platform`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update platform settings');
    }

    return response.json();
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/notifications`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notification settings');
    }

    return response.json();
  },

  updateNotificationSettings: async (settings: NotificationSettings): Promise<NotificationSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/notifications`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update notification settings');
    }

    return response.json();
  },

  getAdvancedSettings: async (): Promise<AdvancedSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/advanced`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch advanced settings');
    }

    return response.json();
  },

  updateAdvancedSettings: async (settings: Partial<AdvancedSettings>): Promise<AdvancedSettings> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/advanced`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update advanced settings');
    }

    return response.json();
  },

  triggerBackup: async (): Promise<BackupStatus> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/backup/trigger`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger backup');
    }

    return response.json();
  },

  clearCache: async (): Promise<CacheClearResult> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/cache/clear`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear cache');
    }

    return response.json();
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/health`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch system health');
    }

    return response.json();
  },

  getTimezones: async (): Promise<TimezonesResponse> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/settings/timezones`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch timezones');
    }

    return response.json();
  }
};
