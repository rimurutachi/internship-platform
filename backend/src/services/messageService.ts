import { createClient } from "@supabase/supabase-js";
import { CreateMessageDTO, Message } from "../models/communication";
import {
  emitNewMessage,
  emitMessageEdited,
  emitMessageDeleted,
  emitConversationUpdate,
} from "../socket/emitters";
import { v4 as uuidv4 } from "uuid";
import notificationService from "./notificationService";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export class MessageService {
  // Upload file to Supabase Storage
  async uploadFile(
    file: Express.Multer.File,
    conversationId: string
  ): Promise<{ url: string; metadata: any }> {
    try {
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("message-attachments").getPublicUrl(filePath);

      const metadata = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        extension: fileExt,
      };

      return { url: publicUrl, metadata };
    } catch (error: any) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  // Send message
  async sendMessage(
    senderId: string,
    data: CreateMessageDTO,
    file?: Express.Multer.File
  ): Promise<Message> {
    let fileUrl: string | undefined;
    let metadata: any = data.metadata || {};

    // If file is provided, upload it first
    if (file) {
      const uploadResult = await this.uploadFile(file, data.conversation_id);
      fileUrl = uploadResult.url;
      metadata = { ...metadata, ...uploadResult.metadata };
    }

    // Determine message type and content
    const messageType = file ? "file" : data.message_type || "text";
    const content = data.content || (file ? file.originalname : "");

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl || data.file_url,
        metadata,
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

    // Get all participants to notify them
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", data.conversation_id)
      .eq("is_active", true);

    // Emit real-time event to conversation room
    emitNewMessage(data.conversation_id, message);

    // Emit conversation update to all participants
    if (participants) {
      participants.forEach((participant) => {
        emitConversationUpdate(participant.user_id, data.conversation_id, {
          last_message_at: new Date().toISOString(),
          last_message: message.content,
        });

        // Send notification to participants (except sender)
        if (participant.user_id !== senderId) {
          notificationService
            .createNotification({
              user_id: participant.user_id,
              type: "message_received",
              title: "New Message",
              message: message.content.substring(0, 100) + (message.content.length > 100 ? "..." : ""),
              action_url: `/dashboard/messages?conversation=${data.conversation_id}`,
              reference_type: "message",
            })
            .catch((notifError) => {
              console.error("⚠️ Failed to send message notification:", notifError);
            });
        }
      });
    }

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
