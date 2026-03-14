import { io } from "../server";
import { Notification } from "../models/communication";

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
