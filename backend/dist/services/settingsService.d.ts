export declare class SettingsService {
    private supabase;
    constructor();
    validateEmail(email: string): boolean;
    validatePhone(phone: string): boolean;
    validateUrl(url: string): boolean;
    validateTimezone(tz: string): boolean;
    uploadToStorage(file: Buffer, bucket: string, path: string, contentType: string): Promise<string>;
    getTimezones(): {
        value: string;
        label: string;
    }[];
    triggerBackup(): Promise<{
        backup_id: string;
        status: string;
        message: string;
    }>;
    clearSystemCache(): Promise<{
        cleared_caches: string[];
        status: string;
    }>;
    getSystemHealth(): Promise<any>;
    getSetting(key: string): Promise<any>;
    updateSetting(key: string, value: any, type: string, description: string): Promise<void>;
    logActivity(userId: string, action: string, details: any): Promise<void>;
}
declare const _default: SettingsService;
export default _default;
//# sourceMappingURL=settingsService.d.ts.map