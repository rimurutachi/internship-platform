import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare class CommunicationController {
    sendMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getMessages(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    editMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createConversation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserConversations(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getConversation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    markAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUnreadCount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    searchUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createDirectConversation(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    createNotification(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getNotifications(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getUnreadNotificationsCount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    markNotificationAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    markAllAsRead(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteNotification(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: CommunicationController;
export default _default;
//# sourceMappingURL=communicationController.d.ts.map