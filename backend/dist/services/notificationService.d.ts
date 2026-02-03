import { CreateNotificationDTO, Notification } from "../models/communication";
export declare class NotificationService {
    createNotification(data: CreateNotificationDTO): Promise<Notification>;
    getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
    getUnreadNotificationsCount(userId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    createBulkNotifications(notifications: CreateNotificationDTO[]): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map