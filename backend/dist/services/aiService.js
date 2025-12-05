"use strict";
/**
 * AI Service Client
 *
 * Handles communication with Python FastAPI AI Service for evaluation analysis.
 * Provides methods for draft analysis and full evaluation processing.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
/**
 * AI Service class for evaluation analysis
 */
class AIService {
    constructor() {
        this.isAvailable = true;
        this.client = axios_1.default.create({
            baseURL: AI_SERVICE_URL,
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Check service health on initialization
        this.checkHealth();
    }
    /**
     * Check if AI service is available
     */
    async checkHealth() {
        try {
            await this.client.get('/health');
            this.isAvailable = true;
        }
        catch (error) {
            console.warn('AI Service is not available:', error instanceof Error ? error.message : 'Unknown error');
            this.isAvailable = false;
        }
    }
    /**
     * Analyze draft evaluation (lightweight, for real-time feedback)
     *
     * @param text - Evaluation feedback text
     * @returns Draft analysis with features and sentiment (no bias check)
     */
    async analyzeDraft(text) {
        try {
            const response = await this.client.post('/api/evaluate-draft', {
                text,
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`AI Service Error: ${error.response?.data?.detail || error.message}`);
            }
            throw new Error('Failed to analyze draft evaluation');
        }
    }
    /**
     * Analyze complete evaluation with bias detection
     *
     * @param text - Evaluation feedback text
     * @param ratings - Numeric ratings for different aspects
     * @returns Complete AI analysis including bias check
     */
    async analyzeEvaluation(text, ratings) {
        try {
            const response = await this.client.post('/api/evaluate-with-bias', {
                text,
                ratings,
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                const errorMessage = error.response?.data?.detail || error.message;
                throw new Error(`AI Service Error: ${errorMessage}`);
            }
            throw new Error('Failed to analyze evaluation');
        }
    }
    /**
     * Get fallback analysis when AI service is unavailable
     *
     * @param text - Evaluation feedback text
     * @returns Basic fallback analysis
     */
    getFallbackAnalysis(text) {
        return {
            features: {
                technical_skills: [],
                soft_skills: [],
            },
            sentiment: {
                score: 0,
                label: 'neutral',
                breakdown: {},
            },
            bias_check: {
                passed: true,
                flags: [],
            },
            confidence_score: 0,
            processing_time_ms: 0,
        };
    }
    /**
     * Check if AI service is currently available
     */
    async isServiceAvailable() {
        try {
            await this.client.get('/health', { timeout: 5000 });
            this.isAvailable = true;
            return true;
        }
        catch (error) {
            this.isAvailable = false;
            return false;
        }
    }
}
// Export singleton instance
exports.default = new AIService();
//# sourceMappingURL=aiService.js.map