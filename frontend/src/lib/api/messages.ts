/**
 * Messages API Client
 * 
 * Clean API wrapper for conversation and message operations
 * Handles all communication with backend /api/communications endpoints
 */

import { createSupabaseClient } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Get auth headers with Supabase JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 
      'Authorization': `Bearer ${session.access_token}` 
    }),
  };
}

/**
 * Get auth token only (for FormData uploads)
 */
async function getAuthToken(): Promise<string> {
  const supabase = createSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

/**
 * Message type definition
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  metadata?: any;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

/**
 * Conversation type definition
 */
export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'internship';
  name?: string;
  internship_id?: string;
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants?: Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    last_read_at: string;
    user?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
    };
  }>;
  unread_count?: number;
}

/**
 * Create conversation payload
 */
export interface CreateConversationData {
  type: 'direct' | 'group' | 'internship';
  name?: string;
  internship_id?: string;
  participant_ids: string[];
}

/**
 * Send message payload
 */
export interface SendMessageData {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'file' | 'system';
  file_url?: string;
}

/**
 * Messages API
 */
export const messagesAPI = {
  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/conversations`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch conversations');
    }

    const result = await response.json();
    const data = result.data || [];
    
    // Transform backend structure to frontend Conversation interface
    // Backend returns: { id, conversation: { id, type, ..., participants } }
    // Frontend expects: { id, type, ..., participants }
    return data.map((item: any) => ({
      ...item.conversation,
      // Include any participant-specific data if needed
      last_read_at: item.last_read_at,
      user_role: item.role,
    }));
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/communications/conversations/${conversationId}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch conversation');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Create new conversation
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create conversation');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${API_BASE_URL}/communications/messages/${conversationId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch messages');
    }

    const result = await response.json();
    return result.data || [];
  },

  /**
   * Send a message (with optional file)
   */
  async sendMessage(data: SendMessageData, file?: File): Promise<Message> {
    const token = await getAuthToken();
    
    // Use FormData if file is provided
    if (file) {
      const formData = new FormData();
      formData.append('conversation_id', data.conversation_id);
      if (data.content) formData.append('content', data.content);
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/communications/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await response.json();
      return result.data;
    }
    
    // Regular JSON request for text-only messages
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/communications/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/communications/messages/${messageId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ content }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit message');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/communications/messages/${messageId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/communications/conversations/${conversationId}/read`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark as read');
    }
  },

  /**
   * Search users for starting new conversations
   * @param searchQuery - Search term for name or email
   * @param roleFilter - Filter by role (student, advisor, supervisor, admin) or 'all'
   */
  async searchUsers(searchQuery?: string, roleFilter?: string): Promise<User[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    
    if (searchQuery) params.append('q', searchQuery);
    if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);

    const response = await fetch(
      `${API_BASE_URL}/communications/users/search?${params.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search users');
    }

    const result = await response.json();
    return result.data || [];
  },

  /**
   * Create or get existing direct conversation with another user
   * @param otherUserId - ID of the user to start conversation with
   */
  async createDirectConversation(otherUserId: string): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/communications/conversations/direct`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ otherUserId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create conversation');
    }

    const result = await response.json();
    return result.data;
  },
};

/**
 * User type for search results
 */
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

