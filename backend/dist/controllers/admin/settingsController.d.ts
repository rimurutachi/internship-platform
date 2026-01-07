import { Request, Response } from 'express';
declare class SettingsController {
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    uploadAvatar(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getPlatformSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    updatePlatformSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    getNotificationSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    updateNotificationSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    getAdvancedSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    updateAdvancedSettings(req: Request, res: Response): Response<any, Record<string, any>>;
    triggerBackup(req: Request, res: Response): Response<any, Record<string, any>>;
    clearCache(req: Request, res: Response): Response<any, Record<string, any>>;
    getSystemHealth(req: Request, res: Response): Response<any, Record<string, any>>;
    getTimezones(req: Request, res: Response): Response<any, Record<string, any>>;
}
declare const _default: SettingsController;
export default _default;
//# sourceMappingURL=settingsController.d.ts.map