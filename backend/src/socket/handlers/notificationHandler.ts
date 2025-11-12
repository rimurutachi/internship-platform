import { Server, Socket } from "socket.io";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupNotificationHandlers = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.user?.id;

  // User joins their personal notification room
  socket.join(`user:${userId}`);
  console.log(`User ${userId} joined notification room`);

  // Request notification count
  socket.on("get_notification_count", async () => {
    socket.emit("notification_count_updated", { count: 0 });
  });
};
