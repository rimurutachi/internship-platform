/**
 * Conversation Service
 * Handles conversation CRUD operations via Supabase.
 * 
 * Note: This service is referenced by communication tests.
 * The actual conversation logic may be handled inline in controllers
 * or via messageService — this module provides the canonical export.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

const conversationService = {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, body: {
    type: string;
    name?: string;
    participant_ids: string[];
  }) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        type: body.type,
        name: body.name || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    // Add participants
    if (body.participant_ids?.length) {
      const participants = body.participant_ids.map((pid) => ({
        conversation_id: data.id,
        user_id: pid,
      }));

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (partError) throw partError;
    }

    return { ...data, participant_ids: body.participant_ids };
  },

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        conversations (*)
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return data?.map((p: any) => p.conversations) || [];
  },

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark conversation as read for a user
   */
  async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    const { data, error } = await supabase.rpc("get_unread_count", {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  },
};

export default conversationService;
