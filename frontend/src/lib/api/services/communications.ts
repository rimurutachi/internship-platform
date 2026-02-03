/**
 * Communication API Service
 * 
 * Handles all messaging and conversation-related API calls
 */

import { get, post, put, patch, del } from '../client';
import type { Conversation, Message, PaginatedResponse, ListParams } from '@/types/api';

/**
 * Create conversation data
 */
export interface CreateConversationData {
  title?: string;
  type: 'direct' | 'group';
  participant_ids: string[];
}

/**
 * Create message data
 */
export interface CreateMessageData {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'file';
  attachments?: Array<{
    file_name: string;
    file_type: string;
    file_url: string;
    file_size: number;
  }>;
  parent_message_id?: string;
}

/**
 * Communication service
 */
export const communicationService = {
  /**
   * Get all conversations for current user
   */
  listConversations: async (params?: ListParams): Promise<PaginatedResponse<Conversation>> => {
    return get<PaginatedResponse<Conversation>>('/communications/conversations', params);
  },

  /**
   * Get a specific conversation by ID
   */
  getConversation: async (id: string): Promise<Conversation> => {
    return get<Conversation>(`/communications/conversations/${id}`);
  },

  /**
   * Create a new conversation
   */
  createConversation: async (data: CreateConversationData): Promise<Conversation> => {
    return post<Conversation>('/communications/conversations', data);
  },

  /**
   * Update conversation
   */
  updateConversation: async (id: string, data: Partial<CreateConversationData>): Promise<Conversation> => {
    return put<Conversation>(`/communications/conversations/${id}`, data);
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (id: string): Promise<void> => {
    return del(`/communications/conversations/${id}`);
  },

  /**
   * Get messages for a conversation
   */
  listMessages: async (conversationId: string, params?: ListParams): Promise<PaginatedResponse<Message>> => {
    return get<PaginatedResponse<Message>>(`/communications/conversations/${conversationId}/messages`, params);
  },

  /**
   * Send a message
   */
  sendMessage: async (data: CreateMessageData): Promise<Message> => {
    return post<Message>('/communications/messages', data);
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId: string): Promise<void> => {
    return patch(`/communications/messages/${messageId}/read`);
  },

  /**
   * Mark all messages in conversation as read
   */
  markConversationAsRead: async (conversationId: string): Promise<void> => {
    return patch(`/communications/conversations/${conversationId}/read`);
  },

  /**
   * Add participant to conversation
   */
  addParticipant: async (conversationId: string, userId: string): Promise<void> => {
    return post(`/communications/conversations/${conversationId}/participants`, { user_id: userId });
  },

  /**
   * Remove participant from conversation
   */
  removeParticipant: async (conversationId: string, userId: string): Promise<void> => {
    return del(`/communications/conversations/${conversationId}/participants/${userId}`);
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    return get('/communications/unread-count');
  },
};
