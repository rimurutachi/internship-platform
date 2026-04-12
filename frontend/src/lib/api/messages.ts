import { apiClient as api } from './client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  profile_data?: any;
  unread_count?: number;
}

export const messagesApi = {
  getContacts: async (): Promise<Contact[]> => {
    const response = await api.get('/messages/contacts');
    return response.data;
  },

  getMessages: async (contactId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/${contactId}`);
    return response.data;
  },

  markAsRead: async (messageIds: string[]): Promise<void> => {
    await api.post('/messages/read', { messageIds });
  }
};
