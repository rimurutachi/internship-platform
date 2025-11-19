/**
 * API Library Index
 * 
 * Main export point for API services
 */

// Export services
export * from './services';

// Export client
export { apiClient, get, post, put, patch, del, ApiError } from './client';
export type { ApiResponse } from './client';
