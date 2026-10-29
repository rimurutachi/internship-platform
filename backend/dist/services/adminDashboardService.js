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
exports.getCompanyCapacityBreakdown = getCompanyCapacityBreakdown;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const overviewCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache
/**
 * Calculate real-time OJT-centric dashboard metrics
 * Optimized for high performance: runs queries concurrently via Promise.allSettled
 * NO SYSTEM METRICS - Only OJT/Internship data
 */
async function calculateDashboardMetrics(universityId) {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        // Run all database queries in parallel for maximum speed
        const [studentsEnrolledRes, studentsWithInternshipsRes, allActiveStudentsRes, activeInternshipsRes, completedInternshipsRes, totalCompaniesRes, companiesRes, totalWeeklyDTRRes, pendingSupervisorEvalsRes, pendingAdvisorEvalsRes, completedEvalsThisMonthRes] = await Promise.allSettled([
            // 1. Students enrolled (active students in this university)
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('university_id', universityId)
                .eq('status', 'active')
                .or('is_archived.is.null,is_archived.eq.false'),
            // 2. Students with active/ongoing internships
            supabase
                .from('internships')
                .select('student_id')
                .in('status', ['active', 'ongoing']),
            // 3. All active student IDs for deployment calculation
            supabase
                .from('users')
                .select('id')
                .eq('role', 'student')
                .eq('university_id', universityId)
                .eq('status', 'active')
                .or('is_archived.is.null,is_archived.eq.false'),
            // 4. Active internships count
            supabase
                .from('internships')
                .select('id', { count: 'exact', head: true })
                .in('status', ['active', 'ongoing']),
            // 5. Completed internships count
            supabase
                .from('internships')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'completed'),
            // 6. Total companies
            supabase
                .from('companies')
                .select('id', { count: 'exact', head: true }),
            // 7. Companies capacity info
            supabase
                .from('companies')
                .select('id, capacity_limit, current_students'),
            // 8. Weekly DTR total submissions count
            supabase
                .from('weekly_dtr_submissions')
                .select('id', { count: 'exact', head: true }),
            // 9. Pending supervisor evaluations (drafts)
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'draft'),
            // 10. Pending advisor evaluations (submitted or revision requested)
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .in('status', ['submitted', 'revision_requested']),
            // 11. Completed evaluations this month
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'approved')
                .gte('approved_at', startOfMonth.toISOString())
        ]);
        // Safe extraction with default fallbacks
        const studentsEnrolled = studentsEnrolledRes.status === 'fulfilled' ? studentsEnrolledRes.value.count || 0 : 0;
        const studentsWithInternships = studentsWithInternshipsRes.status === 'fulfilled' ? studentsWithInternshipsRes.value.data || [] : [];
        const allActiveStudents = allActiveStudentsRes.status === 'fulfilled' ? allActiveStudentsRes.value.data || [] : [];
        const activeInternships = activeInternshipsRes.status === 'fulfilled' ? activeInternshipsRes.value.count || 0 : 0;
        const completedInternships = completedInternshipsRes.status === 'fulfilled' ? completedInternshipsRes.value.count || 0 : 0;
        const totalCompanies = totalCompaniesRes.status === 'fulfilled' ? totalCompaniesRes.value.count || 0 : 0;
        const companies = companiesRes.status === 'fulfilled' ? companiesRes.value.data || [] : [];
        const totalWeeklyDTR = totalWeeklyDTRRes.status === 'fulfilled' ? totalWeeklyDTRRes.value.count || 0 : 0;
        const pendingSupervisorEvaluations = pendingSupervisorEvalsRes.status === 'fulfilled' ? pendingSupervisorEvalsRes.value.count || 0 : 0;
        const pendingAdvisorEvaluations = pendingAdvisorEvalsRes.status === 'fulfilled' ? pendingAdvisorEvalsRes.value.count || 0 : 0;
        const completedEvaluationsThisMonth = completedEvalsThisMonthRes.status === 'fulfilled' ? completedEvalsThisMonthRes.value.count || 0 : 0;
        // Calculate students pending deployment
        const studentIdsWithInternships = new Set(studentsWithInternships.map((i) => i.student_id));
        const studentsPendingDeployment = allActiveStudents.filter((s) => !studentIdsWithInternships.has(s.id)).length;
        // Calculate companies with available capacity
        let companiesWithCapacity = 0;
        for (const company of companies) {
            if (company.capacity_limit && company.current_students !== null &&
                company.current_students < company.capacity_limit) {
                companiesWithCapacity++;
            }
        }
        const result = {
            students_enrolled: studentsEnrolled,
            students_pending_deployment: studentsPendingDeployment,
            active_internships: activeInternships,
            completed_internships: completedInternships,
            total_companies: totalCompanies,
            companies_with_capacity: companiesWithCapacity,
            total_weekly_dtr: totalWeeklyDTR,
            pending_supervisor_evaluations: pendingSupervisorEvaluations,
            pending_advisor_evaluations: pendingAdvisorEvaluations,
            completed_evaluations_this_month: completedEvaluationsThisMonth,
            timestamp: new Date().toISOString(),
        };
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
            companies_with_available_capacity: metrics.companies_with_capacity, // Fixed column name mismatch
            total_weekly_reports_submitted: metrics.total_weekly_dtr,
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
 * Combines metrics and insights with caching and timeout protection
 */
