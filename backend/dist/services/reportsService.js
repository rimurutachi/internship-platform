"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const analyticsService = __importStar(require("./analyticsService"));
const supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
function getISOWeek(date) {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
class ReportsService {
    static async getOverview(dateRange) {
        let usersQuery = supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('status', 'active');
        let internshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'active');
        let evaluationsQuery = supabaseAdmin.from('evaluations').select('id', { count: 'exact' });
        let completedInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' }).eq('status', 'completed');
        let totalInternshipsQuery = supabaseAdmin.from('internships').select('id', { count: 'exact' });
        if (dateRange && dateRange.start) {
            usersQuery = usersQuery.gte('created_at', dateRange.start);
            internshipsQuery = internshipsQuery.gte('created_at', dateRange.start);
            evaluationsQuery = evaluationsQuery.gte('created_at', dateRange.start);
            completedInternshipsQuery = completedInternshipsQuery.gte('created_at', dateRange.start);
            totalInternshipsQuery = totalInternshipsQuery.gte('created_at', dateRange.start);
        }
        if (dateRange && dateRange.end) {
            usersQuery = usersQuery.lte('created_at', dateRange.end);
            internshipsQuery = internshipsQuery.lte('created_at', dateRange.end);
            evaluationsQuery = evaluationsQuery.lte('created_at', dateRange.end);
            completedInternshipsQuery = completedInternshipsQuery.lte('created_at', dateRange.end);
            totalInternshipsQuery = totalInternshipsQuery.lte('created_at', dateRange.end);
        }
        const { count: total_users, error: usersError } = await usersQuery;
        const { count: active_internships, error: internshipsError } = await internshipsQuery;
        const { count: total_evaluations, error: evaluationsError } = await evaluationsQuery;
        const { count: completed_internships } = await completedInternshipsQuery;
        const { count: total_internships } = await totalInternshipsQuery;
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
            total_evaluations: total_evaluations || 0,
            completion_rate,
        };
    }
    static async generateMonthlyStats(months = 12, year) {
        // Get current date
        const now = new Date();
        const stats = [];
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
        const periodsArr = [];
        for (let i = periods - 1; i >= 0; i--) {
            let start, end, label;
            if (groupBy === 'week') {
                // Start of week (Monday)
                start = new Date(now);
                start.setDate(now.getDate() - now.getDay() + 1 - (i * 7));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(start.getDate() + 7);
                label = `W${getISOWeek(start)} ${start.getFullYear()}`;
            }
            else {
                // Start of month
                start = new Date(now.getFullYear(), now.getMonth() - i, 1);
                end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
            }
            // Query users by role for this period
            const roles = ['student', 'advisor', 'supervisor', 'admin'];
            const counts = {};
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
    static async generateInternshipStatus(groupBy = 'status', dateRange) {
        let query = supabaseAdmin.from('internships').select('id, status, program_code');
        if (dateRange && dateRange.start) {
            query = query.gte('created_at', dateRange.start);
        }
        if (dateRange && dateRange.end) {
            query = query.lte('created_at', dateRange.end);
        }
        const { data: internships, error } = await query;
        if (error)
            throw new Error('DB error in internship status');
        // Count by status
        const statusCounts = {
            pending: 0,
            active: 0,
            completed: 0,
            cancelled: 0,
        };
        internships.forEach((i) => {
            if (statusCounts[i.status] !== undefined)
                statusCounts[i.status]++;
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
        const programMap = {};
        // Initialize program map
        if (programs && programs.length > 0) {
            programs.forEach((p) => {
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
        // Populate per-program counts
        internships.forEach((i) => {
            const code = i.program_code;
            if (code && programMap[code]) {
                programMap[code].total++;
                if (i.status === 'pending')
                    programMap[code].pending++;
                else if (i.status === 'active')
                    programMap[code].active++;
                else if (i.status === 'completed')
                    programMap[code].completed++;
                else if (i.status === 'cancelled')
                    programMap[code].cancelled++;
            }
            else if (code) {
                // Program code exists but not in program_hours table - create entry
                programMap[code] = {
                    program_code: code,
                    program_name: code, // Use code as fallback name
                    pending: i.status === 'pending' ? 1 : 0,
                    active: i.status === 'active' ? 1 : 0,
                    completed: i.status === 'completed' ? 1 : 0,
                    cancelled: i.status === 'cancelled' ? 1 : 0,
                    total: 1,
                };
            }
        });
        const by_program = Object.values(programMap).filter(p => p.total > 0);
        return { statuses, avg_completion_rate, by_program };
    }
    static async generateEvaluationMetrics(dateRange) {
        // Build query with optional date range
        let query = supabaseAdmin.from('evaluations').select('*');
        if (dateRange && dateRange.start) {
            query = query.gte('created_at', dateRange.start);
        }
        if (dateRange && dateRange.end) {
            query = query.lte('created_at', dateRange.end);
        }
        const { data: evaluations, error } = await query;
        if (error)
            throw new Error('DB error in evaluation metrics');
        // Ratings
        let sumOverall = 0, sumTechnical = 0, sumCommunication = 0, sumWorkEthic = 0, count = 0;
        let onTime = 0, late = 0, pending = 0;
        let qualitySum = 0, qualityCount = 0;
        let sentiment = { positive: 0, neutral: 0, negative: 0 };
        evaluations.forEach((e) => {
            if (typeof e.rating_overall === 'number')
                sumOverall += e.rating_overall;
            if (typeof e.rating_technical === 'number')
                sumTechnical += e.rating_technical;
            if (typeof e.rating_communication === 'number')
                sumCommunication += e.rating_communication;
            if (typeof e.rating_work_ethic === 'number')
                sumWorkEthic += e.rating_work_ethic;
            count++;
            // Submission stats
            if (e.status === 'submitted' && e.submitted_at && e.deadline) {
                if (new Date(e.submitted_at) <= new Date(e.deadline))
                    onTime++;
                else
                    late++;
            }
            else if (e.status === 'pending') {
                pending++;
            }
            // Quality score
            if (e.bias_check_passed && typeof e.confidence_score === 'number') {
                qualitySum += e.confidence_score;
                qualityCount++;
            }
            // Sentiment
            if (e.sentiment_scores) {
                if (e.sentiment_scores.positive)
                    sentiment.positive++;
                else if (e.sentiment_scores.neutral)
                    sentiment.neutral++;
                else if (e.sentiment_scores.negative)
                    sentiment.negative++;
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
        let since;
        if (timeframe === '24h') {
            since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        else if (timeframe === '7d') {
            since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        else {
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
        if (error)
            throw new Error('DB error in activity timeline');
        // Optionally join with users for user_name
        // For demo, just return user_id
        return {
            activities: activities.map((a) => ({
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
    static async generateMetricTrend(metric, days = 30) {
        const now = new Date();
        const trend = [];
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
            }
            else if (metric === 'evaluations') {
                const { count } = await supabaseAdmin
                    .from('evaluations')
                    .select('id', { count: 'exact' })
                    .gte('created_at', day.toISOString())
                    .lt('created_at', nextDay.toISOString());
                value = count || 0;
            }
            else if (metric === 'api_response_time') {
                value = 0;
            }
            else if (metric === 'error_rate') {
                value = 0;
            }
            trend.push({ date: dateStr, value });
        }
        return trend;
    }
    static async exportReport(format, metrics, dateRange, groupBy) {
        // Fetch data based on metrics
        const reportData = {
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
            }
            catch (err) {
                console.error('Failed to fetch AI Insights for report export:', err);
            }
        }
        // Convert to requested format
        if (format === 'json') {
            return JSON.stringify(reportData, null, 2);
        }
        else if (format === 'csv') {
            return this.convertToCSV(reportData);
        }
        else if (format === 'pdf') {
            return this.convertToPDF(reportData);
        }
        throw new Error('Unsupported format');
    }
    static convertToCSV(data) {
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
            data.internship_status.by_program.forEach((p) => {
                csv += `${p.program_name || p.program_code},${p.pending},${p.active},${p.completed},${p.cancelled},${p.total}\n`;
            });
            csv += '\n';
        }
        if (data.ai_insights && data.ai_insights.skill_trends && data.ai_insights.skill_trends.most_demanded_overall) {
            csv += 'Top Skill Demands\n';
            csv += 'Skill,Frequency,Percentage\n';
            data.ai_insights.skill_trends.most_demanded_overall.forEach((s) => {
                csv += `"${s.name || s.skill}",${s.frequency},${s.percentage}%\n`;
            });
            csv += '\n';
        }
        if (data.ai_insights && data.ai_insights.company_performance) {
            csv += 'Top Company Performance\n';
            csv += 'Company,Evaluation Count,Average Grade,Average Score,Performance Rating\n';
            data.ai_insights.company_performance.forEach((c) => {
                csv += `"${c.company_name}",${c.evaluation_count},${c.average_grade},${c.avg_score || c.average_score || 0},"${c.performance_rating || c.performance_category || ''}"\n`;
            });
            csv += '\n';
        }
        if (data.monthly_stats) {
            csv += 'Monthly Statistics\n';
            csv += 'Month,Users,Internships,Evaluations\n';
            data.monthly_stats.forEach((m) => {
                csv += `${m.month},${m.users},${m.internships},${m.evaluations}\n`;
            });
            csv += '\n';
        }
        return csv;
    }
    static async convertToPDF(data) {
        const PDFDocument = require('pdfkit');
        const path = require('path');
        const fs = require('fs');
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => { });
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
        // Overview
        if (data.overview) {
            doc.fontSize(16).text('Overview', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            doc.text(`Total Users: ${data.overview.total_users}`);
            doc.text(`Active Internships: ${data.overview.active_internships}`);
            doc.text(`Total Evaluations: ${data.overview.total_evaluations}`);
            doc.text(`Completion Rate: ${data.overview.completion_rate}%`);
            doc.moveDown(2);
        }
        // Program Internship Status
        if (data.internship_status && data.internship_status.by_program) {
            doc.fontSize(16).text('Internship Status by Program', { underline: true });
            doc.moveDown();
            doc.fontSize(10);
            data.internship_status.by_program.forEach((p) => {
                doc.font('Helvetica-Bold').text(`${p.program_name || p.program_code}`);
                doc.font('Helvetica').text(`Pending: ${p.pending}  |  Active: ${p.active}  |  Completed: ${p.completed}  |  Cancelled: ${p.cancelled}  |  Total: ${p.total}`);
                doc.moveDown(0.5);
            });
            doc.moveDown(1);
        }
        // Monthly Stats
        if (data.monthly_stats && data.monthly_stats.length) {
            doc.fontSize(16).text('Monthly Statistics', { underline: true });
            doc.moveDown();
            doc.fontSize(10);
            data.monthly_stats.forEach((m) => {
                doc.text(`${m.month}: Users=${m.users}, Internships=${m.internships}, Evaluations=${m.evaluations}`);
            });
            doc.moveDown(2);
        }
        // AI Insights
        if (data.ai_insights && data.ai_insights.status !== 'error') {
            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(16).text('AI Trend Analysis', { underline: true });
            doc.moveDown();
            const insightsList = data.ai_insights.insights || [];
            if (insightsList.length > 0) {
                doc.font('Helvetica-Bold').fontSize(14).text('Key Insights');
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10);
                insightsList.forEach((insight) => {
                    doc.font('Helvetica-Bold').text(`• ${insight.title}`);
                    doc.font('Helvetica').text(`  ${insight.description}`);
                    doc.moveDown(0.5);
                });
                doc.moveDown(1);
            }
            if (data.ai_insights.skill_trends && data.ai_insights.skill_trends.most_demanded_overall) {
                doc.font('Helvetica-Bold').fontSize(14).text('Top Skill Demands');
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10);
                data.ai_insights.skill_trends.most_demanded_overall.slice(0, 5).forEach((item) => {
                    doc.text(`• ${item.name} (${item.percentage}%)`);
                });
                doc.moveDown(1);
            }
            if (data.ai_insights.company_performance && data.ai_insights.company_performance.length > 0) {
                doc.font('Helvetica-Bold').fontSize(14).text('Top Company Performance Tracking');
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10);
                data.ai_insights.company_performance.slice(0, 5).forEach((c, index) => {
                    doc.text(`${index + 1}. ${c.company_name} - Avg Grade: ${c.average_grade} (${c.performance_rating})`);
                });
            }
        }
        doc.end();
        return new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
exports.default = ReportsService;
//# sourceMappingURL=reportsService.js.map