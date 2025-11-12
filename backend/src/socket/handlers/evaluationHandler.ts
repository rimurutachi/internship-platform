import { Server, Socket } from "socket.io";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const setupEvaluationHandlers = (
  io: Server,
  socket: AuthenticatedSocket
) => {
  const userId = socket.user?.id;

  // Join evaluation room (for specific internship / evaluation)
  socket.on("join_evaluation", (evaluationId: string) => {
    socket.join(`evaluation:${evaluationId}`);
    console.log(`User ${userId} joined evaluation ${evaluationId}`);
  });

  // Leave evaluation room
  socket.on("leave_evaluation", (evaluationId: string) => {
    socket.leave(`evaluation:${evaluationId}`);
    console.log(`User ${userId} left evaluation ${evaluationId}`);
  });
};