async function getAdminDashboardOverview(universityId, forceRefresh = false) {
    try {
        // 1. Check cache first unless forceRefresh is requested
        if (!forceRefresh) {
            const cached = overviewCache.get(universityId);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                console.log('[adminDashboard] Returning cached overview for:', universityId);
                return {
                    success: true,
                    data: cached.data,
                };
            }
        }
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        // 2. Fetch metrics, AI insights (with timeout safeguard), and recent activity in parallel
        const [metricsResult, insightsResult, recentDTRResult, recentEvalsResult] = await Promise.allSettled([
            calculateDashboardMetrics(universityId),
            // Safeguard AI insights with 2500ms timeout so AI never delays dashboard
            Promise.race([
                getAIInsights(universityId),
                new Promise((resolve) => setTimeout(() => resolve({
                    success: true,
                    data: [{ type: 'info', message: 'AI insights will be refreshed in the background.' }]
                }), 2500))
            ]),
            supabase
                .from('weekly_dtr_submissions')
                .select('id', { count: 'exact', head: true })
                .gte('submitted_at', startOfWeek.toISOString()),
            supabase
                .from('evaluations')
                .select('id', { count: 'exact', head: true })
                .gte('submitted_at', startOfWeek.toISOString()),
        ]);
        const metrics = metricsResult.status === 'fulfilled'
            ? metricsResult.value
            : {
                students_enrolled: 0,
                students_pending_deployment: 0,
                active_internships: 0,
                completed_internships: 0,
                total_companies: 0,
                companies_with_capacity: 0,
                total_weekly_dtr: 0,
                pending_supervisor_evaluations: 0,
                pending_advisor_evaluations: 0,
                completed_evaluations_this_month: 0,
                timestamp: new Date().toISOString(),
            };
        const insights = insightsResult.status === 'fulfilled' && insightsResult.value?.data
            ? insightsResult.value.data
            : [{ type: 'info', message: 'Platform data is active and healthy.' }];
        const recentWeeklyDTR = recentDTRResult.status === 'fulfilled' ? recentDTRResult.value.count || 0 : 0;
        const recentEvaluations = recentEvalsResult.status === 'fulfilled' ? recentEvalsResult.value.count || 0 : 0;
        const overviewData = {
            metrics,
            insights,
            recent_activity: {
                weekly_dtr_this_week: recentWeeklyDTR,
                evaluations_this_week: recentEvaluations,
            },
        };
        // 3. Cache the successful result
        overviewCache.set(universityId, {
            data: overviewData,
            timestamp: Date.now(),
        });
        return {
            success: true,
            data: overviewData,
        };
    }
    catch (error) {
        console.error('[adminDashboard] Overview error:', error);
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
        // No longer tracking overdue weekly reports - daily reports have no approval flow
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
/**
 * Get company capacity breakdown
 * Shows which companies have slots and utilization percentage
 */
async function getCompanyCapacityBreakdown(universityId) {
    try {
        // Get all companies with their capacity and current students
        const { data: companies, error } = await supabase
            .from('companies')
            .select('id, name, capacity_limit, current_students, is_verified')
            .eq('is_archived', false)
            .order('name', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch companies: ${error.message}`);
        }
        // Calculate capacity breakdown
        const capacityBreakdown = (companies || []).map(company => {
            const capacityLimit = company.capacity_limit || 10;
            const currentStudents = company.current_students || 0;
            const availableSlots = Math.max(0, capacityLimit - currentStudents);
            const utilizationPercent = capacityLimit > 0
                ? Math.round((currentStudents / capacityLimit) * 100)
                : 0;
            return {
                id: company.id,
                name: company.name,
                capacity_limit: capacityLimit,
                current_students: currentStudents,
                available_slots: availableSlots,
                utilization_percent: utilizationPercent,
                is_full: availableSlots === 0,
                is_verified: company.is_verified,
            };
        });
        // Summary statistics
        const summary = {
            total_companies: capacityBreakdown.length,
            companies_with_capacity: capacityBreakdown.filter(c => c.available_slots > 0).length,
            companies_full: capacityBreakdown.filter(c => c.is_full).length,
            total_capacity: capacityBreakdown.reduce((sum, c) => sum + c.capacity_limit, 0),
            total_deployed: capacityBreakdown.reduce((sum, c) => sum + c.current_students, 0),
            total_available: capacityBreakdown.reduce((sum, c) => sum + c.available_slots, 0),
        };
        return {
            success: true,
            data: {
                companies: capacityBreakdown,
                summary,
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
//# sourceMappingURL=adminDashboardService.js.map