/**
 * Hours Tracking Service
 * 
 * Handles all internship hours calculation logic including:
 * - Total hours worked from approved weekly DTR submissions
 * - Progress percentage calculation
 * - Projected end date estimation
 * - Remaining hours calculation
 * - Holiday handling (regular vs special)
 * 
 * NOTE: Hours are now sourced exclusively from approved weekly_dtr_submissions.
 * Daily reports (student_daily_reports) are activity logs only and do NOT affect hours.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// ============================================
// Interfaces
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

export interface InternshipHoursSummary {
  internship_id: string;
  required_hours: number;
  total_hours_worked: number;
  remaining_hours: number;
  progress_percentage: number;
  projected_end_date: string | null;
  days_reported: number;
  dtr_submissions_count: number;
  start_date: string;
  is_completed: boolean;
}

export interface DailyHoursBreakdown {
  report_date: string;
  hours_worked: number;
  created_at: string;
}

export interface HoursCalculationResult {
  success: boolean;
  data?: InternshipHoursSummary;
  error?: string;
}

// Philippine Regular Holidays (can be configured per year)
// These are national holidays where work is not required but hours still count
const REGULAR_HOLIDAYS_2025: string[] = [
  '2025-01-01', // New Year's Day
  '2025-04-09', // Araw ng Kagitingan
  '2025-04-17', // Maundy Thursday
  '2025-04-18', // Good Friday
  '2025-04-19', // Black Saturday
  '2025-05-01', // Labor Day
  '2025-06-12', // Independence Day
  '2025-08-25', // National Heroes Day (last Monday of August)
  '2025-11-30', // Bonifacio Day
  '2025-12-25', // Christmas Day
  '2025-12-30', // Rizal Day
];

// ============================================
// Program Hours Management
// ============================================

/**
 * Get all active programs with their required hours
 */
