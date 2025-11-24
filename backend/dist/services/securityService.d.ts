interface SecurityHealth {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    details: {
        critical_alerts?: number;
        active_alerts?: number;
        failed_logins_last_hour?: number;
        api_errors_last_hour?: number;
    };
}
interface LoginAttemptResult {
    logged: boolean;
    alert_created: boolean;
    should_lock_account?: boolean;
}
declare class SecurityService {
    calculateSecurityHealth(): Promise<SecurityHealth>;
    detectSuspiciousActivity(userId: string, action: string, metadata: Record<string, any>): Promise<string | null>;
    logAuditEvent(userId: string, action: string, resource: string, details: Record<string, any>): Promise<string | null>;
    logLoginAttempt(email: string, success: boolean, ip: string | null, userAgent: string | null, failureReason?: string | null): Promise<LoginAttemptResult>;
    getFailedLoginCount(email: string, windowMinutes?: number): Promise<number>;
    maskIpAddress(ip: string | null): string;
    shouldShowIpAddress(): Promise<boolean>;
    getSecuritySetting(key: string): Promise<any>;
}
declare const _default: SecurityService;
export default _default;
//# sourceMappingURL=securityService.d.ts.map