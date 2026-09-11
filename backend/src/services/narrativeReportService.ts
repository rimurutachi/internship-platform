import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:6001';

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
      degreeProgram: profile.course || profile.program || profile.degree || 'Bachelor of Science in Computer Science',
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
      .from('daily_reports')
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

    console.log('🔄 [NarrativeReport] Requesting DOCX from document-service:', finalPayload.studentName);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers.Authorization = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
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
