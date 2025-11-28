"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationsService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
class EvaluationsService {
    /**
     * Calculate average rating from all rating fields
     */
    calculateAverageRating(evaluation) {
        const ratings = [
            evaluation.rating_overall,
            evaluation.rating_technical,
            evaluation.rating_communication,
            evaluation.rating_work_ethic,
        ].filter((r) => r !== null && r !== undefined);
        if (ratings.length === 0)
            return 0;
        return parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2));
    }
    /**
     * Format AI results for display
     */
    formatAIResults(evaluation) {
        return {
            sentiment_analysis: evaluation.sentiment_scores || {},
            features: evaluation.lit_features || [],
            recommended_grade: evaluation.recommended_grade || null,
            confidence_score: evaluation.confidence_score || 0,
            bias_check_passed: evaluation.bias_check_passed || false,
        };
    }
    /**
     * Check if evaluation is ready for approval
     */
    isReadyForApproval(evaluation) {
        // Check if all validations passed
        return (evaluation.status === 'processed' &&
            evaluation.bias_check_passed === true &&
            (evaluation.recommended_grade !== null || evaluation.final_grade !== null));
    }
    /**
     * Get quality metrics for current month
     */
    async getQualityMetrics() {
        try {
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            const { data: evaluations } = await supabase
                .from('evaluations')
                .select('confidence_score, bias_check_passed, status, sentiment_scores')
                .gte('created_at', thisMonth.toISOString());
            if (!evaluations || evaluations.length === 0) {
                return {
                    total_this_month: 0,
                    total_processed: 0,
                    avg_confidence: 0,
                    bias_pass_rate: 0,
                    sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
                };
            }
            const processedEvaluations = evaluations.filter((e) => e.status === 'processed' || e.status === 'approved');
            // Calculate average confidence
            const confidenceScores = processedEvaluations
                .map((e) => e.confidence_score)
                .filter((s) => s !== null);
            const avgConfidence = confidenceScores.length > 0
                ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
                : 0;
            // Calculate bias pass rate
            const biasPassRate = processedEvaluations.length > 0
                ? (processedEvaluations.filter((e) => e.bias_check_passed).length /
                    processedEvaluations.length) *
                    100
                : 0;
            // Calculate sentiment distribution
            const sentimentTotals = { positive: 0, neutral: 0, negative: 0 };
            let sentimentCount = 0;
            processedEvaluations.forEach((e) => {
                if (e.sentiment_scores && typeof e.sentiment_scores === 'object') {
                    sentimentTotals.positive += e.sentiment_scores.positive || 0;
                    sentimentTotals.neutral += e.sentiment_scores.neutral || 0;
                    sentimentTotals.negative += e.sentiment_scores.negative || 0;
                    sentimentCount++;
                }
            });
            const sentimentDistribution = sentimentCount > 0
                ? {
                    positive: parseFloat((sentimentTotals.positive / sentimentCount).toFixed(2)),
                    neutral: parseFloat((sentimentTotals.neutral / sentimentCount).toFixed(2)),
                    negative: parseFloat((sentimentTotals.negative / sentimentCount).toFixed(2)),
                }
                : { positive: 0, neutral: 0, negative: 0 };
            return {
                total_this_month: evaluations.length,
                total_processed: processedEvaluations.length,
                avg_confidence: parseFloat(avgConfidence.toFixed(2)),
                bias_pass_rate: parseFloat(biasPassRate.toFixed(2)),
                sentiment_distribution: sentimentDistribution,
            };
        }
        catch (error) {
            console.error('Error getting quality metrics:', error);
            return {
                total_this_month: 0,
                total_processed: 0,
                avg_confidence: 0,
                bias_pass_rate: 0,
                sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
            };
        }
    }
    /**
     * Get metrics grouped by supervisor
     */
    async getMetricsBySupervisor() {
        try {
            const { data: evaluations } = await supabase
                .from('evaluations')
                .select(`
          supervisor_id,
          rating_overall,
          rating_technical,
          rating_communication,
          rating_work_ethic,
          confidence_score,
          status,
          internship:internships(
            supervisor:users!internships_supervisor_id_fkey(id, name, email)
          )
        `);
            if (!evaluations || evaluations.length === 0)
                return [];
            // Group by supervisor
            const supervisorMap = new Map();
            evaluations.forEach((evaluation) => {
                const supervisorId = evaluation.supervisor_id;
                if (!supervisorId)
                    return;
                if (!supervisorMap.has(supervisorId)) {
                    supervisorMap.set(supervisorId, {
                        id: supervisorId,
                        name: evaluation.internship?.supervisor?.name || 'Unknown',
                        email: evaluation.internship?.supervisor?.email || '',
                        evaluations: [],
                    });
                }
                supervisorMap.get(supervisorId).evaluations.push(evaluation);
            });
            // Calculate metrics for each supervisor
            const supervisorMetrics = Array.from(supervisorMap.values()).map((supervisor) => {
                const evals = supervisor.evaluations;
                const processedEvals = evals.filter((e) => e.status === 'processed' || e.status === 'approved');
                const avgRatings = evals.length > 0
                    ? evals.map((e) => this.calculateAverageRating(e))
                    : [0];
                const avgRating = avgRatings.reduce((a, b) => a + b, 0) /
                    avgRatings.length;
                const confidenceScores = processedEvals
                    .map((e) => e.confidence_score)
                    .filter((s) => s !== null);
                const avgConfidence = confidenceScores.length > 0
                    ? confidenceScores.reduce((a, b) => a + b, 0) /
                        confidenceScores.length
                    : 0;
                return {
                    id: supervisor.id,
                    name: supervisor.name,
                    email: supervisor.email,
                    eval_count: evals.length,
                    avg_ratings: parseFloat(avgRating.toFixed(2)),
                    avg_confidence: parseFloat(avgConfidence.toFixed(2)),
                };
            });
            return supervisorMetrics;
        }
        catch (error) {
            console.error('Error getting metrics by supervisor:', error);
            return [];
        }
    }
    /**
     * Get metrics grouped by company
     */
    async getMetricsByCompany() {
        try {
            const { data: evaluations } = await supabase
                .from('evaluations')
                .select(`
          rating_overall,
          rating_technical,
          rating_communication,
          rating_work_ethic,
          confidence_score,
          status,
          internship:internships(
            company_id,
            company:companies(id, name)
          )
        `);
            if (!evaluations || evaluations.length === 0)
                return [];
            // Group by company
            const companyMap = new Map();
            evaluations.forEach((evaluation) => {
                const companyId = evaluation.internship?.company_id;
                if (!companyId)
                    return;
                if (!companyMap.has(companyId)) {
                    companyMap.set(companyId, {
                        id: companyId,
                        name: evaluation.internship?.company?.name || 'Unknown',
                        evaluations: [],
                    });
                }
                companyMap.get(companyId).evaluations.push(evaluation);
            });
            // Calculate metrics for each company
            const companyMetrics = Array.from(companyMap.values()).map((company) => {
                const evals = company.evaluations;
                const processedEvals = evals.filter((e) => e.status === 'processed' || e.status === 'approved');
                const avgRatings = evals.length > 0
                    ? evals.map((e) => this.calculateAverageRating(e))
                    : [0];
                const avgRating = avgRatings.reduce((a, b) => a + b, 0) /
                    avgRatings.length;
                const confidenceScores = processedEvals
                    .map((e) => e.confidence_score)
                    .filter((s) => s !== null);
                const avgConfidence = confidenceScores.length > 0
                    ? confidenceScores.reduce((a, b) => a + b, 0) /
                        confidenceScores.length
                    : 0;
                return {
                    id: company.id,
                    name: company.name,
                    eval_count: evals.length,
                    avg_ratings: parseFloat(avgRating.toFixed(2)),
                    avg_confidence: parseFloat(avgConfidence.toFixed(2)),
                };
            });
            return companyMetrics;
        }
        catch (error) {
            console.error('Error getting metrics by company:', error);
            return [];
        }
    }
    /**
     * Export evaluations in specified format
     */
    async exportEvaluations(filters, format, includeAIResults) {
        try {
            let query = supabase.from('evaluations').select(`
          *,
          internship:internships(
            *,
            student:users!internships_student_id_fkey(id, name, email),
            supervisor:users!internships_supervisor_id_fkey(id, name, email),
            company:companies(id, name)
          )
        `);
            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.supervisor_id) {
                query = query.eq('supervisor_id', filters.supervisor_id);
            }
            if (filters.date_range) {
                const { start, end } = filters.date_range;
                if (start)
                    query = query.gte('created_at', start);
                if (end)
                    query = query.lte('created_at', end);
            }
            const { data: evaluations } = await query.order('created_at', {
                ascending: false,
            });
            if (!evaluations || evaluations.length === 0) {
                return format === 'csv' ? '' : '[]';
            }
            // Format data for export
            const exportData = evaluations.map((evaluation) => {
                const baseData = {
                    id: evaluation.id,
                    student_name: evaluation.internship?.student?.name || '',
                    student_email: evaluation.internship?.student?.email || '',
                    supervisor_name: evaluation.internship?.supervisor?.name || '',
                    supervisor_email: evaluation.internship?.supervisor?.email || '',
                    company_name: evaluation.internship?.company?.name || '',
                    status: evaluation.status,
                    feedback_text: evaluation.feedback_text,
                    rating_overall: evaluation.rating_overall,
                    rating_technical: evaluation.rating_technical,
                    rating_communication: evaluation.rating_communication,
                    rating_work_ethic: evaluation.rating_work_ethic,
                    avg_rating: this.calculateAverageRating(evaluation),
                    final_grade: evaluation.final_grade,
                    created_at: evaluation.created_at,
                    submitted_at: evaluation.submitted_at,
                    processed_at: evaluation.processed_at,
                };
                if (includeAIResults) {
                    return {
                        ...baseData,
                        sentiment_scores: JSON.stringify(evaluation.sentiment_scores || {}),
                        lit_features: JSON.stringify(evaluation.lit_features || []),
                        recommended_grade: evaluation.recommended_grade,
                        confidence_score: evaluation.confidence_score,
                        bias_check_passed: evaluation.bias_check_passed,
                    };
                }
                return baseData;
            });
            if (format === 'csv') {
                // Convert to CSV
                if (exportData.length === 0)
                    return '';
                const headers = Object.keys(exportData[0]).join(',');
                const rows = exportData.map((row) => Object.values(row)
                    .map((value) => typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value)
                    .join(','));
                return [headers, ...rows].join('\n');
            }
            else {
                // Return JSON
                return JSON.stringify(exportData, null, 2);
            }
        }
        catch (error) {
            console.error('Error exporting evaluations:', error);
            throw error;
        }
    }
    /**
     * Generate quality report for date range
     */
    async generateQualityReport(startDate, endDate) {
        try {
            const { data: evaluations } = await supabase
                .from('evaluations')
                .select('*')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());
            if (!evaluations || evaluations.length === 0) {
                return {
                    total: 0,
                    processed: 0,
                    approved: 0,
                    rejected: 0,
                    avg_confidence: 0,
                    bias_pass_rate: 0,
                };
            }
            const processed = evaluations.filter((e) => e.status === 'processed' || e.status === 'approved');
            const approved = evaluations.filter((e) => e.status === 'approved');
            const confidenceScores = processed
                .map((e) => e.confidence_score)
                .filter((s) => s !== null);
            const avgConfidence = confidenceScores.length > 0
                ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
                : 0;
            const biasPassRate = processed.length > 0
                ? (processed.filter((e) => e.bias_check_passed).length /
                    processed.length) *
                    100
                : 0;
            return {
                total: evaluations.length,
                processed: processed.length,
                approved: approved.length,
                rejected: evaluations.filter((e) => e.status === 'submitted').length,
                avg_confidence: parseFloat(avgConfidence.toFixed(2)),
                bias_pass_rate: parseFloat(biasPassRate.toFixed(2)),
            };
        }
        catch (error) {
            console.error('Error generating quality report:', error);
            throw error;
        }
    }
}
exports.EvaluationsService = EvaluationsService;
//# sourceMappingURL=evaluationsService.js.map