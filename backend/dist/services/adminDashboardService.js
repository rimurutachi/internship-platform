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
        const { count: studentsEnrolled, error: studentsEnrolledError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('university_id', universityId)
            .eq('status', 'active')
            .or('is_archived.is.null,is_archived.eq.false');
        if (studentsEnrolledError) {
            console.error('[adminDashboard] studentsEnrolled query error', studentsEnrolledError);
        }
        console.log('[adminDashboard] studentsEnrolled count', studentsEnrolled || 0);
        // Students pending deployment (no active internship)
        const { data: studentsWithInternships, error: internshipsForStudentsError } = await supabase
            .from('internships')
            .select('student_id')
            .eq('status', 'active')
            .or('status.eq.ongoing');
        if (internshipsForStudentsError) {
            console.error('[adminDashboard] studentsWithInternships query error', internshipsForStudentsError);
        }
        console.log('[adminDashboard] studentsWithInternships rows', studentsWithInternships?.length || 0);
        const studentIdsWithInternships = new Set(studentsWithInternships?.map(i => i.student_id) || []);
        const { data: allActiveStudents, error: allActiveStudentsError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('university_id', universityId)
            .eq('status', 'active')
            .or('is_archived.is.null,is_archived.eq.false');
        if (allActiveStudentsError) {
            console.error('[adminDashboard] allActiveStudents query error', allActiveStudentsError);
        }
        console.log('[adminDashboard] allActiveStudents rows', allActiveStudents?.length || 0);
        const studentsPendingDeployment = (allActiveStudents || [])
            .filter(s => !studentIdsWithInternships.has(s.id)).length;
        console.log('[adminDashboard] studentsPendingDeployment derived', studentsPendingDeployment);
        // Active internships
        const { count: activeInternships, error: activeInternshipsError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .in('status', ['active', 'ongoing']);
        if (activeInternshipsError) {
            console.error('[adminDashboard] activeInternships query error', activeInternshipsError);
        }
        console.log('[adminDashboard] activeInternships count', activeInternships || 0);
        // Completed internships
        const { count: completedInternships, error: completedInternshipsError } = await supabase
            .from('internships')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'completed');
        if (completedInternshipsError) {
            console.error('[adminDashboard] completedInternships query error', completedInternshipsError);
        }
        console.log('[adminDashboard] completedInternships count', completedInternships || 0);
        // Total companies
        const { count: totalCompanies, error: totalCompaniesError } = await supabase
            .from('companies')
            .select('id', { count: 'exact', head: true });
        if (totalCompaniesError) {
            console.error('[adminDashboard] totalCompanies query error', totalCompaniesError);
        }
        console.log('[adminDashboard] totalCompanies count', totalCompanies || 0);
        // Companies with available capacity
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, capacity_limit, current_students');
        if (companiesError) {
            console.error('[adminDashboard] companies query error', companiesError);
        }
        console.log('[adminDashboard] companies rows', companies?.length || 0);
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
        const { data: supervisorInternships, error: supervisorInternshipsError } = await supabase
            .from('internships')
            .select('id')
            .in('status', ['active', 'ongoing']);
        if (supervisorInternshipsError) {
            console.error('[adminDashboard] supervisorInternships query error', supervisorInternshipsError);
        }
        console.log('[adminDashboard] supervisorInternships rows', supervisorInternships?.length || 0);
        const internshipIds = supervisorInternships?.map(i => i.id) || [];
        const { count: pendingWeeklyReports, error: pendingWeeklyReportsError } = await supabase
            .from('student_weekly_accomplishments')
            .select('id', { count: 'exact', head: true })
            .in('internship_id', internshipIds)
            .eq('status', 'pending_approval');
        if (pendingWeeklyReportsError) {
            console.error('[adminDashboard] pendingWeeklyReports query error', pendingWeeklyReportsError);
        }
        console.log('[adminDashboard] pendingWeeklyReports count', pendingWeeklyReports || 0, { internshipIdsCount: internshipIds.length });
        // Pending supervisor evaluations (drafts not submitted)
        const { count: pendingSupervisorEvaluations, error: pendingSupervisorEvaluationsError } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'draft');
        if (pendingSupervisorEvaluationsError) {
            console.error('[adminDashboard] pendingSupervisorEvaluations query error', pendingSupervisorEvaluationsError);
        }
        console.log('[adminDashboard] pendingSupervisorEvaluations count', pendingSupervisorEvaluations || 0);
        // Pending advisor evaluations (submitted but not approved)
        const { count: pendingAdvisorEvaluations, error: pendingAdvisorEvaluationsError } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('status', ['submitted', 'revision_requested']);
        if (pendingAdvisorEvaluationsError) {
            console.error('[adminDashboard] pendingAdvisorEvaluations query error', pendingAdvisorEvaluationsError);
        }
        console.log('[adminDashboard] pendingAdvisorEvaluations count', pendingAdvisorEvaluations || 0);
        // Completed evaluations this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const { count: completedEvaluationsThisMonth, error: completedEvaluationsError } = await supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'approved')
            .gte('approved_at', startOfMonth.toISOString());
        if (completedEvaluationsError) {
            console.error('[adminDashboard] completedEvaluationsThisMonth query error', completedEvaluationsError);
        }
        console.log('[adminDashboard] completedEvaluationsThisMonth count', completedEvaluationsThisMonth || 0);
        const result = {
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
        console.log('[adminDashboard] metrics result', result);
        return result;
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
 * Get AI insights for admin dashboard (v2.0.0)
 * Now uses analyticsService for on-demand trend analysis
 */
async function getAIInsights(universityId) {
    try {
        // Import analytics service dynamically to avoid circular dependencies
        const analyticsService = await Promise.resolve().then(() => __importStar(require('./analyticsService')));
        // Get quick dashboard insights from AI
        const result = await analyticsService.getDashboardInsights({
            maxInsights: 3,
            limit: 50,
            universityId: universityId,
        });
        if (result.status === 'unavailable' || result.status === 'no_data') {
            return {
                success: true,
                data: [
                    {
                        type: 'info',
                        message: result.insights?.[0]?.description || 'AI insights are being generated. Check back soon.',
                    },
                ],
            };
        }
        // Transform insights to the expected format
        const formattedInsights = result.insights.slice(0, 3).map(insight => ({
            type: insight.type || 'insight',
            message: insight.description,
            title: insight.title,
            category: insight.category,
        }));
        return {
            success: true,
            data: formattedInsights.length > 0 ? formattedInsights : [
                {
                    type: 'info',
                    message: 'No AI insights available yet. Insights will be generated after evaluations are approved.',
                },
            ],
        };
    }
    catch (error) {
        console.error('Error getting AI insights:', error);
        return {
            success: true,
            data: [
                {
                    type: 'info',
                    message: 'AI service is temporarily unavailable.',
                },
            ],
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