/**
 * React Query Hooks for API Integration
 * 
 * Custom hooks using TanStack React Query for data fetching
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  internshipService,
  evaluationService,
  communicationService,
  documentService,
  notificationService,
  ApiError,
  type CreateInternshipData,
  type UpdateInternshipData,
  type CreateEvaluationData,
  type UpdateEvaluationData,
  type CreateConversationData,
  type CreateMessageData,
  type CreateDocumentData,
  type UpdateDocumentData,
} from '@/lib/api';
import type { Internship, Evaluation, Conversation, Message, Document, Notification, ListParams } from '@/types/api';

/**
 * Query keys for cache management
 */
export const queryKeys = {
  internships: {
    all: ['internships'] as const,
    lists: () => [...queryKeys.internships.all, 'list'] as const,
    list: (params?: ListParams) => [...queryKeys.internships.lists(), params] as const,
    details: () => [...queryKeys.internships.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.internships.details(), id] as const,
    current: () => [...queryKeys.internships.all, 'current'] as const,
    stats: () => [...queryKeys.internships.all, 'stats'] as const,
  },
  evaluations: {
    all: ['evaluations'] as const,
    lists: () => [...queryKeys.evaluations.all, 'list'] as const,
    list: (params?: ListParams) => [...queryKeys.evaluations.lists(), params] as const,
    details: () => [...queryKeys.evaluations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.evaluations.details(), id] as const,
    byInternship: (internshipId: string) => [...queryKeys.evaluations.all, 'internship', internshipId] as const,
    stats: (internshipId?: string) => [...queryKeys.evaluations.all, 'stats', internshipId] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (params?: ListParams) => [...queryKeys.conversations.lists(), params] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    unreadCount: () => [...queryKeys.conversations.all, 'unread-count'] as const,
  },
  messages: {
    all: ['messages'] as const,
    byConversation: (conversationId: string, params?: ListParams) => 
      [...queryKeys.messages.all, 'conversation', conversationId, params] as const,
  },
  documents: {
    all: ['documents'] as const,
    lists: () => [...queryKeys.documents.all, 'list'] as const,
    list: (params?: ListParams) => [...queryKeys.documents.lists(), params] as const,
    details: () => [...queryKeys.documents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    byInternship: (internshipId: string) => [...queryKeys.documents.all, 'internship', internshipId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params?: ListParams) => [...queryKeys.notifications.lists(), params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
};

// ============================================================================
// INTERNSHIP HOOKS
// ============================================================================

export function useInternships(params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.internships.list(params),
    queryFn: () => internshipService.list(params),
    ...options,
  });
}

export function useInternship(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.internships.detail(id),
    queryFn: () => internshipService.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCurrentInternship(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.internships.current(),
    queryFn: () => internshipService.getCurrent(),
    ...options,
  });
}

export function useCreateInternship(options?: UseMutationOptions<Internship, ApiError, CreateInternshipData>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateInternshipData) => internshipService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.internships.all });
    },
    ...options,
  });
}

export function useUpdateInternship(options?: UseMutationOptions<Internship, ApiError, { id: string; data: UpdateInternshipData }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInternshipData }) => 
      internshipService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.internships.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.internships.lists() });
    },
    ...options,
  });
}

// ============================================================================
// EVALUATION HOOKS
// ============================================================================

export function useEvaluations(params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.evaluations.list(params),
    queryFn: () => evaluationService.list(params),
    ...options,
  });
}

export function useEvaluation(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.evaluations.detail(id),
    queryFn: () => evaluationService.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateEvaluation(options?: UseMutationOptions<Evaluation, ApiError, CreateEvaluationData>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateEvaluationData) => evaluationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations.all });
    },
    ...options,
  });
}

export function useUpdateEvaluation(options?: UseMutationOptions<Evaluation, ApiError, { id: string; data: UpdateEvaluationData }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEvaluationData }) => 
      evaluationService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evaluations.lists() });
    },
    ...options,
  });
}

// ============================================================================
// COMMUNICATION HOOKS
// ============================================================================

export function useConversations(params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => communicationService.listConversations(params),
    ...options,
  });
}

export function useConversationDetail(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => communicationService.getConversation(id),
    enabled: !!id,
    ...options,
  });
}

export function useMessages(conversationId: string, params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.messages.byConversation(conversationId, params),
    queryFn: () => communicationService.listMessages(conversationId, params),
    enabled: !!conversationId,
    ...options,
  });
}

export function useSendMessage(options?: UseMutationOptions<Message, ApiError, CreateMessageData>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMessageData) => communicationService.sendMessage(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.byConversation(data.conversation_id) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() });
    },
    ...options,
  });
}

export function useCreateConversation(options?: UseMutationOptions<Conversation, ApiError, CreateConversationData>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateConversationData) => communicationService.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
    ...options,
  });
}

// ============================================================================
// DOCUMENT HOOKS
// ============================================================================

export function useDocuments(params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => documentService.list(params),
    ...options,
  });
}

export function useDocument(id: string, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: () => documentService.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateDocument(options?: UseMutationOptions<Document, ApiError, CreateDocumentData>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDocumentData) => documentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
    ...options,
  });
}

// ============================================================================
// NOTIFICATION HOOKS
// ============================================================================

export function useNotifications(params?: ListParams, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationService.list(params),
    ...options,
  });
}

export function useUnreadNotificationCount(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    ...options,
  });
}

export function useMarkNotificationAsRead(options?: UseMutationOptions<void, ApiError, string>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
}
