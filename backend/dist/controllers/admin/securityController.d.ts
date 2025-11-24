import { Request, Response } from 'express';
declare class SecurityController {
    static getOverview(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAuditLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getApiLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSecurityAlerts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateAlert(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getLoginAttempts(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getHealthStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static exportAuditLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default SecurityController;
//# sourceMappingURL=securityController.d.ts.map