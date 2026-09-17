import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:6001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export interface DailyJournalDay {
  date: string;
  dayNumber: number;
  dayOfWeek?: string;
  hoursWorked: number;
  activities: string;
  learnings?: string;
}

export interface WeeklyJournal {
  weekNumber: number;
  dateRange: string;
  totalHours: number;
  weeklySummary: string;
  dailyEntries: DailyJournalDay[];
}

export interface NarrativeReportMetadata {
  studentName: string;
  degreeProgram: string;
  department: string;
  institution: string;
  campus: string;
  campusAddress: string;
  companyName: string;
  companyAddress?: string;
  adviserName?: string;
  supervisorName?: string;
  startDate?: string;
  endDate?: string;
  reportMonthYear: string;
  weeklyJournals?: WeeklyJournal[];
}

export interface EligibilityResult {
  isEligible: boolean;
  progressPercentage: number;
  totalHoursWorked: number;
  requiredHours: number;
  requiredThresholdHours: number;
  remainingHoursToUnlock: number;
  internshipId?: string;
  metadata?: NarrativeReportMetadata;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMonthYear(dateStr?: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return 'September 2025';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function normalizeDegreeProgram(deg?: string): string {
  if (!deg) return 'Bachelor of Science in Computer Science';
  const trimmed = deg.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'BSIT' || upper === 'BS IT' || upper === 'INFORMATION TECHNOLOGY') {
    return 'Bachelor of Science in Information Technology';
  }
  if (upper === 'BSCS' || upper === 'BS CS' || upper === 'COMPUTER SCIENCE') {
    return 'Bachelor of Science in Computer Science';
  }
  if (upper === 'BSIS' || upper === 'BS IS' || upper === 'INFORMATION SYSTEMS') {
    return 'Bachelor of Science in Information Systems';
  }
  if (upper === 'BSEMC' || upper === 'BS EMC' || upper.includes('ENTERTAINMENT')) {
    return 'Bachelor of Science in Entertainment and Multimedia Computing';
  }
  if (upper === 'BSCPE' || upper === 'BS CPE' || upper.includes('COMPUTER ENG')) {
    return 'Bachelor of Science in Computer Engineering';
  }
  return trimmed;
}

interface RawDailyReport {
  id: string;
  report_date: string;
  activities: string;
  learnings?: string | null;
  hours_worked: number | string;
}

function isHolidayReport(rep: RawDailyReport): boolean {
  const text = `${rep.activities || ''} ${rep.learnings || ''}`.toLowerCase();
  if (
    text.includes('ahead of') ||
    text.includes('in preparation for') ||
    text.includes('following the holiday') ||
    text.includes('following the long weekend')
  ) {
    return false;
  }
  return (
    text.includes('observed nationwide regular') ||
    text.includes('observed regular') ||
    text.includes('regular public holiday') ||
    text.includes('regular holiday') ||
    text.includes('official holiday') ||
    (text.includes('holiday') &&
      (text.includes('closed') ||
        text.includes('no duty') ||
        text.includes('no work')))
  );
}

function groupReportsIntoWeeks(reports: RawDailyReport[]): {
  weekNumber: number;
  dateRange: string;
  totalHours: number;
  entries: DailyJournalDay[];
  fallbackSummary: string;
}[] {
  if (!reports || reports.length === 0) return [];

  // Exclude regular holidays from daily reflective journal
  const workingReports = reports.filter((r) => !isHolidayReport(r));
  if (workingReports.length === 0) return [];

  // Sort chronologically ascending
  const sorted = [...workingReports].sort((a, b) => a.report_date.localeCompare(b.report_date));

  // Map each report to its Monday of the week
  const weekMap = new Map<string, RawDailyReport[]>();

  for (const rep of sorted) {
    const d = new Date(rep.report_date + 'T00:00:00');
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d);
    mon.setDate(diffToMon);
    const mondayKey = mon.toISOString().split('T')[0];

    if (!weekMap.has(mondayKey)) {
      weekMap.set(mondayKey, []);
    }
    weekMap.get(mondayKey)!.push(rep);
  }

  const result: {
    weekNumber: number;
    dateRange: string;
    totalHours: number;
    entries: DailyJournalDay[];
    fallbackSummary: string;
  }[] = [];

