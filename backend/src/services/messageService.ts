import { createClient } from "@supabase/supabase-js";
import { CreateMessageDTO, Message } from "../models/communication";
import {
  emitNewMessage,
  emitMessageEdited,
  emitMessageDeleted,
} from "../socket/emitters";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class MessageService {
  // Send message
  async sendMessage(
    senderId: string,
    data: CreateMessageDTO
  ): Promise<Message> {
    // Insert message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: senderId,
        content: data.content,
        message_type: data.message_type || "text",
        file_url: data.file_url,
      })
      .select()
      .single();

    if (messageError) throw new Error(messageError.message);

    // Update conversation's last_message_at
    const { error: convError } = await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversation_id);

    if (convError) {
      // Log error but don't fail the message send
      console.error(
        "Failed to update conversation last_message_at:",
        convError
      );
    }

    // Emit real-time event
    emitNewMessage(data.conversation_id, message);

    return message;
  }

  // Get conversation messages
  async getMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<Message[]> {
    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 100);
    const validOffset = Math.max(0, offset);

    const { data, error } = await supabase
      .from("messages")
      .select(`*, sender:users!sender_id(id, first_name, last_name, email)`)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(validOffset, validOffset + validLimit - 1);

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Edit message
  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    // Check if message exists and belongs to user
    const { data: existingMessage, error: checkError } = await supabase
      .from("messages")
      .select("id, sender_id, is_deleted")
      .eq("id", messageId)
      .single();

    if (checkError || !existingMessage) {
      throw new Error("Message not found");
    }

    if (existingMessage.sender_id !== userId) {
      throw new Error("You can only edit your own messages");
    }

    if (existingMessage.is_deleted) {
      throw new Error("Cannot edit a deleted message");
    }

    // Update message
    const { data, error } = await supabase
      .from("messages")
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("sender_id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to update message");

    // Get conversation_id to emit
    const { data: messageData } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("id", messageId)
      .single();

    if (messageData) {
      emitMessageEdited(messageData.conversation_id, data);
    }

    return data;
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Check if message exists and belongs to user
    const { data: existingMessage, error: checkError } = await supabase
      .from("messages")
      .select("id, sender_id")
      .eq("id", messageId)
      .single();

    if (checkError || !existingMessage) {
      throw new Error("Message not found");
    }

    if (existingMessage.sender_id !== userId) {
      throw new Error("You can only delete your own messages");
    }

    // Soft delete message
    const { error } = await supabase
      .from("messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .eq("sender_id", userId);

    if (error) throw new Error(error.message);

    // Emit real-time event
    if (existingMessage) {
      emitMessageDeleted(existingMessage.sender_id, messageId);
    }
  }
}

export default new MessageService();
