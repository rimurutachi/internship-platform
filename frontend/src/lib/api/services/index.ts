/**
 * API Services Index
 * 
 * Central export for all API services
 */

export * from './user';
export * from './internships';
export * from './evaluations';
export * from './communications';
export * from './documents';
export * from './notifications';
export * from './admin';

// Re-export client utilities for convenience
export { apiClient, ApiError } from '../client';
export type { ApiResponse } from '../client';
