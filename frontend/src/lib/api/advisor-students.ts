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
): Promise<{ success: boolean; data?: T; error?: string; message?: string; count?: number }> {
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
      throw new Error(data.message || data.error || 'API request failed');
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

export interface StudentInternship {
  id: string;
  company: string;
  position: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  progress: number;
}

export interface StudentPerformance {
  overall: number;
  technical: number;
  communication: number;
  workEthic: number;
}

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  program: string;
  year: string | number;
  avatar_url?: string;
  internship: StudentInternship;
  performance: StudentPerformance;
  lastEvaluation: string | null;
  evaluationCount: number;
}

export interface StudentDetails extends StudentListItem {
  student_id?: string;
  joined: string;
  internship: StudentInternship & {
    companyLocation?: string;
    companyIndustry?: string;
  };
  evaluations: any[];
  recentReports: any[];
}

export const advisorStudentsAPI = {
  /**
   * Get all students assigned to this advisor
   */
  getMyStudents: async (): Promise<{ students: StudentListItem[]; count: number }> => {
    console.log('🟢 [API] Calling /advisor/students...');
    const result = await apiCall<StudentListItem[]>('/advisor/students');
    console.log('🟢 [API] Raw result:', result);
    
    if (!result.success || !result.data) {
      console.error('🔴 [API] Failed:', result.error);
      throw new Error(result.error || 'Failed to fetch students');
    }
    
    console.log('🟢 [API] Success! Students:', result.data.length);
    return { 
      students: result.data, 
      count: result.count || result.data.length 
    };
  },

  /**
   * Get detailed information about a specific student
   */
  getStudentDetails: async (studentId: string): Promise<{ student: StudentDetails }> => {
    const result = await apiCall<StudentDetails>(`/advisor/students/${studentId}`);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch student details');
    }
    return { student: result.data };
  },
};
