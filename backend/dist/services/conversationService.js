"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
class ConversationService {
    // Create conversation
    async createConversation(creatorId, data) {
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
        if (convError)
            throw new Error(convError.message);
        if (!conversation)
            throw new Error("Failed to create conversation");
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
    async getUserConversations(userId) {
        console.log("getUserConversations called for userId:", userId);
        // Step 1: Get conversation IDs for this user
        const { data: userParticipations, error: participationError } = await supabase
            .from("conversation_participants")
            .select("conversation_id, role, last_read_at, joined_at")
            .eq("user_id", userId)
            .eq("is_active", true);
        console.log("User participations:", { count: userParticipations?.length, error: participationError?.message });
        if (participationError)
            throw new Error(participationError.message);
        if (!userParticipations || userParticipations.length === 0)
            return [];
        const conversationIds = userParticipations.map((p) => p.conversation_id);
        // Step 2: Get conversation details
        const { data: conversations, error: convError } = await supabase
            .from("conversations")
            .select("id, type, name, internship_id, created_by, created_at, updated_at, last_message_at, last_message_id")
            .in("id", conversationIds);
        console.log("Conversations:", { count: conversations?.length, error: convError?.message });
        if (convError)
            throw new Error(convError.message);
        if (!conversations)
            return [];
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
        const result = conversations.map((conv) => {
            const userParticipation = userParticipations.find((p) => p.conversation_id === conv.id);
            const participants = allParticipants?.filter((p) => p.conversation_id === conv.id) || [];
            return {
                id: userParticipation?.conversation_id,
                user_id: userId,
                role: userParticipation?.role,
                last_read_at: userParticipation?.last_read_at,
                joined_at: userParticipation?.joined_at,
                is_active: true,
                conversation: {
                    ...conv,
                    participants: participants.map((p) => ({
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
    async getConversation(conversationId) {
        const { data, error } = await supabase
            .from("conversations")
            .select(`*, 
        participants:conversation_participants(*, user:users(id, first_name, last_name, email)),
        created_by_user:users!created_by(id, first_name, last_name, email)`)
            .eq("id", conversationId)
            .eq("conversation_participants.is_active", true)
            .single();
        if (error)
            throw new Error(error.message);
        if (!data)
            throw new Error("Conversation not found");
        // Filter out inactive participants in the response
        if (data.participants) {
            data.participants = data.participants.filter((p) => p.is_active === true);
        }
        return data;
    }
    // Mark conversation as read
    async markAsRead(conversationId, userId) {
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
        if (error)
            throw new Error(error.message);
    }
    // Get unread count
    async getUnreadCount(userId) {
        const { data, error } = await supabase
            .from("conversation_participants")
            .select("conversation_id, last_read_at, conversations(last_message_at)")
            .eq("user_id", userId)
            .eq("is_active", true);
        if (error)
            throw new Error(error.message);
        if (!data || data.length === 0)
            return 0;
        let unreadCount = 0;
        data.forEach((participant) => {
            const conversation = participant.conversations;
            if (!conversation || !conversation.last_message_at)
                return;
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
exports.ConversationService = ConversationService;
exports.default = new ConversationService();
//# sourceMappingURL=conversationService.js.map