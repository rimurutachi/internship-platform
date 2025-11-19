/**
 * Evaluation API Service
 * 
 * Handles all evaluation-related API calls
 */

import { get, post, put, patch } from '../client';
import type { Evaluation, PaginatedResponse, ListParams } from '@/types/api';

/**
 * Create evaluation data
 */
export interface CreateEvaluationData {
  internship_id: string;
  evaluator_type: 'advisor' | 'supervisor' | 'self';
  evaluation_type: 'midterm' | 'final' | 'weekly' | 'custom';
  scores: Record<string, number>;
  comments?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
}

/**
 * Update evaluation data
 */
export interface UpdateEvaluationData {
  scores?: Record<string, number>;
  comments?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  status?: 'draft' | 'submitted' | 'reviewed';
}

/**
 * Evaluation service
 */
export const evaluationService = {
  /**
   * Get all evaluations with pagination and filtering
   */
  list: async (params?: ListParams): Promise<PaginatedResponse<Evaluation>> => {
    return get<PaginatedResponse<Evaluation>>('/evaluations', params);
  },

  /**
   * Get a specific evaluation by ID
   */
  getById: async (id: string): Promise<Evaluation> => {
    return get<Evaluation>(`/evaluations/${id}`);
  },

  /**
   * Get evaluations by internship ID
   */
  getByInternship: async (internshipId: string, params?: ListParams): Promise<PaginatedResponse<Evaluation>> => {
    return get<PaginatedResponse<Evaluation>>(`/evaluations/internship/${internshipId}`, params);
  },

  /**
   * Get evaluations by evaluator ID
   */
  getByEvaluator: async (evaluatorId: string, params?: ListParams): Promise<PaginatedResponse<Evaluation>> => {
    return get<PaginatedResponse<Evaluation>>(`/evaluations/evaluator/${evaluatorId}`, params);
  },

  /**
   * Create a new evaluation
   */
  create: async (data: CreateEvaluationData): Promise<Evaluation> => {
    return post<Evaluation>('/evaluations', data);
  },

  /**
   * Update an evaluation
   */
  update: async (id: string, data: UpdateEvaluationData): Promise<Evaluation> => {
    return put<Evaluation>(`/evaluations/${id}`, data);
  },

  /**
   * Submit an evaluation for review
   */
  submit: async (id: string): Promise<Evaluation> => {
    return patch<Evaluation>(`/evaluations/${id}/submit`);
  },

  /**
   * Get AI sentiment analysis for an evaluation
   */
  getAISentiment: async (id: string): Promise<Evaluation['ai_sentiment']> => {
    return get(`/evaluations/${id}/ai-sentiment`);
  },

  /**
   * Get evaluation statistics
   */
  getStats: async (internshipId?: string): Promise<{
    total: number;
    submitted: number;
    draft: number;
    reviewed: number;
    average_scores: Record<string, number>;
  }> => {
    const params = internshipId ? { internship_id: internshipId } : undefined;
    return get('/evaluations/stats', params);
  },
};
