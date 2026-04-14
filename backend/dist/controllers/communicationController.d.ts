import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare class CommunicationController {
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