  let weekIdx = 1;
  let cumulativeDay = 1;

  for (const [, weekReports] of weekMap.entries()) {
    if (!weekReports || weekReports.length === 0) continue;

    let weekHours = 0;
    const entries: DailyJournalDay[] = [];
    const activitiesCollected: string[] = [];
    const learningsCollected: string[] = [];

    weekReports.forEach((r) => {
      const hrs = Number(r.hours_worked) || 0;
      weekHours += hrs;
      const dObj = new Date(r.report_date + 'T00:00:00');
      const dayOfWeek = isNaN(dObj.getTime())
        ? ''
        : dObj.toLocaleDateString('en-US', { weekday: 'long' });

      entries.push({
        date: formatDisplayDate(r.report_date),
        dayNumber: cumulativeDay++,
        dayOfWeek,
        hoursWorked: hrs,
        activities: r.activities || '',
        learnings: r.learnings || '',
      });

      if (r.activities) {
        const first = r.activities.split('.')[0].trim();
        if (first.length > 5) activitiesCollected.push(first);
      }
      if (r.learnings) {
        const firstL = r.learnings.split('.')[0].trim();
        if (firstL.length > 5) learningsCollected.push(firstL);
      }
    });

    const firstDate = formatDisplayDate(weekReports[0].report_date);
    const lastDate = formatDisplayDate(weekReports[weekReports.length - 1].report_date);
    const dateRange = weekReports.length === 1 || firstDate === lastDate
      ? firstDate
      : `${firstDate} – ${lastDate}`;

    const tasksStr = activitiesCollected.slice(0, 3).join('; ') || 'assigned training responsibilities and technical workflows';
    const lrnStr = learningsCollected.slice(0, 2).join(' and ') || 'workplace problem solving and operational standards';

    const fallbackSummary = `During Week ${weekIdx} (${dateRange}), I completed ${weekHours.toFixed(1)} hours of structured on-the-job training. Primary tasks and daily assignments involved ${tasksStr.toLowerCase()}. Through these practical duties, I developed essential professional competencies, especially in understanding ${lrnStr.toLowerCase()}, reinforcing my workplace readiness and adaptability.`;

    result.push({
      weekNumber: weekIdx,
      dateRange,
      totalHours: weekHours,
      entries,
      fallbackSummary,
    });

    weekIdx++;
  }

  return result;
}

