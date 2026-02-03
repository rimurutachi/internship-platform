"use strict";
/**
 * Internships Enhanced Service - Advanced Features
 *
 * Handles advanced functionality:
 * - Company capacity management
 * - Document completion tracking
 * - Data export (CSV/JSON/Excel)
 * - Analytics and metrics
 *
 * Use InternshipServiceFacade (internship.service.ts) for a unified API.
 *
 * @deprecated Consider using InternshipServiceFacade for new code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternshipsEnhancedService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const json2csv_1 = require("json2csv");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
class InternshipsEnhancedService {
    /**
     * Auto-decrement/increment company current_students
     */
    static async updateCompanyStudentCount(company_id, delta) {
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select('current_students')
            .eq('id', company_id)
            .single();
        if (fetchError) {
            throw new Error(`Failed to fetch company: ${fetchError.message}`);
        }
        const newCount = Math.max(0, (company.current_students || 0) + delta);
        const { error: updateError } = await supabase
            .from('companies')
            .update({ current_students: newCount, updated_at: new Date().toISOString() })
            .eq('id', company_id);
        if (updateError) {
            throw new Error(`Failed to update company student count: ${updateError.message}`);
        }
    }
    /**
     * Generate auto-reminders for internship
     */
    static async generateAutoReminders(internship_id) {
        const { data: internship, error: fetchError } = await supabase
            .from('internships')
            .select('*')
            .eq('id', internship_id)
            .single();
        if (fetchError || !internship) {
            throw new Error(`Failed to fetch internship: ${fetchError?.message || 'Not found'}`);
        }
        const reminders = [];
        const today = new Date();
        const startDate = new Date(internship.start_date);
        const endDate = new Date(internship.end_date);
        // Auto-create "Approaching End Date" reminder (7 days before)
        const sevenDaysBeforeEnd = new Date(endDate);
        sevenDaysBeforeEnd.setDate(sevenDaysBeforeEnd.getDate() - 7);
        if (sevenDaysBeforeEnd > today && internship.status === 'active') {
            reminders.push({
                internship_id,
                reminder_type: 'approaching_end_date',
                scheduled_for: sevenDaysBeforeEnd.toISOString(),
                notification_channel: 'email'
            });
        }
        // Auto-create weekly report reminders (every Friday at 5 PM)
        let currentDate = new Date(startDate);
        while (currentDate < endDate) {
            const fridayOfWeek = new Date(currentDate);
            const dayOfWeek = fridayOfWeek.getDay();
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // Next Friday
            fridayOfWeek.setDate(fridayOfWeek.getDate() + daysUntilFriday);
            fridayOfWeek.setHours(17, 0, 0, 0); // 5 PM
            if (fridayOfWeek > today && fridayOfWeek < endDate) {
                reminders.push({
                    internship_id,
                    reminder_type: 'pending_weekly_report',
                    scheduled_for: fridayOfWeek.toISOString(),
                    notification_channel: 'in_app'
                });
            }
            currentDate.setDate(currentDate.getDate() + 7); // Next week
        }
        // Auto-create evaluation reminder (14 days before end)
        const fourteenDaysBeforeEnd = new Date(endDate);
        fourteenDaysBeforeEnd.setDate(fourteenDaysBeforeEnd.getDate() - 14);
        if (fourteenDaysBeforeEnd > today && internship.status === 'active') {
            reminders.push({
                internship_id,
                reminder_type: 'evaluation_due',
                scheduled_for: fourteenDaysBeforeEnd.toISOString(),
                notification_channel: 'both'
            });
        }
        // Insert all reminders
        if (reminders.length > 0) {
            const { data, error } = await supabase
                .from('internship_reminders')
                .insert(reminders)
                .select();
            if (error) {
                throw new Error(`Failed to create reminders: ${error.message}`);
            }
            return data;
        }
        return [];
    }
    /**
     * Process scheduled reminders (to be called by cron job)
     */
    static async processScheduledReminders() {
        const now = new Date();
        // Get reminders that should be sent
        const { data: pendingReminders, error } = await supabase
            .from('internship_reminders')
            .select(`
        *,
        internship:internships(
          *,
          student:users!internships_student_id_fkey(id, email, name),
          advisor:users!internships_advisor_id_fkey(id, email, name),
          supervisor:users!internships_supervisor_id_fkey(id, email, name)
        )
      `)
            .eq('is_sent', false)
            .lte('scheduled_for', now.toISOString());
        if (error) {
            throw new Error(`Failed to fetch pending reminders: ${error.message}`);
        }
        const processedCount = pendingReminders?.length || 0;
        for (const reminder of pendingReminders || []) {
            try {
                // Send notification based on reminder type
                await this.sendReminderNotification(reminder);
                // Mark as sent
                await supabase
                    .from('internship_reminders')
                    .update({
                    is_sent: true,
                    sent_at: now.toISOString()
                })
                    .eq('id', reminder.id);
            }
            catch (err) {
                console.error(`Failed to process reminder ${reminder.id}:`, err);
            }
        }
        return processedCount;
    }
    /**
     * Send reminder notification
     */
    static async sendReminderNotification(reminder) {
        const internship = reminder.internship;
        if (!internship)
            return;
        let recipients = [];
        let notificationMessage = '';
        let notificationTitle = '';
        switch (reminder.reminder_type) {
            case 'approaching_end_date':
                recipients = [
                    internship.student?.id,
                    internship.advisor?.id,
                    internship.supervisor?.id
                ].filter(Boolean);
                notificationTitle = 'Internship Ending Soon';
                notificationMessage = `The internship at ${internship.company_name} is ending on ${new Date(internship.end_date).toLocaleDateString()}. Please prepare final evaluations and documents.`;
                break;
            case 'pending_documents':
                recipients = [internship.student?.id, internship.advisor?.id].filter(Boolean);
                notificationTitle = 'Pending Documents';
                notificationMessage = 'There are pending documents for your internship. Please submit them as soon as possible.';
                break;
            case 'pending_weekly_report':
                recipients = [internship.student?.id, internship.advisor?.id].filter(Boolean);
                notificationTitle = 'Weekly Report Due';
                notificationMessage = 'Your weekly progress report is due. Please submit it by end of day.';
                break;
            case 'evaluation_due':
                recipients = [internship.supervisor?.id].filter(Boolean);
                notificationTitle = 'Evaluation Due';
                notificationMessage = `Please submit your evaluation for ${internship.student?.name} before ${new Date(internship.end_date).toLocaleDateString()}.`;
                break;
            case 'missing_supervisor':
                recipients = [internship.advisor?.id].filter(Boolean);
                notificationTitle = 'Supervisor Assignment Required';
                notificationMessage = `Internship for ${internship.student?.name} is missing a supervisor assignment. Please resolve urgently.`;
                break;
            case 'custom':
                recipients = [
                    internship.student?.id,
                    internship.advisor?.id,
                    internship.supervisor?.id
                ].filter(Boolean);
                notificationTitle = 'Internship Reminder';
                notificationMessage = reminder.custom_message || 'You have a pending task for your internship.';
                break;
        }
        // Insert notifications for each recipient
        const notifications = recipients.map(user_id => ({
            user_id,
            type: 'internship_reminder',
            title: notificationTitle,
            message: notificationMessage,
            action_url: `/internships/${internship.id}`,
            reference_id: internship.id,
            reference_type: 'internship',
            created_at: new Date().toISOString()
        }));
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }
        // TODO: Integrate with email service if notification_channel includes 'email'
        if (reminder.notification_channel === 'email' || reminder.notification_channel === 'both') {
            // Email sending logic would go here
            console.log(`Email reminder sent for internship ${internship.id}`);
        }
    }
    /**
     * Export internships for bulk operations
     */
    static async exportInternships(internship_ids, format) {
        const { data: internships, error } = await supabase
            .from('internships')
            .select(`
        *,
        student:users!internships_student_id_fkey(name, email),
        advisor:users!internships_advisor_id_fkey(name, email),
        supervisor:users!internships_supervisor_id_fkey(name, email),
        company:companies(name)
      `)
            .in('id', internship_ids);
        if (error) {
            throw new Error(`Failed to fetch internships: ${error.message}`);
        }
        // Format based on requested format
        if (format === 'csv') {
            return this.convertToCSV(internships || []);
        }
        else if (format === 'json') {
            return internships;
        }
        else if (format === 'excel') {
            return this.convertToExcel(internships || []);
        }
    }
    /**
     * Convert internships to CSV
     */
    static convertToCSV(internships) {
        const fields = [
            'id',
            'student.name',
            'student.email',
            'advisor.name',
            'advisor.email',
            'supervisor.name',
            'supervisor.email',
            'company.name',
            'status',
            'start_date',
            'end_date',
            'position'
        ];
        const parser = new json2csv_1.Parser({ fields });
        return parser.parse(internships);
    }
    /**
     * Convert internships to Excel format (using CSV which Excel can open)
     */
    static convertToExcel(internships) {
        // Return CSV format - Excel can open CSV files natively
        return this.convertToCSV(internships);
    }
    /**
     * Get document completion status
     */
    static async getDocumentCompletionRate(internship_ids) {
        const { data: allDocuments, error } = await supabase
            .from('documents')
            .select('internship_id, type, status')
            .in('internship_id', internship_ids);
        if (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }
        const completionByInternship = {};
        const requiredTypes = ['MOA', 'Job Description', 'Final Evaluation'];
        internship_ids.forEach(id => {
            const docs = (allDocuments || []).filter(d => d.internship_id === id);
            const completedRequired = docs.filter(d => requiredTypes.includes(d.type) && d.status !== 'draft').length;
            completionByInternship[id] = (completedRequired / requiredTypes.length) * 100;
        });
        return completionByInternship;
    }
    /**
     * Get company capacity analytics
     */
    static async getCompanyCapacityAnalytics() {
        const { data: companies, error } = await supabase
            .from('companies')
            .select('id, name, capacity_limit, current_students, is_verified, is_moa_standardized');
        if (error) {
            throw new Error(`Failed to fetch companies: ${error.message}`);
        }
        const analytics = {
            total_companies: companies?.length || 0,
            at_capacity: 0,
            near_capacity: 0,
            with_availability: 0,
            metrics: companies?.map(company => ({
                ...company,
                capacity_usage_percent: Math.round((company.current_students / company.capacity_limit) * 100),
                is_at_capacity: company.current_students >= company.capacity_limit,
                is_near_capacity: company.current_students >= company.capacity_limit * 0.8
            })) || []
        };
        analytics.at_capacity = analytics.metrics.filter(c => c.is_at_capacity).length;
        analytics.near_capacity = analytics.metrics.filter(c => c.is_near_capacity && !c.is_at_capacity).length;
        analytics.with_availability = analytics.metrics.filter(c => !c.is_near_capacity).length;
        return analytics;
    }
    /**
     * Check if company can accept more students
     */
    static async validateCompanyCapacity(company_id) {
        const { data: company, error } = await supabase
            .from('companies')
            .select('capacity_limit, current_students, name')
            .eq('id', company_id)
            .single();
        if (error) {
            throw new Error(`Failed to fetch company: ${error.message}`);
        }
        if (!company) {
            return { canAccept: false, message: 'Company not found' };
        }
        if (company.current_students >= company.capacity_limit) {
            return {
                canAccept: false,
                message: `${company.name} is at capacity (${company.current_students}/${company.capacity_limit} slots used)`
            };
        }
        if (company.current_students >= company.capacity_limit * 0.8) {
            return {
                canAccept: true,
                message: `Warning: ${company.name} is nearing capacity (${company.current_students}/${company.capacity_limit} slots used)`
            };
        }
        return { canAccept: true };
    }
}
exports.InternshipsEnhancedService = InternshipsEnhancedService;
exports.default = InternshipsEnhancedService;
//# sourceMappingURL=internshipsEnhancedService.js.map