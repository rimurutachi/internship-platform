import { createClient } from "@supabase/supabase-js";
import { CreateConversationDTO, Conversation } from "../models/communication";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class ConversationService {
  // Create conversation
  async createConversation(
    creatorId: string,
    data: CreateConversationDTO
  ): Promise<Conversation> {
    // Ensure creator is in participant list
    const participantIds = [...new Set(data.participant_ids)];
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }

    // Create conversation (insert through database)
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        type: data.type,
        name: data.name,
        internship_id: data.internship_id,
        created_by: creatorId,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) throw new Error(convError.message);
    if (!conversation) throw new Error("Failed to create conversation");

    // Add participants
    const participants = participantIds.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === creatorId ? "admin" : "member",
      is_active: true,
      joined_at: new Date().toISOString(),
    }));

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (partError) {
      // Rollback: delete the conversation if participants insert fails
      await supabase.from("conversations").delete().eq("id", conversation.id);
      throw new Error(partError.message);
    }

    return conversation;
  }

  // Get user conversations
  async getUserConversations(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(
        `*, 
        conversation:conversations(*), 
        participants:conversation_participants(user:users(id, first_name, last_name, email))`
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_read_at", { ascending: false, nullsFirst: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<any> {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `*, 
        participants:conversation_participants(*, user:users(id, first_name, last_name, email)),
        created_by_user:users!created_by(id, first_name, last_name, email)`
      )
      .eq("id", conversationId)
      .eq("conversation_participants.is_active", true)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Conversation not found");

    // Filter out inactive participants in the response
    if (data.participants) {
      data.participants = data.participants.filter(
        (p: any) => p.is_active === true
      );
    }

    return data;
  }

  // Mark conversation as read
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Verify user is a participant
    const { data: participant, error: checkError } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (checkError || !participant) {
      throw new Error("You are not a participant in this conversation");
    }

    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw new Error(error.message);
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at, conversations(last_message_at)")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return 0;

    let unreadCount = 0;
    data.forEach((participant: any) => {
      const conversation = participant.conversations;
      if (!conversation || !conversation.last_message_at) return;

      const lastMessageAt = new Date(conversation.last_message_at);
      const lastReadAt = participant.last_read_at
        ? new Date(participant.last_read_at)
        : new Date(0); // If never read, consider all messages as unread

      if (lastMessageAt > lastReadAt) {
        unreadCount++;
      }
    });
    return unreadCount;
  }
}

export default new ConversationService();
