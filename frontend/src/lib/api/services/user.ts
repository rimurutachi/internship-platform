/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * User API Service
 * 
 * Handles user profile and authentication-related API calls
 */

import { get, put } from '../client';
import type { User } from '@/types';

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  profile_data?: {
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
    portfolio_url?: string;
    linkedin_url?: string;
    github_url?: string;
    avatar_url?: string;
  };
}

/**
 * Get current user profile
 * If profile doesn't exist in database, creates one from Supabase auth user
 */
export const getUserProfile = async (): Promise<User> => {
  try {
    const userData = await get<User>('/auth/profile');
    console.log('User profile response:', userData);
    
    if (userData) {
      return userData;
    }
    
    // If no data returned, throw error
    throw new Error('User profile data is missing from response');
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    
    // If error is 404 (profile not found), we need to handle this
    // This can happen when a user logs in for the first time
    if (error.statusCode === 404) {
      console.warn('User profile not found in database. This may be a first-time login.');
    }
    
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: UpdateProfileRequest): Promise<User> => {
  const userData = await put<User>('/auth/profile', updates);
  if (!userData) {
    throw new Error('Failed to update user profile');
  }
  return userData;
};
