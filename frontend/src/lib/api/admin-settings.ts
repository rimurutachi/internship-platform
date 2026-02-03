import { apiClient } from './client';
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

export const adminSettingsAPI = {
  getProfile: async (): Promise<AdminProfile> => {
    const response = await apiClient.get('/admin/settings/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<AdminProfile> => {
    const response = await apiClient.patch('/admin/settings/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<UploadAvatarResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/admin/settings/profile/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPlatformSettings: async (): Promise<PlatformSettings> => {
    const response = await apiClient.get('/admin/settings/platform');
    return response.data;
  },

  updatePlatformSettings: async (data: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    const response = await apiClient.patch('/admin/settings/platform', data);
    return response.data;
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get('/admin/settings/notifications');
    return response.data;
  },

  updateNotificationSettings: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const response = await apiClient.patch('/admin/settings/notifications', data);
    return response.data;
  },

  getAdvancedSettings: async (): Promise<AdvancedSettings> => {
    const response = await apiClient.get('/admin/settings/advanced');
    return response.data;
  },

  updateAdvancedSettings: async (data: Partial<AdvancedSettings>): Promise<AdvancedSettings> => {
    const response = await apiClient.patch('/admin/settings/advanced', data);
    return response.data;
  },

  triggerBackup: async (): Promise<BackupStatus> => {
    const response = await apiClient.post('/admin/settings/backup/trigger');
    return response.data;
  },

  clearCache: async (): Promise<CacheClearResult> => {
    const response = await apiClient.post('/admin/settings/cache/clear');
    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await apiClient.get('/admin/settings/health');
    return response.data;
  },

  getTimezones: async (): Promise<TimezonesResponse> => {
    const response = await apiClient.get('/admin/settings/timezones');
    return response.data;
  },
};
