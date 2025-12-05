/**
 * AI Service Client
 * 
 * Handles communication with Python FastAPI AI Service for evaluation analysis.
 * Provides methods for draft analysis and full evaluation processing.
 */

import axios, { AxiosInstance } from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Complete AI analysis result from the Python service
 */
export interface AIAnalysisResult {
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
    breakdown: Record<string, any>;
  };
  bias_check: {
    passed: boolean;
    flags: string[];
  };
  confidence_score: number;
  processing_time_ms: number;
}

/**
 * Draft analysis result (lightweight, no bias check)
 */
export interface DraftAnalysisResult {
  status: string;
  features: {
    technical_skills: string[];
    soft_skills: string[];
  };
  sentiment: {
    score: number;
    label: string;
    breakdown: Record<string, any>;
  };
  processing_time_ms?: number;
}

/**
 * AI Service class for evaluation analysis
 */
class AIService {
  private client: AxiosInstance;
  private isAvailable: boolean = true;

  constructor() {
    this.client = axios.create({
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
  private async checkHealth(): Promise<void> {
    try {
      await this.client.get('/health');
      this.isAvailable = true;
    } catch (error) {
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
  async analyzeDraft(text: string): Promise<DraftAnalysisResult> {
    try {
      const response = await this.client.post<DraftAnalysisResult>('/api/evaluate-draft', {
        text,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
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
  async analyzeEvaluation(
    text: string,
    ratings: {
      rating_overall?: number;
      rating_technical?: number;
      rating_communication?: number;
      rating_work_ethic?: number;
    }
  ): Promise<AIAnalysisResult> {
    try {
      const response = await this.client.post<AIAnalysisResult>('/api/evaluate-with-bias', {
        text,
        ratings,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
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
  getFallbackAnalysis(text: string): AIAnalysisResult {
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
  async isServiceAvailable(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      this.isAvailable = true;
      return true;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }
}

// Export singleton instance
export default new AIService();
