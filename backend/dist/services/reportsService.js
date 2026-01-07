"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
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
    static async getOverview() {
        // Count active users
        const { count: total_users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id', { count: 'exact' })
            .eq('status', 'active');
        // Count active internships
        const { count: active_internships, error: internshipsError } = await supabaseAdmin
            .from('internships')
            .select('id', { count: 'exact' })
            .eq('status', 'active');
        // Count total evaluations
        const { count: total_evaluations, error: evaluationsError } = await supabaseAdmin
            .from('evaluations')
            .select('id', { count: 'exact' });
        // Count completed internships
        const { count: completed_internships } = await supabaseAdmin
            .from('internships')
            .select('id', { count: 'exact' })
            .eq('status', 'completed');
        // Count total internships
        const { count: total_internships } = await supabaseAdmin
            .from('internships')
            .select('id', { count: 'exact' });
        // Calculate completion rate
        let completion_rate = 0;
        const completed = completed_internships ?? 0;
        if (total_internships && total_internships > 0) {
            completion_rate = Math.round((completed / total_internships) * 100);
        }
        // Error handling
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
    static async generateInternshipStatus(groupBy = 'status') {
        // Get all internships
        let query = supabaseAdmin.from('internships').select('id, status');
        // Optionally group by company or university (future enhancement)
        // For now, just status breakdown
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
        return { statuses, avg_completion_rate };
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
            reportData.overview = await this.getOverview();
        }
        if (metrics.includes('monthly_stats')) {
            reportData.monthly_stats = await this.generateMonthlyStats();
        }
        if (metrics.includes('user_growth')) {
            reportData.user_growth = await this.generateUserGrowth(groupBy || 'month');
        }
        if (metrics.includes('internship_status')) {
            reportData.internship_status = await this.generateInternshipStatus(groupBy || 'status');
        }
        if (metrics.includes('evaluation_metrics')) {
            reportData.evaluation_metrics = await this.generateEvaluationMetrics(dateRange);
        }
        if (metrics.includes('performance')) {
            reportData.performance = await this.generatePerformanceMetrics();
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
        csv += `Generated: ${new Date().toISOString()}\n\n`;
        if (data.overview) {
            csv += 'Overview\n';
            csv += 'Metric,Value\n';
            csv += `Total Users,${data.overview.total_users}\n`;
            csv += `Active Internships,${data.overview.active_internships}\n`;
            csv += `Total Evaluations,${data.overview.total_evaluations}\n`;
            csv += `Completion Rate,${data.overview.completion_rate}%\n\n`;
        }
        if (data.monthly_stats) {
            csv += 'Monthly Statistics\n';
            csv += 'Month,Users,Internships,Evaluations\n';
            data.monthly_stats.forEach((m) => {
                csv += `${m.month},${m.users},${m.internships},${m.evaluations}\n`;
            });
            csv += '\n';
        }
        if (data.evaluation_metrics) {
            csv += 'Evaluation Metrics\n';
            csv += 'Rating Type,Average\n';
            csv += `Overall,${data.evaluation_metrics.avg_ratings.overall}\n`;
            csv += `Technical,${data.evaluation_metrics.avg_ratings.technical}\n`;
            csv += `Communication,${data.evaluation_metrics.avg_ratings.communication}\n`;
            csv += `Work Ethic,${data.evaluation_metrics.avg_ratings.work_ethic}\n\n`;
        }
        return csv;
    }
    static async convertToPDF(data) {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => { });
        // Title
        doc.fontSize(20).text('Intern-Galing Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
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
        // Evaluation Metrics
        if (data.evaluation_metrics) {
            doc.fontSize(16).text('Evaluation Metrics', { underline: true });
            doc.moveDown();
            doc.fontSize(12);
            doc.text(`Average Overall Rating: ${data.evaluation_metrics.avg_ratings.overall}`);
            doc.text(`Average Technical Rating: ${data.evaluation_metrics.avg_ratings.technical}`);
            doc.text(`Average Communication Rating: ${data.evaluation_metrics.avg_ratings.communication}`);
            doc.text(`Average Work Ethic Rating: ${data.evaluation_metrics.avg_ratings.work_ethic}`);
            doc.text(`Quality Score: ${data.evaluation_metrics.quality_score}`);
            doc.moveDown(2);
        }
        doc.end();
        return new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
exports.default = ReportsService;
//# sourceMappingURL=reportsService.js.map