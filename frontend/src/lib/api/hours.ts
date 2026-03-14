/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hours API Client
 * 
 * Frontend API client for internship hours tracking
 */

import { createSupabaseClient } from '@/lib/supabase';
import type {
  ProgramsResponse,
  ProgramResponse,
  HoursSummaryResponse,
  DailyBreakdownResponse,
  BatchHoursSummaryResponse,
  RecalculateHoursResponse,
  CreateProgramInput,
} from '@/types/hours';

const getApiBase = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  };
};

// ============================================
// Program Hours API
// ============================================

/**
 * Get all active programs with required hours
 */
export async function getAllPrograms(): Promise<ProgramsResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/programs`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to fetch programs:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get required hours for a specific program
 */
export async function getProgramHours(programCode: string): Promise<ProgramResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/programs/${programCode}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to fetch program:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new program (admin only)
 */
export async function createProgram(input: CreateProgramInput): Promise<ProgramResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/programs`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(input),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to create program:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update program required hours (admin only)
 */
export async function updateProgramHours(programCode: string, requiredHours: number): Promise<ProgramResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/programs/${programCode}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ required_hours: requiredHours }),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to update program:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Internship Hours API
// ============================================

/**
 * Get internship hours summary (progress, remaining, projected end)
 */
export async function getInternshipHoursSummary(internshipId: string): Promise<HoursSummaryResponse> {
  try {
    console.log('🔵 [HoursAPI] Fetching hours summary for:', internshipId);
    
    const response = await fetch(`${getApiBase()}/hours/internship/${internshipId}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    const result = await response.json();
    console.log('✅ [HoursAPI] Hours summary received:', result.success);
    
    return result;
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to fetch hours summary:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily hours breakdown for an internship
 */
export async function getDailyHoursBreakdown(internshipId: string): Promise<DailyBreakdownResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/internship/${internshipId}/breakdown`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to fetch breakdown:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get hours summary for multiple internships at once
 */
export async function getBatchHoursSummary(internshipIds: string[]): Promise<BatchHoursSummaryResponse> {
  try {
    console.log('🔵 [HoursAPI] Batch fetching hours for:', internshipIds.length, 'internships');
    
    const response = await fetch(`${getApiBase()}/hours/batch`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ internship_ids: internshipIds }),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to batch fetch:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Force recalculate total hours for an internship
 */
export async function recalculateInternshipHours(internshipId: string): Promise<RecalculateHoursResponse> {
  try {
    const response = await fetch(`${getApiBase()}/hours/internship/${internshipId}/recalculate`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to recalculate:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update required hours for a specific internship (admin only)
 */
export async function updateInternshipRequiredHours(
  internshipId: string, 
  requiredHours: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const response = await fetch(`${getApiBase()}/hours/internship/${internshipId}/required`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ required_hours: requiredHours }),
    });
    
    return await response.json();
  } catch (error: any) {
    console.error('❌ [HoursAPI] Failed to update required hours:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Exported API Object
// ============================================

export const hoursApi = {
  // Program management
  getAllPrograms,
  getProgramHours,
  createProgram,
  updateProgramHours,
  
  // Internship hours
  getInternshipHoursSummary,
  getDailyHoursBreakdown,
  getBatchHoursSummary,
  recalculateInternshipHours,
  updateInternshipRequiredHours,
};

export default hoursApi;