export async function getAllPrograms(): Promise<{ success: boolean; data?: ProgramHours[]; error?: string }> {
  try {
    console.log('🔵 [HoursService] Fetching all programs...');
    
    const { data, error } = await supabase
      .from('program_hours')
      .select('*')
      .eq('is_active', true)
      .order('program_code');

    if (error) {
      console.error('❌ [HoursService] Failed to fetch programs:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [HoursService] Fetched programs:', data?.length || 0);
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('❌ [HoursService] Error fetching programs:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get required hours for a specific program
 */
export async function getProgramHours(programCode: string): Promise<{ success: boolean; data?: ProgramHours; error?: string }> {
  try {
    console.log('🔵 [HoursService] Fetching hours for program:', programCode);
    
    const { data, error } = await supabase
      .from('program_hours')
      .select('*')
      .eq('program_code', programCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ [HoursService] Program not found:', programCode, error.message);
      return { success: false, error: `Program ${programCode} not found` };
    }

    console.log('✅ [HoursService] Found program:', data.program_name, 'Required hours:', data.required_hours);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ [HoursService] Error fetching program:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new program (admin only)
 */
export async function createProgram(
  programCode: string,
  programName: string,
  requiredHours: number,
  description?: string
): Promise<{ success: boolean; data?: ProgramHours; error?: string }> {
  try {
    console.log('🔵 [HoursService] Creating program:', programCode, 'Hours:', requiredHours);
    
    const { data, error } = await supabase
      .from('program_hours')
      .insert({
        program_code: programCode.toUpperCase(),
        program_name: programName,
        required_hours: requiredHours,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [HoursService] Failed to create program:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [HoursService] Program created:', data.id);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ [HoursService] Error creating program:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Update program hours (admin only)
 */
export async function updateProgramHours(
  programCode: string,
  requiredHours: number
): Promise<{ success: boolean; data?: ProgramHours; error?: string }> {
  try {
    console.log('🔵 [HoursService] Updating program:', programCode, 'New hours:', requiredHours);
    
    const { data, error } = await supabase
      .from('program_hours')
      .update({
        required_hours: requiredHours,
        updated_at: new Date().toISOString(),
      })
      .eq('program_code', programCode.toUpperCase())
      .select()
      .single();

    if (error) {
      console.error('❌ [HoursService] Failed to update program:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [HoursService] Program updated:', data.id);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ [HoursService] Error updating program:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Hours Calculation
// ============================================

/**
 * Get internship hours summary
 * This is the main function for getting progress information
 */
export async function getInternshipHoursSummary(
  internshipId: string
): Promise<HoursCalculationResult> {
  try {
    console.log('🔵 [HoursService] Calculating hours summary for internship:', internshipId);

    // Get internship details
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select('id, start_date, end_date, required_hours, total_hours_worked, status, program_code')
      .eq('id', internshipId)
      .single();

    if (internshipError || !internship) {
      console.error('❌ [HoursService] Internship not found:', internshipId);
      return { success: false, error: 'Internship not found' };
    }

    // Get daily reports count (for reference only, not used for hours)
    const { count: daysReported } = await supabase
      .from('student_daily_reports')
      .select('*', { count: 'exact', head: true })
      .eq('internship_id', internshipId);

    // Calculate total hours from approved weekly DTR submissions
    const { data: approvedDTRs } = await supabase
      .from('weekly_dtr_submissions')
      .select('extracted_hours, manual_hours_override')
      .eq('internship_id', internshipId)
      .eq('status', 'approved');

    const totalHoursWorked = (approvedDTRs || []).reduce((sum, dtr) => {
      const hours = dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
      return sum + Number(hours);
    }, 0);

    // Count approved DTR submissions
    const dtrSubmissionsCount = approvedDTRs?.length || 0;

    const requiredHours = internship.required_hours || 240; // Default to 240 if not set
    const remainingHours = Math.max(requiredHours - totalHoursWorked, 0);
    const progressPercentage = requiredHours > 0 
      ? Math.min(Math.round((totalHoursWorked / requiredHours) * 100 * 100) / 100, 100)
      : 0;

    // Calculate projected end date
    const projectedEndDate = calculateProjectedEndDate(
      internship.start_date,
      remainingHours,
      totalHoursWorked
    );

    const summary: InternshipHoursSummary = {
      internship_id: internshipId,
      required_hours: requiredHours,
      total_hours_worked: totalHoursWorked,
      remaining_hours: remainingHours,
      progress_percentage: progressPercentage,
      projected_end_date: projectedEndDate,
      days_reported: daysReported || 0,
      dtr_submissions_count: dtrSubmissionsCount,
      start_date: internship.start_date,
      is_completed: progressPercentage >= 100,
    };

    console.log('✅ [HoursService] Hours summary calculated (DTR-based):', {
      internshipId,
      totalHoursWorked,
      requiredHours,
      progressPercentage: `${progressPercentage}%`,
      remainingHours,
      dtrSubmissionsCount,
    });

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('❌ [HoursService] Error calculating hours:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get daily hours breakdown for an internship
 */
export async function getDailyHoursBreakdown(
  internshipId: string
): Promise<{ success: boolean; data?: DailyHoursBreakdown[]; error?: string }> {
  try {
    console.log('🔵 [HoursService] Fetching daily breakdown for:', internshipId);

    const { data, error } = await supabase
      .from('student_daily_reports')
      .select('report_date, hours_worked, created_at')
      .eq('internship_id', internshipId)
      .order('report_date', { ascending: true });

    if (error) {
      console.error('❌ [HoursService] Failed to fetch breakdown:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [HoursService] Daily breakdown fetched:', data?.length || 0, 'days');
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('❌ [HoursService] Error fetching breakdown:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get hours summary for multiple internships (for advisor/supervisor dashboard)
 */
export async function getBatchInternshipHoursSummary(
  internshipIds: string[]
): Promise<{ success: boolean; data?: Record<string, InternshipHoursSummary>; error?: string }> {
  try {
    console.log('🔵 [HoursService] Batch calculating hours for', internshipIds.length, 'internships');

    const results: Record<string, InternshipHoursSummary> = {};

    // Fetch all at once for efficiency
    const { data: internships, error: internshipsError } = await supabase
      .from('internships')
      .select('id, start_date, end_date, required_hours, total_hours_worked, status')
      .in('id', internshipIds);

    if (internshipsError) {
      console.error('❌ [HoursService] Failed to fetch internships:', internshipsError.message);
      return { success: false, error: internshipsError.message };
    }

    // Get all approved DTR submissions for these internships
    const { data: allDTRs } = await supabase
      .from('weekly_dtr_submissions')
      .select('internship_id, extracted_hours, manual_hours_override')
      .in('internship_id', internshipIds)
      .eq('status', 'approved');

    // Group DTRs by internship and calculate hours
    const hoursByInternship: Record<string, number> = {};
    const dtrCountByInternship: Record<string, number> = {};
    allDTRs?.forEach(dtr => {
      const hours = dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
      hoursByInternship[dtr.internship_id] = (hoursByInternship[dtr.internship_id] || 0) + Number(hours);
      dtrCountByInternship[dtr.internship_id] = (dtrCountByInternship[dtr.internship_id] || 0) + 1;
    });

    // Get daily reports count per internship (for reference only)
    const { data: allReports } = await supabase
      .from('student_daily_reports')
      .select('internship_id')
      .in('internship_id', internshipIds);

    const dayCountByInternship: Record<string, number> = {};
    allReports?.forEach(r => {
      dayCountByInternship[r.internship_id] = (dayCountByInternship[r.internship_id] || 0) + 1;
    });

    // Calculate summary for each internship
    for (const internship of internships || []) {
      const totalHoursWorked = hoursByInternship[internship.id] || 0;
      const requiredHours = internship.required_hours || 240;
      const remainingHours = Math.max(requiredHours - totalHoursWorked, 0);
      const progressPercentage = requiredHours > 0
        ? Math.min(Math.round((totalHoursWorked / requiredHours) * 100 * 100) / 100, 100)
        : 0;

      results[internship.id] = {
        internship_id: internship.id,
        required_hours: requiredHours,
        total_hours_worked: totalHoursWorked,
        remaining_hours: remainingHours,
        progress_percentage: progressPercentage,
        projected_end_date: calculateProjectedEndDate(
          internship.start_date,
          remainingHours,
          totalHoursWorked
        ),
        days_reported: dayCountByInternship[internship.id] || 0,
        dtr_submissions_count: dtrCountByInternship[internship.id] || 0,
        start_date: internship.start_date,
        is_completed: progressPercentage >= 100,
      };
    }

    console.log('✅ [HoursService] Batch calculation complete (DTR-based) for', Object.keys(results).length, 'internships');
    return { success: true, data: results };
  } catch (error: any) {
    console.error('❌ [HoursService] Error in batch calculation:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// Date Calculation Helpers
// ============================================

/**
 * Calculate projected end date based on remaining hours
 * Assumes 8 hours/day, Monday-Friday work schedule
 * Regular holidays count as work days (8 hours credited)
 */
export function calculateProjectedEndDate(
  startDate: string,
  remainingHours: number,
  hoursWorked: number
): string | null {
  if (remainingHours <= 0) {
    // Already completed, return today or latest report date
    return new Date().toISOString().split('T')[0];
  }

  const HOURS_PER_DAY = 8;
  const remainingDays = Math.ceil(remainingHours / HOURS_PER_DAY);

  // Start from today (not start_date) since we're projecting from current point
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let projectedDate = new Date(today);
  let businessDaysAdded = 0;

  while (businessDaysAdded < remainingDays) {
    projectedDate.setDate(projectedDate.getDate() + 1);
    
    // Check if it's a weekday (Mon-Fri)
    const dayOfWeek = projectedDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysAdded++;
    }
  }

  return projectedDate.toISOString().split('T')[0];
}

/**
 * Check if a date is a regular holiday
 */
export function isRegularHoliday(date: Date, year: number = 2025): boolean {
  const dateString = date.toISOString().split('T')[0];
  const holidays = year === 2025 ? REGULAR_HOLIDAYS_2025 : REGULAR_HOLIDAYS_2025; // Add more years as needed
  return holidays.includes(dateString);
}

/**
 * Count business days between two dates
 * Excludes weekends but includes regular holidays
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculate required hours from date range (for migration)
 * Used when converting existing end_date to required_hours
 */
export function calculateHoursFromDateRange(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const businessDays = countBusinessDays(start, end);
  return businessDays * 8; // 8 hours per business day
}

// ============================================
// Update Functions
// ============================================

/**
 * Update internship's required_hours (admin or during creation)
 */
export async function updateInternshipRequiredHours(
  internshipId: string,
  requiredHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔵 [HoursService] Updating required hours:', internshipId, 'Hours:', requiredHours);

    const { error } = await supabase
      .from('internships')
      .update({
        required_hours: requiredHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', internshipId);

    if (error) {
      console.error('❌ [HoursService] Failed to update required hours:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ [HoursService] Required hours updated for internship:', internshipId);
    return { success: true };
  } catch (error: any) {
    console.error('❌ [HoursService] Error updating required hours:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Recalculate and update total_hours_worked for an internship
 * Now sources hours from approved weekly DTR submissions only
 */
export async function recalculateTotalHours(internshipId: string): Promise<{ success: boolean; total: number; error?: string }> {
  try {
    console.log('🔵 [HoursService] Recalculating total hours (DTR-based) for:', internshipId);

    // Source hours from approved weekly DTR submissions
    const { data: approvedDTRs } = await supabase
      .from('weekly_dtr_submissions')
      .select('extracted_hours, manual_hours_override')
      .eq('internship_id', internshipId)
      .eq('status', 'approved');

    const total = (approvedDTRs || []).reduce((sum, dtr) => {
      const hours = dtr.manual_hours_override ?? dtr.extracted_hours ?? 0;
      return sum + Number(hours);
    }, 0);

    const { error } = await supabase
      .from('internships')
      .update({
        total_hours_worked: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', internshipId);

    if (error) {
      console.error('❌ [HoursService] Failed to update total hours:', error.message);
      return { success: false, total: 0, error: error.message };
    }

    console.log('✅ [HoursService] Total hours recalculated (DTR-based):', total);
    return { success: true, total };
  } catch (error: any) {
    console.error('❌ [HoursService] Error recalculating hours:', error.message);
    return { success: false, total: 0, error: error.message };
  }
}

// Export all functions
export default {
  // Program management
  getAllPrograms,
  getProgramHours,
  createProgram,
  updateProgramHours,
  
  // Hours calculation
  getInternshipHoursSummary,
  getDailyHoursBreakdown,
  getBatchInternshipHoursSummary,
  
  // Date helpers
  calculateProjectedEndDate,
  isRegularHoliday,
  countBusinessDays,
  calculateHoursFromDateRange,
  
  // Update functions
  updateInternshipRequiredHours,
  recalculateTotalHours,
};