export const narrativeReportService = {
  /**
   * Check if a student is eligible (>= 80% rendered hours) and retrieve pre-filled metadata
   */
  async checkEligibility(studentId: string): Promise<EligibilityResult> {
    console.log(`🔍 [NarrativeReport] Checking eligibility for student: ${studentId}`);

    // 1. Fetch current active or latest internship
    const { data: internship, error: internshipError } = await supabase
      .from('internships')
      .select(
        `
        id,
        status,
        required_hours,
        total_hours_worked,
        start_date,
        end_date,
        company:companies(*),
        advisor:users!internships_advisor_id_fkey(id, first_name, last_name, email),
        supervisor:users!internships_supervisor_id_fkey(id, first_name, last_name, email)
      `
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (internshipError) {
      console.error('❌ [NarrativeReport] Error fetching internship:', internshipError);
      throw new Error(internshipError.message);
    }

    // 2. Fetch student user profile
    const { data: studentUser, error: studentError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, profile_data')
      .eq('id', studentId)
      .single();

    if (studentError || !studentUser) {
      console.error('❌ [NarrativeReport] Error fetching student user:', studentError);
      throw new Error('Student user profile not found');
    }

    const requiredHours = Number(internship?.required_hours) || 240;
    const totalHoursWorked = Number(internship?.total_hours_worked) || 0;
    const rawProgress = requiredHours > 0 ? (totalHoursWorked / requiredHours) * 100 : 0;
    const progressPercentage = Math.min(Math.round(rawProgress * 10) / 10, 100);

    const requiredThresholdHours = Math.ceil(requiredHours * 0.8);
    const isEligible = progressPercentage >= 80;
    const remainingHoursToUnlock = Math.max(0, requiredThresholdHours - totalHoursWorked);

    const profile = studentUser.profile_data || {};
    const company = internship?.company as any;
    const advisor = internship?.advisor as any;
    const supervisor = internship?.supervisor as any;

    const metadata: NarrativeReportMetadata = {
      studentName: `${studentUser.first_name || ''} ${studentUser.last_name || ''}`.trim() || 'Student Intern',
      degreeProgram: normalizeDegreeProgram(profile.course || profile.program || profile.degree),
      department: profile.department || 'Department of Computer Studies',
      institution: profile.institution || profile.university || 'Cavite State University',
      campus: profile.campus || 'Bacoor City Campus',
      campusAddress: profile.campus_address || 'Bacoor, Cavite',
      companyName: company?.name || 'Partner Host Establishment',
      companyAddress: company?.address || 'Establishment Address',
      adviserName: advisor ? `${advisor.first_name} ${advisor.last_name}` : 'Practicum Adviser',
      supervisorName: supervisor ? `${supervisor.first_name} ${supervisor.last_name}` : 'Immediate Supervisor',
      startDate: formatDisplayDate(internship?.start_date),
      endDate: formatDisplayDate(internship?.end_date),
      reportMonthYear: formatMonthYear(internship?.end_date || new Date().toISOString()),
    };

    console.log(`ℹ️ [NarrativeReport] Eligibility evaluated: ${isEligible} (${progressPercentage}% of ${requiredHours} hrs)`);

    return {
      isEligible,
      progressPercentage,
      totalHoursWorked,
      requiredHours,
      requiredThresholdHours,
      remainingHoursToUnlock,
      internshipId: internship?.id,
      metadata,
    };
  },

  /**
   * Retrieve ethical AI writing guidance & contextual suggestions based on logged activities
   */
  async getWritingGuide(studentId: string) {
    console.log(`💡 [NarrativeReport] Generating writing guide for student: ${studentId}`);

    // Fetch student's daily reports for active internship
    const { data: reports } = await supabase
      .from('student_daily_reports')
      .select('activities, learnings, hours_worked, report_date')
      .eq('student_id', studentId)
      .order('report_date', { ascending: true })
      .limit(50);

    // Extract recent activity themes if reports exist
    const sampleActivities: string[] = [];
    if (reports && reports.length > 0) {
      reports.forEach((r) => {
        if (r.activities && typeof r.activities === 'string') {
          const lines = r.activities.split('\n').map((l) => l.trim()).filter((l) => l.length > 10);
          sampleActivities.push(...lines.slice(0, 2));
        }
      });
    }

    const uniqueActivities = Array.from(new Set(sampleActivities)).slice(0, 6);

    return {
      success: true,
      data: {
        ethicalNote: 'This writing guide provides structural guidelines and prompts to help you articulate your own authentic OJT experiences. Avoid using AI to write your reflections.',
        totalReportsAnalyzed: reports?.length || 0,
        suggestedHighlights: uniqueActivities.length > 0 ? uniqueActivities : [
          'System troubleshooting, PC standardization, and hardware maintenance',
          'Helpdesk ticketing and user support operations',
          'Network configuration and connectivity testing',
          'Asset tagging and inventory management',
        ],
        sections: [
          {
            title: 'Biographical Data',
            guidelines: 'Write in third-person narrative format (e.g., "I, Jimmar D. Idioma, was born on..."). Cover your personal background, family, and educational milestones from elementary to college.',
          },
          {
            title: 'Acknowledgement',
            guidelines: 'Express sincere personal gratitude to your parents, university faculty, OJT adviser, company managers, colleagues, and co-interns.',
          },
          {
            title: 'The Linkage Establishment',
            guidelines: 'Research and state the official corporate profile of your host company: company mission, vision, core goals, executive hierarchy, and corporate products/services.',
          },
          {
            title: 'The Training Area',
            guidelines: 'Detail the department where you were deployed, reporting lines, workplace layout, workstation computer specifications (CPU, RAM, OS), and Standard Operating Procedures (office hours, breaks, ticketing protocols).',
          },
          {
            title: 'The Training Experience',
            guidelines: 'Focus on hands-on activities, new technologies learned, positive department cultures observed, and specific problems you encountered along with how you overcame them.',
          },
          {
            title: 'Summary',
            guidelines: 'Synthesize your overall learning journey, connecting classroom concepts with actual enterprise operations and professional readiness.',
          },
        ],
      },
    };
  },

  /**
   * Calls document-service to generate the CvSU Standard .docx document
   */
  async generateDocx(studentId: string, customMetadata: Partial<NarrativeReportMetadata>, authToken?: string): Promise<{ buffer: Buffer; fileName: string }> {
    const eligibility = await this.checkEligibility(studentId);

    if (!eligibility.isEligible) {
      throw new Error(`Ineligible: You have completed ${eligibility.progressPercentage}% (${eligibility.totalHoursWorked}/${eligibility.requiredHours} hrs). You need at least 80% (${eligibility.requiredThresholdHours} hrs) to generate the Narrative Report.`);
    }

    // Merge default metadata with any student custom overrides
    const finalPayload: NarrativeReportMetadata = {
      ...eligibility.metadata!,
      ...customMetadata,
    };

    // 3. Fetch student's daily reports for Appendix 12: Daily Reflective Journal
    const { data: rawReports, error: rawReportsErr } = await supabase
      .from('student_daily_reports')
      .select('id, report_date, activities, learnings, hours_worked')
      .eq('student_id', studentId)
      .order('report_date', { ascending: true });

    if (rawReportsErr) {
      console.warn('⚠️ [NarrativeReport] Error fetching student daily reports:', rawReportsErr.message);
    }

    let weeklyJournals: WeeklyJournal[] = [];
    if (rawReports && rawReports.length > 0) {
      console.log(`📋 [NarrativeReport] Compiling ${rawReports.length} daily reports for student ${studentId}...`);
      const groupedWeeks = groupReportsIntoWeeks(rawReports);

      try {
        const aiPayload = {
          student_name: finalPayload.studentName,
          company_name: finalPayload.companyName,
          position: 'Student Trainee',
          weeks: groupedWeeks.map((w) => ({
            week_number: w.weekNumber,
            date_range: w.dateRange,
            daily_entries: w.entries.map((e) => ({
              date: e.date,
              day_of_week: e.dayOfWeek,
              hours_worked: e.hoursWorked,
              activities: e.activities,
              learnings: e.learnings,
            })),
          })),
        };

        console.log(`🤖 [NarrativeReport] Requesting weekly summaries from ai-service (${groupedWeeks.length} weeks)...`);
        const aiRes = await axios.post(`${AI_SERVICE_URL}/api/summarize-weekly-reports`, aiPayload, {
          timeout: 45000,
        });

        if (aiRes.data && aiRes.data.success && Array.isArray(aiRes.data.summaries)) {
          const summariesMap = new Map<number, string>();
          aiRes.data.summaries.forEach((s: any) => {
            summariesMap.set(s.week_number, s.summary);
          });

          weeklyJournals = groupedWeeks.map((w) => ({
            weekNumber: w.weekNumber,
            dateRange: w.dateRange,
            totalHours: w.totalHours,
            weeklySummary: summariesMap.get(w.weekNumber) || w.fallbackSummary,
            dailyEntries: w.entries,
          }));
          console.log(`✅ [NarrativeReport] Generated AI weekly reflections for ${weeklyJournals.length} weeks.`);
        } else {
          throw new Error('Invalid AI response structure');
        }
      } catch (aiErr: any) {
        console.warn('⚠️ [NarrativeReport] AI summarization failed, falling back to extractive synthesis:', aiErr.message);
        weeklyJournals = groupedWeeks.map((w) => ({
          weekNumber: w.weekNumber,
          dateRange: w.dateRange,
          totalHours: w.totalHours,
          weeklySummary: w.fallbackSummary,
          dailyEntries: w.entries,
        }));
      }
    }

    finalPayload.weeklyJournals = weeklyJournals;

    console.log('🔄 [NarrativeReport] Requesting DOCX from document-service:', finalPayload.studentName);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = authToken || process.env.SUPABASE_SERVICE_KEY;
    if (token) {
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await axios.post(
      `${DOCUMENT_SERVICE_URL}/api/documents/narrative-report/generate`,
      finalPayload,
      {
        headers,
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    const safeName = (finalPayload.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeName}_OJT_Narrative_Report_CvSU.docx`;

    return {
      buffer: Buffer.from(response.data),
      fileName,
    };
  },
};
