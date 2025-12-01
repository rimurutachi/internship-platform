"use strict";
/**
 * Evaluation Service - Core CRUD & AI Processing
 *
 * Handles evaluation creation, AI analysis, submission, and approval workflow.
 * Use EvaluationServiceFacade (evaluation.service.ts) for a unified API that includes analytics.
 *
 * @deprecated Consider using EvaluationServiceFacade for new code
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const axios_1 = __importDefault(require("axios"));
const emitters_1 = require("../socket/emitters");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
class EvaluationService {
    async create(data) {
        const { data: evaluation, error } = await supabase
            .from("evaluations")
            .insert({
            ...data,
            status: "draft",
        })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        // Real-time emit
        (0, emitters_1.emitEvaluationUpdate)(evaluation.id, {
            event: "evaluation_created",
            evaluation,
        });
        return evaluation;
    }
    async getById(id) {
        const { data, error } = await supabase
            .from("evaluations")
            .select(`
                *,
                internship:internships(
                *,
                student:users!student_id(id, first_name, last_name),
                company:companies(id, name)
                ),
                supervisor:users!supervisor_id(id, first_name, last_name)
                `)
            .eq("id", id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async processWithAI(evaluationId) {
        // Get evaluation
        const evaluation = await this.getById(evaluationId);
        if (!evaluation)
            throw new Error("Evaluation not found.");
        // Call AI Service
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/api/evaluate`, {
            feedback_text: evaluation.feedback_text,
            ratings: {
                overall: evaluation.rating_overall,
                technical: evaluation.rating_technical,
                communication: evaluation.rating_communication,
                work_ethic: evaluation.rating_work_ethic,
            },
        });
        const aiResult = response.data;
        // Update evaluation with AI results.
        const { data: updated, error } = await supabase
            .from("evaluations")
            .update({
            lit_features: aiResult.lit_features,
            sentiment_scores: aiResult.sentiment_scores,
            recommended_grade: aiResult.recommended_grade,
            confidence_score: aiResult.confidence_score,
            bias_check_passed: aiResult.bias_check_passed,
            status: "processed",
            processed_at: new Date().toISOString(),
        })
            .eq("id", evaluationId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        // Real-time emit
        (0, emitters_1.emitEvaluationUpdate)(evaluationId, {
            event: "evaluation_processed",
            evaluation: updated,
            aiResult,
        });
        return {
            evaluation: updated,
            aiResult: aiResult,
        };
    }
    async submit(evaluationId) {
        const { data, error } = await supabase
            .from("evaluations")
            .update({
            status: "submitted",
            submitted_at: new Date().toISOString(),
        })
            .eq("id", evaluationId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        // Real-time emit
        (0, emitters_1.emitEvaluationUpdate)(evaluationId, {
            event: "evaluation_submitted",
            evaluation: data,
        });
        // Trigger AI Processing
        await this.processWithAI(evaluationId);
        return data;
    }
    async approve(evaluationId, finalGrade) {
        const { data, error } = await supabase
            .from("evaluations")
            .update({
            final_grade: finalGrade,
            status: "approved",
        })
            .eq("id", evaluationId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        // Real-time emit
        (0, emitters_1.emitEvaluationUpdate)(evaluationId, {
            event: "evaluation_approved",
            evaluation: data,
            finalGrade,
        });
        return data;
    }
    async getByInternship(internshipId) {
        const { data, error } = await supabase
            .from("evaluations")
            .select("*")
            .eq("internship_id", internshipId)
            .order("created_at", { ascending: false });
        if (error)
            throw new Error(error.message);
        return data || [];
    }
}
exports.EvaluationService = EvaluationService;
//# sourceMappingURL=evaluationService.js.map