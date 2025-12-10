/**
 * Student API Functions
 * 
 * API calls for student-specific features
 */

import { createSupabaseClient } from '../supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get evaluation timeline for current student's internship
 */
export async function getStudentEvaluationTimeline(internshipId: string) {
  try {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    const response = await fetch(`${API_URL}/evaluations/timeline/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch evaluation timeline');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching evaluation timeline:', error);
    throw error;
  }
}

/**
 * Get evaluation progress summary for student's internship
 */
export async function getStudentEvaluationProgress(internshipId: string) {
  try {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication session');
    }

    const response = await fetch(`${API_URL}/evaluations/progress/${internshipId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch evaluation progress');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching evaluation progress:', error);
    throw error;
  }
}
