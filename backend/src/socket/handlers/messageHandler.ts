import { Server, Socket } from "socket.io";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupMessageHandlers = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.user?.id;

  // Join conversation room
  socket.on("join_conversation", (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`User ${userId} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`User ${userId} left the conversation ${conversationId}`);
  });

  // Typing indicator
  socket.on("typing", (data: { conversationId: string; userName: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
      userId,
      userName: data.userName,
      conversationId: data.conversationId,
    });
  });

  // Stop typing indicator
  socket.on("stop_typing", (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("user_stop_typing", {
      userId,
      conversationId: data.conversationId,
    });
  });

  // Mark messages as read
  socket.on("mark_read", (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("message_read", {
      userId,
      conversationId: data.conversationId,
      timestamp: new Date(),
    });
  });
};
