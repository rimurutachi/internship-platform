import { Server, Socket } from "socket.io";

import { setupNotificationHandlers } from "./handlers/notificationHandler";
import { setupEvaluationHandlers } from "./handlers/evaluationHandler";
import { setupStudentHandlers } from "./handlers/studentHandler";
import { setupMessageHandlers } from "./handlers/messageHandler";

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
    const userRole = socket.user?.role;

    console.log(`User connected: ${userEmail} (${userId}) - Role: ${userRole}`);

    // Setup handlers for different features

    setupNotificationHandlers(io, socket as any);
    setupEvaluationHandlers(io, socket as any);
    setupMessageHandlers(io, socket);
    
    // Setup student-specific handlers if user is a student
    if (userRole === 'student') {
      setupStudentHandlers(io, socket);
    }

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
