import { Request, Response } from 'express';
export declare class SettingsController {
    getProfile(req: Request, res: Response): Promise<void>;
    updateProfile(req: Request, res: Response): Promise<void>;
    uploadAvatar(req: Request, res: Response): Promise<void>;
    getPlatformSettings(req: Request, res: Response): Promise<void>;
    updatePlatformSettings(req: Request, res: Response): Promise<void>;
    getNotificationSettings(req: Request, res: Response): Promise<void>;
    updateNotificationSettings(req: Request, res: Response): Promise<void>;
    getAdvancedSettings(req: Request, res: Response): Promise<void>;
    updateAdvancedSettings(req: Request, res: Response): Promise<void>;
    triggerBackup(req: Request, res: Response): Promise<void>;
    clearCache(req: Request, res: Response): Promise<void>;
    getSystemHealth(req: Request, res: Response): Promise<void>;
    getTimezones(req: Request, res: Response): Promise<void>;
}
declare const _default: SettingsController;
export default _default;
//# sourceMappingURL=settingsController.d.ts.map