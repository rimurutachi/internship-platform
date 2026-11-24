import { CreateNotificationDTO, Notification, NotificationQueryOptions, PaginatedNotificationsResult } from "../models/communication";
export declare class NotificationService {
    createNotification(data: CreateNotificationDTO): Promise<Notification>;
    getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
    getUserNotificationsPaginated(userId: string, options?: NotificationQueryOptions): Promise<PaginatedNotificationsResult>;
    getUnreadNotificationsCount(userId: string): Promise<number>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(notificationId: string, userId: string): Promise<void>;
    deleteReadNotifications(userId: string): Promise<number>;
    deleteAllNotifications(userId: string): Promise<number>;
    createBulkNotifications(notifications: CreateNotificationDTO[]): Promise<Notification[]>;
    notifyAdmins(payload: Omit<CreateNotificationDTO, "user_id">, excludeUserId?: string): Promise<void>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map