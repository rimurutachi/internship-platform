import { io } from "../server";
import { Message, Notification } from "../models/communication";

// Emit new message to conversation
export const emitNewMessage = (conversationId: string, message: Message) => {
  io.to(`conversation:${conversationId}`).emit("new_message", message);
};

// Emit message edited
export const emitMessageEdited = (conversationId: string, message: Message) => {
  io.to(`conversation:${conversationId}`).emit("message_edited", message);
};

// Emit message deleted
export const emitMessageDeleted = (
  conversationId: string,
  messageId: string
) => {
  io.to(`conversation:${conversationId}`).emit("message_deleted", {
    messageId,
  });
};

// Emit new notification to user
export const emitNewNotification = (
  userId: string,
  notification: Notification
) => {
  io.to(`user:${userId}`).emit("new_notification", notification);
};

// Emit notification count update
export const emitNotificationCountUpdate = (userId: string, count: number) => {
  io.to(`user:${userId}`).emit("notification_count_updated", { count });
};

// Emit evaluation update
export const emitEvaluationUpdate = (evaluationId: string, data: any) => {
  io.to(`evaluation:${evaluationId}`).emit("evaluation_updated", data);
};

// Emit conversation updated (last_message_at, unread count)
export const emitConversationUpdate = (
  userId: string,
  conversationId: string,
  data: any
) => {
  io.to(`user:${userId}`).emit("conversation_updated", {
    conversationId,
    ...data,
  });
};
