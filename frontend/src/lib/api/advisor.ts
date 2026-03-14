/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from Supabase session
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return headers;
};

// Generic API call wrapper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return { success: true, ...data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export interface AdvisorProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  profile_data?: {
    department?: string;
    faculty_id?: string;
    bio?: string;
    university_id?: string;
    [key: string]: any;
  };
  role: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  notification_types?: {
    evaluations?: boolean;
    reports?: boolean;
    messages?: boolean;
    students?: boolean;
    system?: boolean;
  };
}

export interface AdvisorSettings {
  notification_preferences?: NotificationPreferences;
  privacy_settings?: any;
}

export const advisorAPI = {
  /**
   * Get advisor profile
   */
  getProfile: async (): Promise<{ user: AdvisorProfileData }> => {
    const result = await apiCall<AdvisorProfileData>('/auth/profile');
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get profile');
    }
    return { user: result.data };
  },

  /**
   * Update advisor profile
   */
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    profile_data?: any;
  }): Promise<{ user: AdvisorProfileData; message: string }> => {
    const result = await apiCall<AdvisorProfileData>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update profile');
    }
    
    return { 
      user: result.data, 
      message: result.message || 'Profile updated' 
    };
  },

  /**
   * Upload avatar (using admin endpoint pattern)
   */
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_BASE_URL}/admin/settings/profile/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload avatar');
    }

    return response.json();
  },
};
