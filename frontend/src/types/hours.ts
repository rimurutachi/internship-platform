/**
 * Hours Tracking Types
 * 
 * TypeScript interfaces for internship hours tracking feature
 */

// ============================================
// Program Hours Types
// ============================================

export interface ProgramHours {
  id: string;
  program_code: string;
  program_name: string;
  required_hours: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProgramInput {
  program_code: string;
  program_name: string;
  required_hours: number;
  description?: string;
}

export interface UpdateProgramInput {
  required_hours: number;
}

// ============================================
// Internship Hours Summary Types
// ============================================

export interface InternshipHoursSummary {
  internship_id: string;
  required_hours: number;
  total_hours_worked: number;
  remaining_hours: number;
  progress_percentage: number;
  projected_end_date: string | null;
  weeks_reported: number;
  start_date: string;
  is_completed: boolean;
}

export interface DailyHoursBreakdown {
  report_date: string;
  hours_worked: number;
  created_at: string;
}

// ============================================
// API Response Types
// ============================================

export interface ProgramsResponse {
  success: boolean;
  data?: ProgramHours[];
  error?: string;
  message?: string;
}

export interface ProgramResponse {
  success: boolean;
  data?: ProgramHours;
  error?: string;
}

export interface HoursSummaryResponse {
  success: boolean;
  data?: InternshipHoursSummary;
  error?: string;
}

export interface DailyBreakdownResponse {
  success: boolean;
  data?: DailyHoursBreakdown[];
  error?: string;
}

export interface BatchHoursSummaryResponse {
  success: boolean;
  data?: Record<string, InternshipHoursSummary>;
  error?: string;
}

export interface RecalculateHoursResponse {
  success: boolean;
  data?: {
    total_hours_worked: number;
  };
  error?: string;
  message?: string;
}

// ============================================
// Display Helper Types
// ============================================

export interface ProgressDisplayData {
  percentage: number;
  hoursWorked: number;
  hoursRequired: number;
  hoursRemaining: number;
  weeksReported: number;
  projectedEndDate: string | null;
  isCompleted: boolean;
  status: 'not_started' | 'in_progress' | 'near_completion' | 'completed';
  statusColor: 'gray' | 'blue' | 'yellow' | 'green';
}

/**
 * Convert InternshipHoursSummary to display-friendly format
 */
export function toProgressDisplayData(summary: InternshipHoursSummary): ProgressDisplayData {
  const percentage = summary.progress_percentage;
  
  let status: ProgressDisplayData['status'];
  let statusColor: ProgressDisplayData['statusColor'];
  
  if (percentage >= 100) {
    status = 'completed';
    statusColor = 'green';
  } else if (percentage >= 75) {
    status = 'near_completion';
    statusColor = 'yellow';
  } else if (percentage > 0) {
    status = 'in_progress';
    statusColor = 'blue';
  } else {
    status = 'not_started';
    statusColor = 'gray';
  }
  
  return {
    percentage,
    hoursWorked: summary.total_hours_worked,
    hoursRequired: summary.required_hours,
    hoursRemaining: summary.remaining_hours,
    weeksReported: summary.weeks_reported,
    projectedEndDate: summary.projected_end_date,
    isCompleted: summary.is_completed,
    status,
    statusColor,
  };
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  if (hours >= 8) {
    const days = Math.floor(hours / 8);
    const remainingHours = hours % 8;
    if (remainingHours === 0) {
      return `${days} day${days !== 1 ? 's' : ''} (${hours}h)`;
    }
    return `${days}d ${remainingHours}h (${hours}h total)`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Format projected end date for display
 */
export function formatProjectedEndDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  if (diffDays < 0) {
    return `${formatted} (${Math.abs(diffDays)} days ago)`;
  } else if (diffDays === 0) {
    return `${formatted} (Today)`;
  } else if (diffDays === 1) {
    return `${formatted} (Tomorrow)`;
  } else if (diffDays <= 7) {
    return `${formatted} (${diffDays} days)`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${formatted} (~${weeks} week${weeks !== 1 ? 's' : ''})`;
  }
  
  return formatted;
}
