"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDashboardMetrics = calculateDashboardMetrics;
exports.storeMetricsSnapshot = storeMetricsSnapshot;
exports.getHistoricalMetrics = getHistoricalMetrics;
exports.getAIInsights = getAIInsights;
exports.getAdminDashboardOverview = getAdminDashboardOverview;
exports.getQuickActionItems = getQuickActionItems;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/**
 * Calculate real-time OJT-centric dashboard metrics
 * NO SYSTEM METRICS - Only OJT/Internship data
 */
async function calculateDashboardMetrics(universityId) {
    try {
        // Students enrolled (active students in this university)
        const { count: studentsEnrolled } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('university_id', universityId)
            .eq('status', 'active')
            .or('is_archived.is.null,is_archived.eq.false');
        // Students pending deployment (no active internship)
        const { data: studentsWithInternships } = await supabase
            .from('internships')
            .select('student_id')
            .eq('status', 'active')
            .or('status.eq.ongoing');
        const studentIdsWithInternships = new Set(studentsWithInternships?.map(i => i.student_id) || []);
        const { data: allActiveStudents } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('university_id', universityId)
            .eq('status', 'active')
            .or('is_archived.is.null,is_archived.eq.false');
        const studentsPendingDeployment = (allActiveStudents || [])
            .filter(s => !studentIdsWithInternships.has(s.id)).length;
        // Active internships
        const { count: activeInternships } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .in('status', ['active', 'ongoing']);
        // Completed internships
        const { count: completedInternships } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed');
        // Total companies
        const { count: totalCompanies } = await supabase
            .from('companies')
            .select('id', { count: 'exact', head: true });
        // Companies with available capacity
        const { data: companies } = await supabase
            .from('companies')
            .select('id, capacity_limit, current_students');
        let companiesWithCapacity = 0;
        if (companies) {
            for (const company of companies) {
                // Check if company has available capacity
                // capacity_limit is the max, current_students is how many are currently assigned
                if (company.capacity_limit && company.current_students !== null &&
                    company.current_students < company.capacity_limit) {
                    companiesWithCapacity++;
                }
            }
        }
        // Pending weekly report approvals
        const { data: supervisorInternships } = await supabase
            .from('internships')
            .select('id')
            .in('status', ['active', 'ongoing']);
        const internshipIds = supervisorInternships?.map(i => i.id) || [];
        const { count: pendingWeeklyReports } = await supabase
            .from('student_weekly_accomplishments')
            .select('id', { count: 'exact', head: true })
            .in('internship_id', internshipIds)
            .eq('status', 'pending_approval');
        // Pending supervisor evaluations (drafts not submitted)
        const { count: pendingSupervisorEvaluations } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft');
        // Pending advisor evaluations (submitted but not approved)
        const { count: pendingAdvisorEvaluations } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('status', ['submitted', 'revision_requested']);
        // Completed evaluations this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count: completedEvaluationsThisMonth } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved')
            .gte('advisor_approved_at', startOfMonth.toISOString());
        return {
            students_enrolled: studentsEnrolled || 0,
            students_pending_deployment: studentsPendingDeployment,
            active_internships: activeInternships || 0,
            completed_internships: completedInternships || 0,
            total_companies: totalCompanies || 0,
            companies_with_capacity: companiesWithCapacity,
            pending_weekly_reports: pendingWeeklyReports || 0,
            pending_supervisor_evaluations: pendingSupervisorEvaluations || 0,
            pending_advisor_evaluations: pendingAdvisorEvaluations || 0,
            completed_evaluations_this_month: completedEvaluationsThisMonth || 0,
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        console.error('Error calculating dashboard metrics:', error);
        throw error;
    }
}
/**
 * Store metrics snapshot for historical tracking
 * Run this periodically (daily) via cron job
 */
async function storeMetricsSnapshot(universityId) {
    try {
        const metrics = await calculateDashboardMetrics(universityId);
        const { error } = await supabase
            .from('ojt_dashboard_metrics')
            .insert({
            university_id: universityId,
            students_enrolled: metrics.students_enrolled,
            students_pending_deployment: metrics.students_pending_deployment,
            active_internships: metrics.active_internships,
            completed_internships: metrics.completed_internships,
            total_companies: metrics.total_companies,
            companies_with_capacity: metrics.companies_with_capacity,
            pending_weekly_reports: metrics.pending_weekly_reports,
            pending_supervisor_evaluations: metrics.pending_supervisor_evaluations,
            pending_advisor_evaluations: metrics.pending_advisor_evaluations,
            completed_evaluations_this_month: metrics.completed_evaluations_this_month,
            snapshot_date: new Date().toISOString(),
        });
        if (error) {
            throw new Error(`Failed to store metrics snapshot: ${error.message}`);
        }
        console.log('Metrics snapshot stored successfully for university:', universityId);
        return {
            success: true,
            message: 'Metrics snapshot stored',
        };
    }
    catch (error) {
        console.error('Error storing metrics snapshot:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get historical metrics for trend analysis
 */
async function getHistoricalMetrics(universityId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const { data: metrics, error } = await supabase
            .from('ojt_dashboard_metrics')
            .select('*')
            .eq('university_id', universityId)
            .gte('snapshot_date', startDate.toISOString())
            .order('snapshot_date', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch historical metrics: ${error.message}`);
        }
        return {
            success: true,
            data: metrics || [],
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get AI insights for admin dashboard
 * Top 3 insights from evaluation analytics
 */
async function getAIInsights(universityId) {
    try {
        // Get recent evaluation analytics
        const { data: analytics, error } = await supabase
            .from('evaluation_analytics')
            .select('insights, recommendations, trends')
            .eq('university_id', universityId)
            .order('generated_at', { ascending: false })
            .limit(10);
        if (error) {
            console.error('Failed to fetch AI insights:', error);
            return {
                success: true,
                data: [],
            };
        }
        if (!analytics || analytics.length === 0) {
            return {
                success: true,
                data: [
                    {
                        type: 'info',
                        message: 'No AI insights available yet. Insights will be generated after evaluations are approved.',
                    },
                ],
            };
        }
        // Aggregate top insights
        const allInsights = [];
        analytics.forEach(a => {
            if (a.insights && Array.isArray(a.insights)) {
                allInsights.push(...a.insights);
            }
        });
        // Get top 3 unique insights
        const uniqueInsights = [...new Set(allInsights)].slice(0, 3);
        return {
            success: true,
            data: uniqueInsights.map(insight => ({
                type: 'insight',
                message: insight,
            })),
        };
    }
    catch (error) {
        console.error('Error getting AI insights:', error);
        return {
            success: true,
            data: [],
        };
    }
}
/**
 * Get dashboard overview for admin
 * Combines metrics and insights
 */
async function getAdminDashboardOverview(universityId) {
    try {
        // Get real-time metrics
        const metrics = await calculateDashboardMetrics(universityId);
        // Get AI insights
        const { data: insights } = await getAIInsights(universityId);
        // Get recent activity counts
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const { count: recentWeeklyReports } = await supabase
            .from('student_weekly_accomplishments')
            .select('id', { count: 'exact', head: true })
            .gte('submitted_at', startOfWeek.toISOString());
        const { count: recentEvaluations } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .gte('submitted_at', startOfWeek.toISOString());
        return {
            success: true,
            data: {
                metrics,
                insights: insights || [],
                recent_activity: {
                    weekly_reports_this_week: recentWeeklyReports || 0,
                    evaluations_this_week: recentEvaluations || 0,
                },
            },
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Get quick action items for admin
 * Items that need immediate attention
 */
async function getQuickActionItems(universityId) {
    try {
        const actionItems = [];
        // Pending user verifications
        const { count: pendingVerifications } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('university_id', universityId)
            .eq('verification_status', 'pending_verification');
        if (pendingVerifications && pendingVerifications > 0) {
            actionItems.push({
                type: 'verification',
                priority: 'high',
                count: pendingVerifications,
                message: `${pendingVerifications} user profile(s) pending verification`,
                link: '/admin/users?status=pending_verification',
            });
        }
        // Students pending deployment
        const metrics = await calculateDashboardMetrics(universityId);
        if (metrics.students_pending_deployment > 0) {
            actionItems.push({
                type: 'deployment',
                priority: 'medium',
                count: metrics.students_pending_deployment,
                message: `${metrics.students_pending_deployment} student(s) waiting for internship deployment`,
                link: '/admin/students?status=pending_deployment',
            });
        }
        // Pending evaluations needing advisor review
        if (metrics.pending_advisor_evaluations > 0) {
            actionItems.push({
                type: 'evaluation',
                priority: 'high',
                count: metrics.pending_advisor_evaluations,
                message: `${metrics.pending_advisor_evaluations} evaluation(s) awaiting advisor review`,
                link: '/advisor/evaluations?status=pending',
            });
        }
        // Overdue weekly reports
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const { count: overdueReports } = await supabase
            .from('student_weekly_accomplishments')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending_approval')
            .lt('submitted_at', oneWeekAgo.toISOString());
        if (overdueReports && overdueReports > 0) {
            actionItems.push({
                type: 'report',
                priority: 'medium',
                count: overdueReports,
                message: `${overdueReports} weekly report(s) pending approval for over 1 week`,
                link: '/supervisor/reports?status=overdue',
            });
        }
        return {
            success: true,
            data: actionItems,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
}
//# sourceMappingURL=adminDashboardService.js.map