import { Server, Socket } from "socket.io";
import { setupMessageHandlers } from "./handlers/messageHandler";
import { setupNotificationHandlers } from "./handlers/notificationHandler";
import { setupEvaluationHandlers } from "./handlers/evaluationHandler";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;
    const userEmail = socket.user?.email;

    console.log(`User connected: ${userEmail} (${userId})`);

    // Setup handlers for different features
    setupMessageHandlers(io, socket);
    setupNotificationHandlers(io, socket);
    setupEvaluationHandlers(io, socket);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userEmail} - Reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userEmail}: `, error);
    });
  });
};
