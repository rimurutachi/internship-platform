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
    console.log("getUserConversations called for userId:", userId);
    
    // Step 1: Get conversation IDs for this user
    const { data: userParticipations, error: participationError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, role, last_read_at, joined_at")
      .eq("user_id", userId)
      .eq("is_active", true);

    console.log("User participations:", { count: userParticipations?.length, error: participationError?.message });

    if (participationError) throw new Error(participationError.message);
    if (!userParticipations || userParticipations.length === 0) return [];

    const conversationIds = userParticipations.map((p: any) => p.conversation_id);

    // Step 2: Get conversation details
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, type, name, internship_id, created_by, created_at, updated_at, last_message_at, last_message_id")
      .in("id", conversationIds);

    console.log("Conversations:", { count: conversations?.length, error: convError?.message });

    if (convError) throw new Error(convError.message);
    if (!conversations) return [];

    // Step 3: Get all participants for these conversations
    const { data: allParticipants, error: partError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, role, last_read_at, is_active, users(id, first_name, last_name, email, role)")
      .in("conversation_id", conversationIds)
      .eq("is_active", true);

    console.log("All participants:", { count: allParticipants?.length, error: partError?.message });

    if (partError) {
      console.error("Error fetching participants:", partError);
    }

    // Step 4: Combine data into expected format
    const result = conversations.map((conv: any) => {
      const userParticipation = userParticipations.find((p: any) => p.conversation_id === conv.id);
      const participants = allParticipants?.filter((p: any) => p.conversation_id === conv.id) || [];
      
      return {
        id: userParticipation?.conversation_id,
        user_id: userId,
        role: userParticipation?.role,
        last_read_at: userParticipation?.last_read_at,
        joined_at: userParticipation?.joined_at,
        is_active: true,
        conversation: {
          ...conv,
          participants: participants.map((p: any) => ({
            id: p.user_id,
            conversation_id: p.conversation_id,
            user_id: p.user_id,
            role: p.role,
            last_read_at: p.last_read_at,
            is_active: p.is_active,
            user: p.users
          }))
        }
      };
    });

    // Sort by last_read_at (most recent first)
    result.sort((a, b) => {
      const aTime = a.last_read_at ? new Date(a.last_read_at).getTime() : 0;
      const bTime = b.last_read_at ? new Date(b.last_read_at).getTime() : 0;
      return bTime - aTime;
    });

    console.log("Returning", result.length, "conversations");
    return result;
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

  // Search users for starting conversations
  async searchUsers(currentUserId: string, searchQuery?: string, roleFilter?: string): Promise<any[]> {
    let query = supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .neq("id", currentUserId) // Exclude current user
      .order("first_name", { ascending: true })
      .limit(20);

    // Apply role filter if provided
    if (roleFilter && roleFilter !== 'all') {
      query = query.eq("role", roleFilter);
    }

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.trim();
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Create or get existing direct conversation (1-on-1)
  async createDirectConversation(userId1: string, userId2: string): Promise<any> {
    // Check if a direct conversation already exists between these two users
    const { data: existingParticipants, error: searchError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, conversations(type)")
      .eq("user_id", userId1)
      .eq("is_active", true);

    if (searchError) throw new Error(searchError.message);

    // Find a direct conversation that includes both users
    if (existingParticipants && existingParticipants.length > 0) {
      for (const participant of existingParticipants) {
        const conversationId = participant.conversation_id;
        const conversation: any = participant.conversations;
        const conversationType = conversation?.type;

        // Only check direct conversations
        if (conversationType === "direct") {
          // Check if userId2 is also a participant in this conversation
          const { data: otherParticipant, error: checkError } = await supabase
            .from("conversation_participants")
            .select("id")
            .eq("conversation_id", conversationId)
            .eq("user_id", userId2)
            .eq("is_active", true)
            .single();

          if (!checkError && otherParticipant) {
            // Conversation exists, return it
            return await this.getConversation(conversationId);
          }
        }
      }
    }

    // No existing conversation found, create a new one
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        type: "direct",
        created_by: userId1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    // Add both users as participants
    const participants = [
      {
        conversation_id: newConversation.id,
        user_id: userId1,
        role: "member",
        joined_at: new Date().toISOString(),
        is_active: true,
      },
      {
        conversation_id: newConversation.id,
        user_id: userId2,
        role: "member",
        joined_at: new Date().toISOString(),
        is_active: true,
      },
    ];

    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert(participants);

    if (participantsError) throw new Error(participantsError.message);

    // Return the newly created conversation with participants
    return await this.getConversation(newConversation.id);
  }
}

export default new ConversationService();
