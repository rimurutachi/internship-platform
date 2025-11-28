interface InternshipReminder {
    id?: string;
    internship_id: string;
    reminder_type: string;
    scheduled_for: string;
    notification_channel: string;
    custom_message?: string;
    is_sent?: boolean;
    sent_at?: string;
}
export declare class InternshipsEnhancedService {
    /**
     * Auto-decrement/increment company current_students
     */
    static updateCompanyStudentCount(company_id: string, delta: number): Promise<void>;
    /**
     * Generate auto-reminders for internship
     */
    static generateAutoReminders(internship_id: string): Promise<InternshipReminder[]>;
    /**
     * Process scheduled reminders (to be called by cron job)
     */
    static processScheduledReminders(): Promise<number>;
    /**
     * Send reminder notification
     */
    private static sendReminderNotification;
    /**
     * Export internships for bulk operations
     */
    static exportInternships(internship_ids: string[], format: 'csv' | 'json' | 'excel'): Promise<any>;
    /**
     * Convert internships to CSV
     */
    private static convertToCSV;
    /**
     * Convert internships to Excel format (using CSV which Excel can open)
     */
    private static convertToExcel;
    /**
     * Get document completion status
     */
    static getDocumentCompletionRate(internship_ids: string[]): Promise<Record<string, number>>;
    /**
     * Get company capacity analytics
     */
    static getCompanyCapacityAnalytics(): Promise<any>;
    /**
     * Check if company can accept more students
     */
    static validateCompanyCapacity(company_id: string): Promise<{
        canAccept: boolean;
        message?: string;
    }>;
}
export default InternshipsEnhancedService;
//# sourceMappingURL=internshipsEnhancedService.d.ts.map