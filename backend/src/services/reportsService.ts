import { createClient } from '@supabase/supabase-js';
import * as analyticsService from './analyticsService';const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

function getISOWeek(date: Date): number {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

class ReportsService {
  static async getOverview(dateRange?: { start?: string; end?: string }) {
    let usersQuery = supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('status', 'active');
    let internshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'active');
    let evaluationsQuery = supabaseAdmin.from('evaluations').select('id', { count: 'exact' });
    let completedInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'completed');
    let totalInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' });
    let pendingInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'pending');
    let cancelledInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'cancelled');

    if (dateRange && dateRange.start) {
      usersQuery = usersQuery.gte('created_at', dateRange.start);
      internshipsQuery = internshipsQuery.gte('created_at', dateRange.start);
      evaluationsQuery = evaluationsQuery.gte('created_at', dateRange.start);
      completedInternshipsQuery = completedInternshipsQuery.gte('created_at', dateRange.start);
      totalInternshipsQuery = totalInternshipsQuery.gte('created_at', dateRange.start);
      pendingInternshipsQuery = pendingInternshipsQuery.gte('created_at', dateRange.start);
      cancelledInternshipsQuery = cancelledInternshipsQuery.gte('created_at', dateRange.start);
    }

    if (dateRange && dateRange.end) {
      usersQuery = usersQuery.lte('created_at', dateRange.end);
      internshipsQuery = internshipsQuery.lte('created_at', dateRange.end);
      evaluationsQuery = evaluationsQuery.lte('created_at', dateRange.end);
      completedInternshipsQuery = completedInternshipsQuery.lte('created_at', dateRange.end);
      totalInternshipsQuery = totalInternshipsQuery.lte('created_at', dateRange.end);
      pendingInternshipsQuery = pendingInternshipsQuery.lte('created_at', dateRange.end);
      cancelledInternshipsQuery = cancelledInternshipsQuery.lte('created_at', dateRange.end);
    }

    const { count: total_users, error: usersError } = await usersQuery;
    const { count: active_internships, error: internshipsError } = await internshipsQuery;
    const { count: total_evaluations, error: evaluationsError } = await evaluationsQuery;
    const { count: completed_internships } = await completedInternshipsQuery;
    const { count: total_internships } = await totalInternshipsQuery;
    const { count: pending_internships } = await pendingInternshipsQuery;
    const { count: cancelled_internships } = await cancelledInternshipsQuery;

    let completion_rate = 0;
    const completed = completed_internships ?? 0;
    if (total_internships && total_internships > 0) {
      completion_rate = Math.round((completed / total_internships) * 100);
    }

    if (usersError || internshipsError || evaluationsError) {
      throw new Error('DB error in overview stats');
    }

    return {
      total_users: total_users || 0,
      active_internships: active_internships || 0,
      total_internships: total_internships || 0,
      pending_internships: pending_internships || 0,
      completed_internships: completed || 0,
      cancelled_internships: cancelled_internships || 0,
      total_evaluations: total_evaluations || 0,
      completion_rate,
    };
  }

  static async generateMonthlyStats(months = 12, year?: number) {
    // Get current date
    const now = new Date();
    const stats: any[] = [];
    // Loop for last N months
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = year || d.getFullYear();
      const m = d.getMonth() + 1;
      // Format month name
      const monthName = d.toLocaleString('default', { month: 'short' });
      // Users created that month
      const { count: usersCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact' })
        .gte('created_at', `${y}-${String(m).padStart(2, '0')}-01`)
        .lt('created_at', `${y}-${String(m + 1).padStart(2, '0')}-01`);
      // Internships created that month
      const { count: internshipsCount } = await supabaseAdmin
        .from('internships')
        .select('id', { count: 'exact' })
        .gte('created_at', `${y}-${String(m).padStart(2, '0')}-01`)
        .lt('created_at', `${y}-${String(m + 1).padStart(2, '0')}-01`);
      // Evaluations submitted that month
      const { count: evaluationsCount } = await supabaseAdmin
        .from('evaluations')
        .select('id', { count: 'exact' })
        .gte('created_at', `${y}-${String(m).padStart(2, '0')}-01`)
        .lt('created_at', `${y}-${String(m + 1).padStart(2, '0')}-01`);
      stats.push({
        month: monthName,
        users: usersCount || 0,
        internships: internshipsCount || 0,
        evaluations: evaluationsCount || 0,
      });
    }
    return stats;
  }

  static async generateUserGrowth(groupBy = 'month', periods = 12) {
    // Determine grouping: 'week' or 'month'
    const now = new Date();
    const periodsArr: any[] = [];
    for (let i = periods - 1; i >= 0; i--) {
      let start: Date, end: Date, label: string;
      if (groupBy === 'week') {
        // Start of week (Monday)
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1 - (i * 7));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        label = `W${getISOWeek(start)} ${start.getFullYear()}`;
      } else {
        // Start of month
        start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      // Query users by role for this period
      const roles = ['student', 'advisor', 'supervisor', 'admin'];
      const counts: Record<string, number> = {};
      for (const role of roles) {
        const { count } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', role)
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());
        counts[role + 's'] = count || 0;
      }
      periodsArr.push({
        period: label,
        students: counts.students,
        advisors: counts.advisors,
        supervisors: counts.supervisors,
        admins: counts.admins,
      });
    }
    return periodsArr;
  }

  static async generateInternshipStatus(groupBy = 'status', dateRange?: { start?: string; end?: string }) {
    // Fetch internships WITH student profile data to resolve missing program_code
    let query = supabaseAdmin.from('internships').select('id, status, program_code, student_id, users!internships_student_id_fkey(profile_data)');
    
    if (dateRange && dateRange.start) {
      query = query.gte('created_at', dateRange.start);
    }
    if (dateRange && dateRange.end) {
      query = query.lte('created_at', dateRange.end);
    }
    
    const { data: internships, error } = await query;
    if (error) throw new Error('DB error in internship status');

    // Count by status
    const statusCounts: Record<string, number> = {
      pending: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    };
    internships.forEach((i: any) => {
      if (statusCounts[i.status] !== undefined) statusCounts[i.status]++;
    });
    const total = internships.length;
    // Calculate percentage per status
    const statuses = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
    // Calculate avg completion rate
    const completed = statusCounts.completed || 0;
    const avg_completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Per-program breakdown
    const { data: programs } = await supabaseAdmin
      .from('program_hours')
      .select('program_code, program_name')
      .eq('is_active', true)
      .order('program_name');

    const programMap: Record<string, { program_code: string; program_name: string; pending: number; active: number; completed: number; cancelled: number; total: number }> = {};

    // Initialize program map
    if (programs && programs.length > 0) {
      programs.forEach((p: any) => {
        programMap[p.program_code] = {
          program_code: p.program_code,
          program_name: p.program_name,
          pending: 0,
          active: 0,
          completed: 0,
          cancelled: 0,
          total: 0,
        };
      });
    }

    // Populate per-program counts - resolve program_code from student profile if missing
    internships.forEach((i: any) => {
      // Use internship's program_code first, then fall back to student's profile_data.program
      let code = i.program_code && i.program_code.trim() !== '' ? i.program_code : null;
      if (!code && i.users?.profile_data?.program) {
        code = i.users.profile_data.program;
      }

      if (code && programMap[code]) {
        programMap[code].total++;
        if (i.status === 'pending') programMap[code].pending++;
        else if (i.status === 'active') programMap[code].active++;
        else if (i.status === 'completed') programMap[code].completed++;
        else if (i.status === 'cancelled') programMap[code].cancelled++;
      } else if (code) {
        // Program code exists but not in program_hours table - create entry with resolved name
        const KNOWN_PROGRAM_NAMES: Record<string, string> = {
          'BSIT': 'Bachelor of Science in Information Technology',
          'BSCS': 'Bachelor of Science in Computer Science',
          'BSHM': 'Bachelor of Science in Hospitality Management',
          'BSBA-MM': 'Bachelor of Science in Business Administration - Major in Marketing Management',
          'BSBA-HRM': 'Bachelor of Science in Business Administration - Major in Human Resource Management',
          'BSPsych': 'Bachelor of Science in Psychology',
          'BSED': 'Bachelor of Science in Secondary Education',
          'BSED-Filipino': 'Bachelor of Science in Secondary Education - Major in Filipino',
          'BSED-English': 'Bachelor of Science in Secondary Education - Major in English',
          'BSED-Mathematics': 'Bachelor of Science in Secondary Education - Major in Mathematics',
          'BSCRIM': 'Bachelor of Science in Criminology',
        };
        programMap[code] = {
          program_code: code,
          program_name: KNOWN_PROGRAM_NAMES[code] || code, // Use known name or code as fallback
          pending: i.status === 'pending' ? 1 : 0,
          active: i.status === 'active' ? 1 : 0,
          completed: i.status === 'completed' ? 1 : 0,
          cancelled: i.status === 'cancelled' ? 1 : 0,
          total: 1,
        };
      } else {
        // No program code at all - group under 'Unassigned'
        if (!programMap['UNASSIGNED']) {
          programMap['UNASSIGNED'] = {
            program_code: 'UNASSIGNED',
            program_name: 'Unassigned Program',
            pending: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
            total: 0,
          };
        }
        programMap['UNASSIGNED'].total++;
        if (i.status === 'pending') programMap['UNASSIGNED'].pending++;
        else if (i.status === 'active') programMap['UNASSIGNED'].active++;
        else if (i.status === 'completed') programMap['UNASSIGNED'].completed++;
        else if (i.status === 'cancelled') programMap['UNASSIGNED'].cancelled++;
      }
    });

    const by_program = Object.values(programMap).filter(p => p.total > 0);

    // Fetch completed students
    let completedQuery = supabaseAdmin
      .from('internships')
      .select('student_id, program_code, users!internships_student_id_fkey(first_name, last_name, name)')
      .eq('status', 'completed');

    if (dateRange && dateRange.start) {
      completedQuery = completedQuery.gte('end_date', dateRange.start);
    }
    if (dateRange && dateRange.end) {
      completedQuery = completedQuery.lte('end_date', dateRange.end);
    }

    const { data: completedStudentsData } = await completedQuery;
    
    const completed_students = (completedStudentsData || []).map((cs: any) => ({
      name: cs.users?.name || `${cs.users?.first_name || ''} ${cs.users?.last_name || ''}`.trim() || 'Unknown Student',
      program_code: cs.program_code
    }));

    return { statuses, avg_completion_rate, by_program, completed_students };
  }

  static async generateEvaluationMetrics(dateRange?: { start?: string; end?: string }) {
    // Build query with optional date range
    let query = supabaseAdmin.from('evaluations').select('*');
    if (dateRange && dateRange.start) {
      query = query.gte('created_at', dateRange.start);
    }
    if (dateRange && dateRange.end) {
      query = query.lte('created_at', dateRange.end);
    }
    const { data: evaluations, error } = await query;
    if (error) throw new Error('DB error in evaluation metrics');
    // Ratings
    let sumOverall = 0, sumTechnical = 0, sumCommunication = 0, sumWorkEthic = 0, count = 0;
    let onTime = 0, late = 0, pending = 0;
    let qualitySum = 0, qualityCount = 0;
    let sentiment = { positive: 0, neutral: 0, negative: 0 };
    evaluations.forEach((e: any) => {
      if (typeof e.rating_overall === 'number') sumOverall += e.rating_overall;
      if (typeof e.rating_technical === 'number') sumTechnical += e.rating_technical;
      if (typeof e.rating_communication === 'number') sumCommunication += e.rating_communication;
      if (typeof e.rating_work_ethic === 'number') sumWorkEthic += e.rating_work_ethic;
      count++;
      // Submission stats
      if (e.status === 'submitted' && e.submitted_at && e.deadline) {
        if (new Date(e.submitted_at) <= new Date(e.deadline)) onTime++;
        else late++;
      } else if (e.status === 'pending') {
        pending++;
      }
      // Quality score
      if (e.bias_check_passed && typeof e.confidence_score === 'number') {
        qualitySum += e.confidence_score;
        qualityCount++;
      }
      // Sentiment
      if (e.sentiment_scores) {
        if (e.sentiment_scores.positive) sentiment.positive++;
        else if (e.sentiment_scores.neutral) sentiment.neutral++;
        else if (e.sentiment_scores.negative) sentiment.negative++;
      }
    });
    return {
      avg_ratings: {
        overall: count ? +(sumOverall / count).toFixed(2) : 0,
        technical: count ? +(sumTechnical / count).toFixed(2) : 0,
        communication: count ? +(sumCommunication / count).toFixed(2) : 0,
        work_ethic: count ? +(sumWorkEthic / count).toFixed(2) : 0,
      },
      submission_stats: {
        on_time: onTime,
        late,
        pending,
      },
      sentiment,
      quality_score: qualityCount ? +(qualitySum / qualityCount).toFixed(2) : 0,
    };
  }

  static async generatePerformanceMetrics() {
    // Request logging tables are gone, so return static performance placeholders to keep reports stable
    return {
      api_response_time: { avg: 0, p95: 0, p99: 0 },
      error_rate: 0,
      active_sessions: 0,
      slow_queries: [],
    };
  }

  static async generateActivityTimeline(timeframe = '24h', page = 1, limit = 20) {
    // Timeframe filter
    const now = new Date();
    let since: Date;
    if (timeframe === '24h') {
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeframe === '7d') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    // Pagination
    const offset = (page - 1) * limit;
    // Query activity_log
    const { data: activities, error, count } = await supabaseAdmin
      .from('activity_log')
      .select('id, user_id, action, resource, description, created_at, entity_type', { count: 'exact' })
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error('DB error in activity timeline');
    // Optionally join with users for user_name
    // For demo, just return user_id
    return {
      activities: activities.map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        user_name: a.user_id, // Replace with join if needed
        action: a.action,
        resource: a.resource,
        description: a.description,
        timestamp: a.created_at,
        entity_type: a.entity_type,
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 1,
      },
    };
  }

  static async generateMetricTrend(metric: string, days = 30) {
    const now = new Date();
    const trend: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dateStr = day.toISOString().slice(0, 10);
      let value = 0;
      if (metric === 'users') {
        const { count } = await supabaseAdmin
          .from('users')
          .select('id', { count: 'exact' })
          .gte('created_at', day.toISOString())
          .lt('created_at', nextDay.toISOString());
        value = count || 0;
      } else if (metric === 'evaluations') {
        const { count } = await supabaseAdmin
          .from('evaluations')
          .select('id', { count: 'exact' })
          .gte('created_at', day.toISOString())
          .lt('created_at', nextDay.toISOString());
        value = count || 0;
      } else if (metric === 'api_response_time') {
        value = 0;
      } else if (metric === 'error_rate') {
        value = 0;
      }
      trend.push({ date: dateStr, value });
    }
    return trend;
  }

  static async exportReport(format: string, metrics: string[], dateRange: any, groupBy?: string) {
    // Fetch data based on metrics
    const reportData: any = {
      title: 'Intern-Galing Analytics Report',
      generated_at: new Date().toISOString(),
      date_range: dateRange || 'All time',
    };
    // Fetch requested metrics
    if (metrics.includes('overview')) {
      reportData.overview = await this.getOverview(dateRange);
    }
    if (metrics.includes('monthly_stats')) {
      reportData.monthly_stats = await this.generateMonthlyStats();
    }
    if (metrics.includes('user_growth')) {
      reportData.user_growth = await this.generateUserGrowth(groupBy || 'month');
    }
    if (metrics.includes('internship_status')) {
      reportData.internship_status = await this.generateInternshipStatus(groupBy || 'status', dateRange);
    }
    if (metrics.includes('ai_insights')) {
      try {
        reportData.ai_insights = await analyticsService.getTrendAnalysis({
          include_recommendations: true,
          top_n_skills: 5,
          top_n_companies: 5,
          date_range_start: dateRange?.start,
          date_range_end: dateRange?.end
        });
      } catch (err) {
        console.error('Failed to fetch AI Insights for report export:', err);
      }
    }
    // Convert to requested format
    if (format === 'json') {
      return JSON.stringify(reportData, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(reportData);
    } else if (format === 'pdf') {
      return this.convertToPDF(reportData);
    } else if (format === 'xlsx') {
      return this.convertToXLSX(reportData);
    }
    throw new Error('Unsupported format');
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion for overview and metrics
    let csv = 'Intern-Galing Analytics Report\n';
    csv += `Generated: ${new Date().toISOString()}\n`;
    if (data.date_range && data.date_range.type) {
      csv += `Date Range: ${data.date_range.type.toUpperCase()}\n`;
    }
    csv += '\n';

    if (data.overview) {
      csv += 'Overview\n';
      csv += 'Metric,Value\n';
      csv += `Total Users,${data.overview.total_users}\n`;
      csv += `Active Internships,${data.overview.active_internships}\n`;
      csv += `Total Evaluations,${data.overview.total_evaluations}\n`;
      csv += `Completion Rate,${data.overview.completion_rate}%\n\n`;
    }
    if (data.internship_status && data.internship_status.by_program) {
      csv += 'Internship Status by Program\n';
      csv += 'Program,Pending,Active,Completed,Cancelled,Total\n';
      data.internship_status.by_program.forEach((p: any) => {
        csv += `${p.program_name || p.program_code},${p.pending},${p.active},${p.completed},${p.cancelled},${p.total}\n`;
      });
      csv += '\n';
    }
    if (data.ai_insights && data.ai_insights.skill_trends && data.ai_insights.skill_trends.most_demanded_overall) {
      csv += 'Top Skill Demands\n';
      csv += 'Skill,Frequency,Percentage\n';
      data.ai_insights.skill_trends.most_demanded_overall.forEach((s: any) => {
        csv += `"${s.name || s.skill}",${s.frequency},${s.percentage}%\n`;
      });
      csv += '\n';
    }
    if (data.ai_insights && data.ai_insights.company_performance) {
      csv += 'Top Company Performance\n';
      csv += 'Company,Evaluation Count,Average Grade,Average Score,Performance Rating\n';
      data.ai_insights.company_performance.forEach((c: any) => {
         csv += `"${c.company_name}",${c.evaluation_count},${c.average_grade},${c.avg_score || c.average_score || 0},"${c.performance_rating || c.performance_category || ''}"\n`;
      });
      csv += '\n';
    }
    if (data.monthly_stats) {
      csv += 'Monthly Statistics\n';
      csv += 'Month,Users,Internships,Evaluations\n';
      data.monthly_stats.forEach((m: any) => {
        csv += `${m.month},${m.users},${m.internships},${m.evaluations}\n`;
      });
      csv += '\n';
    }
    
    return csv;
  }

  private static async convertToPDF(data: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit-table');
    const path = require('path');
    const fs = require('fs');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {});
    
    // Custom Header for Cavite State University
    const logoPath = path.resolve(__dirname, '../../../frontend/public/cvsu-logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 60 });
    }

    const pageWidth = doc.page.width;
    doc.font('Helvetica');
    doc.fontSize(10).text('Republic of the Philippines', 0, 50, { align: 'center', width: pageWidth });
    doc.font('Helvetica-Bold');
    doc.fontSize(14).text('CAVITE STATE UNIVERSITY', 0, 65, { align: 'center', width: pageWidth });
    doc.font('Helvetica-Bold');
    doc.fontSize(12).text('Bacoor City Campus', 0, 82, { align: 'center', width: pageWidth });
    doc.font('Helvetica');
    doc.fontSize(10).text('SHIV, Molino VI, City of Bacoor', 0, 98, { align: 'center', width: pageWidth });
    doc.fontSize(10).text('(046) 476-5029', 0, 112, { align: 'center', width: pageWidth });
    doc.fontSize(10).text('cvsubacoor@cvsu.edu.ph', 0, 126, { align: 'center', width: pageWidth, link: 'mailto:cvsubacoor@cvsu.edu.ph' });
    
    doc.moveTo(50, 150).lineTo(pageWidth - 50, 150).stroke();
    
    // Title
    doc.y = 170;
    doc.x = 50;
    doc.font('Helvetica-Bold').fontSize(18).text(data.title || 'Intern-Galing Analytics Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    if (data.date_range && data.date_range.type) {
       doc.text(`Date Range: ${data.date_range.type.toUpperCase()}`, { align: 'center' });
    }
    doc.moveDown(2);

    const tableOptions = {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: () => doc.font("Helvetica").fontSize(10),
      padding: 5
    };

    // Overview
    if (data.overview) {
      await doc.table({
        title: "Overview",
        headers: ["Metric", "Value"],
        rows: [
          ["Total Users", String(data.overview.total_users)],
          ["Active Internships", String(data.overview.active_internships)],
          ["Total Evaluations", String(data.overview.total_evaluations)],
          ["Completion Rate", `${data.overview.completion_rate}%`]
        ]
      }, { ...tableOptions });
      doc.moveDown(1);
    }
    
    // Program Internship Status
    if (data.internship_status && data.internship_status.by_program) {
      const rows = data.internship_status.by_program.map((p: any) => [
        p.program_name || p.program_code,
        String(p.pending),
        String(p.active),
        String(p.completed),
        String(p.cancelled),
        String(p.total)
      ]);
      
      const tableData = {
        title: "Internship Status by Program",
        headers: ["Program", "Pending", "Active", "Completed", "Cancelled", "Total"],
        rows: rows
      };
      await doc.table(tableData, { ...tableOptions });
      doc.moveDown(1);

      // Completed Students Table
      if (data.internship_status.completed_students && data.internship_status.completed_students.length > 0) {
        const studentRows = data.internship_status.completed_students.map((s: any) => [
          s.name,
          s.program_code
        ]);
        
        await doc.table({
          title: "Completed Students",
          headers: ["Student Name", "Program"],
          rows: studentRows
        }, { ...tableOptions });
        doc.moveDown(1);
      }
    }
    
    // Monthly Stats
    if (data.monthly_stats && data.monthly_stats.length) {
      const rows = data.monthly_stats.map((m: any) => [
        m.month,
        String(m.users),
        String(m.internships),
        String(m.evaluations)
      ]);
      
      await doc.table({
        title: "Monthly Statistics",
        headers: ["Month", "Users", "Internships", "Evaluations"],
        rows: rows
      }, { ...tableOptions });
      doc.moveDown(1);
    }
    
    // AI Insights
    if (data.ai_insights && data.ai_insights.status !== 'error') {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(16).text('AI Trend Analysis', { underline: true });
      doc.moveDown();
      
      const insightsList = data.ai_insights.insights || [];
      if (insightsList.length > 0) {
        const rows = insightsList.map((insight: any) => [
          insight.title,
          insight.description
        ]);
        
        await doc.table({
          title: "Key Insights",
          headers: ["Insight", "Description"],
          rows: rows
        }, { ...tableOptions });
        doc.moveDown(1);
      }

      if (data.ai_insights.skill_trends && data.ai_insights.skill_trends.most_demanded_overall) {
        const rows = data.ai_insights.skill_trends.most_demanded_overall.slice(0, 10).map((item: any) => [
          item.name,
          `${item.percentage}%`,
          String(item.frequency)
        ]);
        
        await doc.table({
          title: "Top Skill Demands",
          headers: ["Skill", "Percentage", "Frequency"],
          rows: rows
        }, { ...tableOptions });
        doc.moveDown(1);
      }

      if (data.ai_insights.company_performance && data.ai_insights.company_performance.length > 0) {
        const rows = data.ai_insights.company_performance.slice(0, 10).map((c: any, index: number) => [
          String(index + 1),
          c.company_name,
          String(c.average_grade),
          c.performance_rating
        ]);
        
        await doc.table({
          title: "Top Company Performance Tracking",
          headers: ["Rank", "Company", "Avg Grade", "Rating"],
          rows: rows
        }, { ...tableOptions });
      }
    }
    
    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private static async convertToXLSX(data: any): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const path = require('path');
    const fs = require('fs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Intern-Galing Platform';
    workbook.created = new Date();

    // ====== HELPER: Style header rows ======
    const styleHeaderRow = (sheet: any, rowNum: number, colCount: number) => {
      const row = sheet.getRow(rowNum);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    };

    const styleDataRows = (sheet: any, startRow: number, endRow: number, colCount: number) => {
      for (let r = startRow; r <= endRow; r++) {
        const row = sheet.getRow(r);
        row.alignment = { vertical: 'middle', wrapText: true };
        for (let c = 1; c <= colCount; c++) {
          const cell = row.getCell(c);
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          // Alternate row bg
          if ((r - startRow) % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          }
        }
      }
    };

    // ====== HELPER: Add university header to sheet ======
    const addUniversityHeader = async (sheet: any, colCount: number) => {
      // Merge cells for header
      const lastCol = colCount;

      // Row 1: Logos + Republic text
      sheet.mergeCells(1, 1, 1, lastCol);
      const row1 = sheet.getRow(1);
      row1.height = 20;
      row1.getCell(1).value = 'Republic of the Philippines';
      row1.getCell(1).font = { size: 10, italic: true };
      row1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 2: University name
      sheet.mergeCells(2, 1, 2, lastCol);
      const row2 = sheet.getRow(2);
      row2.height = 25;
      row2.getCell(1).value = 'CAVITE STATE UNIVERSITY';
      row2.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF16A34A' } };
      row2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 3: Campus
      sheet.mergeCells(3, 1, 3, lastCol);
      const row3 = sheet.getRow(3);
      row3.height = 20;
      row3.getCell(1).value = 'Bacoor City Campus';
      row3.getCell(1).font = { bold: true, size: 12 };
      row3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 4: Address
      sheet.mergeCells(4, 1, 4, lastCol);
      const row4 = sheet.getRow(4);
      row4.height = 16;
      row4.getCell(1).value = 'SHIV, Molino VI, City of Bacoor • (046) 476-5029 • cvsubacoor@cvsu.edu.ph';
      row4.getCell(1).font = { size: 9, color: { argb: 'FF64748B' } };
      row4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 5: Separator line (empty row with bottom border)
      sheet.mergeCells(5, 1, 5, lastCol);
      const row5 = sheet.getRow(5);
      row5.height = 5;
      for (let c = 1; c <= lastCol; c++) {
        row5.getCell(c).border = { bottom: { style: 'medium', color: { argb: 'FF16A34A' } } };
      }

      // Row 6: Report title
      sheet.mergeCells(6, 1, 6, lastCol);
      const row6 = sheet.getRow(6);
      row6.height = 28;
      row6.getCell(1).value = data.title || 'Intern-Galing Analytics Report';
      row6.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
      row6.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 7: Generated date
      sheet.mergeCells(7, 1, 7, lastCol);
      const row7 = sheet.getRow(7);
      row7.height = 16;
      row7.getCell(1).value = `Generated: ${new Date().toLocaleString()}`;
      row7.getCell(1).font = { size: 9, color: { argb: 'FF64748B' }, italic: true };
      row7.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // Row 8: Date range (if available)
      if (data.date_range && data.date_range.type) {
        sheet.mergeCells(8, 1, 8, lastCol);
        const row8 = sheet.getRow(8);
        row8.height = 16;
        row8.getCell(1).value = `Date Range: ${data.date_range.type.toUpperCase()}`;
        row8.getCell(1).font = { size: 9, color: { argb: 'FF64748B' } };
        row8.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Add logos as images
      const cvsuLogoPath = path.resolve(__dirname, '../../../frontend/public/cvsu-logo.png');
      const bpLogoPath = path.resolve(__dirname, '../../../frontend/public/bagong-pilipinas-logo.png');

      if (fs.existsSync(cvsuLogoPath)) {
        const cvsuLogo = workbook.addImage({
          filename: cvsuLogoPath,
          extension: 'png',
        });
        sheet.addImage(cvsuLogo, {
          tl: { col: 0.2, row: 0.2 },
          ext: { width: 60, height: 60 },
        });
      }

      if (fs.existsSync(bpLogoPath)) {
        const bpLogo = workbook.addImage({
          filename: bpLogoPath,
          extension: 'png',
        });
        sheet.addImage(bpLogo, {
          tl: { col: lastCol - 1.5, row: 0.2 },
          ext: { width: 60, height: 60 },
        });
      }

      return 9; // Next available row
    };

    // ====== SHEET 1: Overview & Internship Status ======
    const mainSheet = workbook.addWorksheet('Report Overview');
    mainSheet.properties.defaultRowHeight = 18;
    const mainCols = 6;

    // Set column widths
    mainSheet.columns = [
      { width: 28 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
    ];

    let currentRow = await addUniversityHeader(mainSheet, mainCols);

    // Overview section
    if (data.overview) {
      currentRow++;
      mainSheet.mergeCells(currentRow, 1, currentRow, mainCols);
      const sectionTitle = mainSheet.getRow(currentRow);
      sectionTitle.getCell(1).value = '📊 Overview';
      sectionTitle.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF16A34A' } };
      sectionTitle.height = 24;
      currentRow++;

      // Headers
      mainSheet.getRow(currentRow).values = ['Metric', 'Value'];
      styleHeaderRow(mainSheet, currentRow, 2);
      currentRow++;

      const overviewRows = [
        ['Total Users', data.overview.total_users],
        ['Active Internships', data.overview.active_internships],
        ['Total Evaluations', data.overview.total_evaluations],
        ['Completion Rate', `${data.overview.completion_rate}%`],
      ];
      overviewRows.forEach((row) => {
        mainSheet.getRow(currentRow).values = row;
        currentRow++;
      });
      styleDataRows(mainSheet, currentRow - overviewRows.length, currentRow - 1, 2);
      currentRow++;
    }

    // Internship Status by Program
    if (data.internship_status && data.internship_status.by_program) {
      currentRow++;
      mainSheet.mergeCells(currentRow, 1, currentRow, mainCols);
      const sectionTitle = mainSheet.getRow(currentRow);
      sectionTitle.getCell(1).value = '🎓 Internship Status by Program';
      sectionTitle.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF16A34A' } };
      sectionTitle.height = 24;
      currentRow++;

      mainSheet.getRow(currentRow).values = ['Program', 'Pending', 'Active', 'Completed', 'Cancelled', 'Total'];
      styleHeaderRow(mainSheet, currentRow, 6);
      currentRow++;

      const startDataRow = currentRow;
      data.internship_status.by_program.forEach((p: any) => {
        mainSheet.getRow(currentRow).values = [
          p.program_name || p.program_code,
          p.pending,
          p.active,
          p.completed,
          p.cancelled,
          p.total,
        ];
        currentRow++;
      });
      styleDataRows(mainSheet, startDataRow, currentRow - 1, 6);
      currentRow++;

      // Completed Students
      if (data.internship_status.completed_students && data.internship_status.completed_students.length > 0) {
        currentRow++;
        mainSheet.mergeCells(currentRow, 1, currentRow, mainCols);
        const sectionTitle2 = mainSheet.getRow(currentRow);
        sectionTitle2.getCell(1).value = '✅ Completed Students';
        sectionTitle2.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF16A34A' } };
        sectionTitle2.height = 24;
        currentRow++;

        mainSheet.getRow(currentRow).values = ['Student Name', 'Program'];
        styleHeaderRow(mainSheet, currentRow, 2);
        currentRow++;

        const startStudentRow = currentRow;
        data.internship_status.completed_students.forEach((s: any) => {
          mainSheet.getRow(currentRow).values = [s.name, s.program_code];
          currentRow++;
        });
        styleDataRows(mainSheet, startStudentRow, currentRow - 1, 2);
      }
    }

    // Monthly Stats
    if (data.monthly_stats && data.monthly_stats.length) {
      currentRow += 2;
      mainSheet.mergeCells(currentRow, 1, currentRow, mainCols);
      const sectionTitle = mainSheet.getRow(currentRow);
      sectionTitle.getCell(1).value = '📅 Monthly Statistics';
      sectionTitle.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF16A34A' } };
      sectionTitle.height = 24;
      currentRow++;

      mainSheet.getRow(currentRow).values = ['Month', 'Users', 'Internships', 'Evaluations'];
      styleHeaderRow(mainSheet, currentRow, 4);
      currentRow++;

      const startMonthRow = currentRow;
      data.monthly_stats.forEach((m: any) => {
        mainSheet.getRow(currentRow).values = [m.month, m.users, m.internships, m.evaluations];
        currentRow++;
      });
      styleDataRows(mainSheet, startMonthRow, currentRow - 1, 4);
    }

    // ====== SHEET 2: AI Insights (if available) ======
    if (data.ai_insights && data.ai_insights.status !== 'error') {
      const aiSheet = workbook.addWorksheet('AI Insights');
      aiSheet.properties.defaultRowHeight = 18;
      const aiCols = 4;
      aiSheet.columns = [
        { width: 8 },
        { width: 30 },
        { width: 18 },
        { width: 30 },
      ];

      let aiRow = await addUniversityHeader(aiSheet, aiCols);

      // Key Insights
      const insightsList = data.ai_insights.insights || [];
      if (insightsList.length > 0) {
        aiRow++;
        aiSheet.mergeCells(aiRow, 1, aiRow, aiCols);
        const title = aiSheet.getRow(aiRow);
        title.getCell(1).value = '🧠 Key AI Insights';
        title.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF8B5CF6' } };
        title.height = 24;
        aiRow++;

        aiSheet.getRow(aiRow).values = ['Insight', 'Description'];
        styleHeaderRow(aiSheet, aiRow, 2);
        aiRow++;

        const startRow = aiRow;
        insightsList.forEach((insight: any) => {
          aiSheet.getRow(aiRow).values = [insight.title, insight.description];
          aiRow++;
        });
        styleDataRows(aiSheet, startRow, aiRow - 1, 2);
        aiRow++;
      }

      // Top Skill Demands
      if (data.ai_insights.skill_trends && data.ai_insights.skill_trends.most_demanded_overall) {
        aiRow++;
        aiSheet.mergeCells(aiRow, 1, aiRow, aiCols);
        const title = aiSheet.getRow(aiRow);
        title.getCell(1).value = '💡 Top Skill Demands';
        title.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF8B5CF6' } };
        title.height = 24;
        aiRow++;

        aiSheet.getRow(aiRow).values = ['Skill', 'Percentage', 'Frequency'];
        styleHeaderRow(aiSheet, aiRow, 3);
        aiRow++;

        const startRow = aiRow;
        data.ai_insights.skill_trends.most_demanded_overall.slice(0, 10).forEach((item: any) => {
          aiSheet.getRow(aiRow).values = [item.name, `${item.percentage}%`, item.frequency];
          aiRow++;
        });
        styleDataRows(aiSheet, startRow, aiRow - 1, 3);
        aiRow++;
      }

      // Company Performance
      if (data.ai_insights.company_performance && data.ai_insights.company_performance.length > 0) {
        aiRow++;
        aiSheet.mergeCells(aiRow, 1, aiRow, aiCols);
        const title = aiSheet.getRow(aiRow);
        title.getCell(1).value = '🏢 Top Company Performance';
        title.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF8B5CF6' } };
        title.height = 24;
        aiRow++;

        aiSheet.getRow(aiRow).values = ['Rank', 'Company', 'Avg Grade', 'Rating'];
        styleHeaderRow(aiSheet, aiRow, 4);
        aiRow++;

        const startRow = aiRow;
        data.ai_insights.company_performance.slice(0, 10).forEach((c: any, index: number) => {
          aiSheet.getRow(aiRow).values = [
            index + 1,
            c.company_name,
            c.average_grade,
            c.performance_rating || c.performance_category || '',
          ];
          aiRow++;
        });
        styleDataRows(aiSheet, startRow, aiRow - 1, 4);
      }
    }

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export default ReportsService;
