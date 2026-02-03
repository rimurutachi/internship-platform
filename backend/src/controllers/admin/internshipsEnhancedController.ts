import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { internshipService } from '../../services/internship.service';
import notificationService from '../../services/notificationService';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export class InternshipsEnhancedController {
  /**
   * GET /admin/internships/reminders/:internship_id
   * Get all reminders for an internship
   */
  static async getReminders(req: Request, res: Response): Promise<void> {
    try {
      const { internship_id } = req.params;

      const { data: reminders, error } = await supabase
        .from('internship_reminders')
        .select('*')
        .eq('internship_id', internship_id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.json({
        success: true,
        data: { reminders }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/:internship_id/reminders
   * Create a new reminder for an internship
   */
  static async createReminder(req: Request, res: Response): Promise<void> {
    try {
      const { internship_id } = req.params;
      const { reminder_type, scheduled_for, notification_channel, custom_message } = req.body;

      // Validate reminder_type
      const validTypes = [
        'approaching_end_date',
        'pending_documents',
        'pending_weekly_report',
        'evaluation_due',
        'missing_supervisor',
        'custom'
      ];

      if (!validTypes.includes(reminder_type)) {
        res.status(400).json({ success: false, error: 'Invalid reminder_type' });
        return;
      }

      if (!scheduled_for) {
        res.status(400).json({ success: false, error: 'scheduled_for is required' });
        return;
      }

      // Check if internship exists
      const { data: internship, error: internshipError } = await supabase
        .from('internships')
        .select('id')
        .eq('id', internship_id)
        .single();

      if (internshipError || !internship) {
        res.status(404).json({ success: false, error: 'Internship not found' });
        return;
      }

      // Create reminder
      const { data: reminder, error } = await supabase
        .from('internship_reminders')
        .insert({
          internship_id,
          reminder_type,
          scheduled_for,
          notification_channel: notification_channel || 'in_app',
          custom_message,
          is_sent: false
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'reminder_created',
          entity_type: 'internship_reminder',
          entity_id: reminder.id,
          internship_id,
          description: `Admin created ${reminder_type} reminder for ${scheduled_for}`,
          metadata: { custom_message }
        });

      res.status(201).json({
        success: true,
        data: { reminder, message: 'Reminder scheduled successfully' }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /admin/internships/reminders/:reminder_id
   * Update an existing reminder
   */
  static async updateReminder(req: Request, res: Response): Promise<void> {
    try {
      const { reminder_id } = req.params;
      const { scheduled_for, notification_channel, custom_message } = req.body;

      const updateData: any = { updated_at: new Date().toISOString() };
      if (scheduled_for) updateData.scheduled_for = scheduled_for;
      if (notification_channel) updateData.notification_channel = notification_channel;
      if (custom_message !== undefined) updateData.custom_message = custom_message;

      const { data: reminder, error } = await supabase
        .from('internship_reminders')
        .update(updateData)
        .eq('id', reminder_id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      if (!reminder) {
        res.status(404).json({ success: false, error: 'Reminder not found' });
        return;
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'reminder_updated',
          entity_type: 'internship_reminder',
          entity_id: reminder.id,
          description: `Admin updated reminder ${reminder_id}`,
          metadata: updateData
        });

      res.json({
        success: true,
        data: { reminder, message: 'Reminder updated successfully' }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /admin/internships/reminders/:reminder_id
   * Delete a reminder
   */
  static async deleteReminder(req: Request, res: Response): Promise<void> {
    try {
      const { reminder_id } = req.params;

      const { error } = await supabase
        .from('internship_reminders')
        .delete()
        .eq('id', reminder_id);

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'reminder_deleted',
          entity_type: 'internship_reminder',
          entity_id: reminder_id,
          description: `Admin deleted reminder ${reminder_id}`
        });

      res.json({
        success: true,
        data: { message: 'Reminder deleted successfully' }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/:internship_id/send-reminder
   * Send immediate reminder (not scheduled)
   */
  static async sendReminder(req: Request, res: Response): Promise<void> {
    try {
      const { internship_id } = req.params;
      const { reminder_type, notification_channel, custom_message } = req.body;

      // Get internship details with related users
      const { data: internship, error: fetchError } = await supabase
        .from('internships')
        .select(`
          *,
          student:users!internships_student_id_fkey(id, email, name),
          advisor:users!internships_advisor_id_fkey(id, email, name),
          supervisor:users!internships_supervisor_id_fkey(id, email, name)
        `)
        .eq('id', internship_id)
        .single();

      if (fetchError || !internship) {
        res.status(404).json({ success: false, error: 'Internship not found' });
        return;
      }

      // Prepare notification based on reminder_type
      const recipients: string[] = [];
      let notificationMessage = custom_message || '';
      let notificationTitle = 'Internship Reminder';

      switch (reminder_type) {
        case 'approaching_end_date':
          recipients.push(internship.student?.id, internship.advisor?.id, internship.supervisor?.id);
          notificationTitle = 'Internship Ending Soon';
          notificationMessage = notificationMessage || `Your internship is ending soon (${new Date(internship.end_date).toLocaleDateString()}). Please prepare final evaluations.`;
          break;

        case 'pending_documents':
          recipients.push(internship.student?.id, internship.advisor?.id);
          notificationTitle = 'Pending Documents';
          notificationMessage = notificationMessage || 'There are pending documents for your internship. Please submit them.';
          break;

        case 'evaluation_due':
          recipients.push(internship.supervisor?.id);
          notificationTitle = 'Evaluation Due';
          notificationMessage = notificationMessage || `Please submit your evaluation for ${internship.student?.name} before ${new Date(internship.end_date).toLocaleDateString()}.`;
          break;

        case 'pending_weekly_report':
          recipients.push(internship.student?.id, internship.advisor?.id);
          notificationTitle = 'Weekly Report Due';
          notificationMessage = notificationMessage || 'Your weekly progress report is due. Please submit it.';
          break;

        default:
          recipients.push(internship.student?.id, internship.advisor?.id, internship.supervisor?.id);
      }

      // Filter out null/undefined recipients
      const validRecipients = recipients.filter(Boolean);

      // Send notifications using notificationService (with real-time socket delivery)
      let notificationCount = 0;
      for (const userId of validRecipients) {
        try {
          await notificationService.createNotification({
            user_id: userId,
            type: reminder_type || 'system',
            title: notificationTitle,
            message: notificationMessage,
            action_url: `/dashboard/student/internship`,
            reference_type: 'internship',
          });
          notificationCount++;
        } catch (notifError) {
          console.error(`Failed to send notification to ${userId}:`, notifError);
        }
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'reminder_sent_manual',
          entity_type: 'internship',
          entity_id: internship_id,
          internship_id,
          description: `Admin sent manual ${reminder_type} reminder`,
          metadata: { recipients: validRecipients, channel: notification_channel }
        });

      res.json({
        success: true,
        message: `Reminder sent to ${notificationCount} recipients`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/companies/capacity-overview
   * Get company capacity overview
   */
  static async getCapacityOverview(req: Request, res: Response): Promise<void> {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          internships(id, end_date, status)
        `)
        .order('is_verified', { ascending: false });

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      const capacityData = (companies || []).map((company: any) => {
        // Count upcoming expirations (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const upcomingExpirations = (company.internships || []).filter((i: any) => {
          const endDate = new Date(i.end_date);
          return i.status === 'active' && endDate <= thirtyDaysFromNow;
        }).length;

        return {
          id: company.id,
          name: company.name,
          is_verified: company.is_verified,
          is_moa_standardized: company.is_moa_standardized,
          capacity_limit: company.capacity_limit || 10,
          current_students: company.current_students || 0,
          capacity_usage_percent: Math.round(((company.current_students || 0) / (company.capacity_limit || 10)) * 100),
          is_at_capacity: (company.current_students || 0) >= (company.capacity_limit || 10),
          is_near_capacity: (company.current_students || 0) >= (company.capacity_limit || 10) * 0.8,
          upcoming_expirations: upcomingExpirations
        };
      });

      res.json({ success: true, data: { companies: capacityData } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * PATCH /admin/companies/:company_id/capacity
   * Update company capacity settings
   */
  static async updateCompanyCapacity(req: Request, res: Response): Promise<void> {
    try {
      const { company_id } = req.params;
      const { capacity_limit, is_moa_standardized } = req.body;

      const updateData: any = { updated_at: new Date().toISOString() };
      if (capacity_limit !== undefined) updateData.capacity_limit = capacity_limit;
      if (is_moa_standardized !== undefined) updateData.is_moa_standardized = is_moa_standardized;

      const { data: company, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', company_id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      if (!company) {
        res.status(404).json({ success: false, error: 'Company not found' });
        return;
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'company_capacity_updated',
          entity_type: 'company',
          entity_id: company.id,
          description: `Admin updated capacity settings for ${company.name}`,
          metadata: updateData
        });

      res.json({
        success: true,
        data: { company, message: 'Company capacity updated successfully' }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/:internship_id/documents-status
   * Get document submission status for internship
   */
  static async getDocumentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { internship_id } = req.params;

      // Query documents linked to internship
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select(`
          *,
          owner:users(id, name, email)
        `)
        .eq('internship_id', internship_id)
        .order('created_at', { ascending: false });

      if (docsError) {
        res.status(500).json({ success: false, error: docsError.message });
        return;
      }

      // Get internship to check duration for expected weekly reports
      const { data: internship, error: internshipError } = await supabase
        .from('internships')
        .select('start_date, end_date, status')
        .eq('id', internship_id)
        .single();

      if (internshipError || !internship) {
        res.status(404).json({ success: false, error: 'Internship not found' });
        return;
      }

      // Calculate weeks and flag missing reports
      const startDate = new Date(internship.start_date);
      const endDate = new Date(internship.end_date);
      const weeksOfInternship = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Categorize documents
      const requiredDocs = ['MOA', 'Job Description', 'Final Evaluation'];
      const submittedDocTypes = (documents || []).map((d: any) => d.type);

      const documentStatus = {
        required_documents: requiredDocs.map(type => {
          const doc = (documents || []).find((d: any) => d.type === type);
          return {
            type,
            required: true,
            status: doc ? (doc.status === 'draft' ? 'pending' : 'submitted') : 'missing',
            submitted_by: doc?.owner?.name || null,
            submitted_at: doc?.created_at || null
          };
        }),
        weekly_reports: Array(weeksOfInternship)
          .fill(null)
          .map((_, i) => {
            const weekNum = i + 1;
            const expectedBy = new Date(startDate.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000);
            const doc = (documents || []).find((d: any) => d.type === `Weekly Report - Week ${weekNum}`);
            const isPastDue = expectedBy < new Date() && !doc;

            return {
              type: `Weekly Report - Week ${weekNum}`,
              required: true,
              expected_by: expectedBy.toISOString(),
              status: doc ? 'submitted' : (isPastDue ? 'overdue' : 'pending'),
              submitted_by: doc?.owner?.name || null,
              submitted_at: doc?.created_at || null
            };
          }),
        submitted_documents: documents || []
      };

      res.json({ success: true, data: documentStatus });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/bulk/prepare-export
   * Prepare internships for export
   */
  static async prepareExport(req: Request, res: Response): Promise<void> {
    try {
      const { ids, format } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, error: 'ids array is required' });
        return;
      }

      const exportFormat = format || 'json';

      const exportData = await internshipService.exportInternships(
        ids,
        exportFormat as any
      );

      res.json({
        success: true,
        export_data: exportData,
        total_records: ids.length,
        format: exportFormat
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/bulk/send-reminders
   * Send reminders to multiple internships
   */
  static async bulkSendReminders(req: Request, res: Response): Promise<void> {
    try {
      const { internship_ids, reminder_type, notification_channel, custom_message } = req.body;

      if (!internship_ids || !Array.isArray(internship_ids) || internship_ids.length === 0) {
        res.status(400).json({ success: false, error: 'internship_ids array is required' });
        return;
      }

      let sentCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const internshipId of internship_ids) {
        try {
          // Use the send reminder logic
          const mockReq = {
            params: { internship_id: internshipId },
            body: { reminder_type, notification_channel, custom_message },
            user: (req as any).user
          } as any;

          const mockRes = {
            status: (code: number) => mockRes,
            json: (data: any) => {
              if (data.success) sentCount++;
              else {
                failedCount++;
                errors.push(`${internshipId}: ${data.error}`);
              }
            }
          } as any;

          await InternshipsEnhancedController.sendReminder(mockReq, mockRes);
        } catch (error: any) {
          failedCount++;
          errors.push(`${internshipId}: ${error.message}`);
        }
      }

      res.json({
        success: true,
        sent_count: sentCount,
        failed_count: failedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/bulk/update-status
   * Update status for multiple internships
   */
  static async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { internship_ids, new_status } = req.body;

      if (!internship_ids || !Array.isArray(internship_ids) || internship_ids.length === 0) {
        res.status(400).json({ success: false, error: 'internship_ids array is required' });
        return;
      }

      if (!new_status) {
        res.status(400).json({ success: false, error: 'new_status is required' });
        return;
      }

      const { data, error } = await supabase
        .from('internships')
        .update({ status: new_status, updated_at: new Date().toISOString() })
        .in('id', internship_ids)
        .select();

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      // Log action
      await supabase
        .from('activity_log')
        .insert({
          user_id: (req as any).user?.id,
          action: 'bulk_status_update',
          entity_type: 'internship',
          description: `Admin updated status to ${new_status} for ${internship_ids.length} internships`,
          metadata: { internship_ids, new_status, count: internship_ids.length }
        });

      res.json({
        success: true,
        updated_count: data?.length || 0,
        failed_count: internship_ids.length - (data?.length || 0)
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/generate-report
   * Generate report for internships
   */
  static async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { internship_ids, report_type, format } = req.body;

      if (!internship_ids || !Array.isArray(internship_ids)) {
        res.status(400).json({ success: false, error: 'internship_ids array is required' });
        return;
      }

      // Placeholder for report generation logic
      // In production, this would generate PDF/Excel reports

      const reportData = {
        report_type: report_type || 'placement',
        format: format || 'pdf',
        internship_count: internship_ids.length,
        generated_at: new Date().toISOString(),
        generated_by: (req as any).user?.id
      };

      res.json({
        success: true,
        report_url: `/reports/${Date.now()}.${format}`,
        message: 'Report generation initiated successfully',
        metadata: reportData
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/analytics/capacity-distribution
   * Get company capacity analytics
   */
  static async getCapacityAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await internshipService.getCompanyCapacityAnalytics();

      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/analytics/document-submission-rate
   * Get document submission analytics
   */
  static async getDocumentSubmissionRate(req: Request, res: Response): Promise<void> {
    try {
      // Get all active internships
      const { data: internships, error } = await supabase
        .from('internships')
        .select('id, company_id, company:companies(name)')
        .eq('status', 'active');

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      const internshipIds = (internships || []).map((i: any) => i.id);
      const completionRates = await internshipService.getDocumentCompletionRate(internshipIds);

      const totalRate = Object.values(completionRates).reduce((sum: number, rate: any) => sum + rate, 0) / internshipIds.length;

      // Group by company
      const byCompany: Record<string, { total: number; count: number; avg: number }> = {};
      (internships || []).forEach((internship: any) => {
        const companyName = internship.company?.name || 'Unknown';
        if (!byCompany[companyName]) {
          byCompany[companyName] = { total: 0, count: 0, avg: 0 };
        }
        byCompany[companyName].total += completionRates[internship.id] || 0;
        byCompany[companyName].count += 1;
        byCompany[companyName].avg = byCompany[companyName].total / byCompany[companyName].count;
      });

      res.json({
        success: true,
        data: {
          overall_rate: Math.round(totalRate),
          by_company: byCompany,
          total_internships: internshipIds.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /admin/internships/enhanced/capacity/validate
   * Validate company capacity
   */
  static async validateCapacity(req: Request, res: Response): Promise<void> {
    try {
      const { company_id } = req.body;

      if (!company_id) {
        res.status(400).json({ success: false, error: 'company_id is required' });
        return;
      }

      const isValid = await internshipService.validateCompanyCapacity(company_id);

      res.json({
        is_valid: isValid,
        message: isValid ? 'Company has available capacity' : 'Company is at full capacity'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/enhanced/analytics/deadline-tracking
   * Get deadline tracking analytics
   */
  static async getDeadlineTracking(req: Request, res: Response): Promise<void> {
    try {
      const { data: internships, error } = await supabase
        .from('internships')
        .select('id, position, end_date, student:student_id(name, email), company:company_id(name)')
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      const now = new Date();
      const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      const approaching_deadlines = (internships || []).filter((internship: any) => {
        const endDate = new Date(internship.end_date);
        return endDate >= now && endDate <= twoWeeksFromNow;
      });

      res.json({
        approaching_deadlines: approaching_deadlines.map((i: any) => ({
          id: i.id,
          position: i.position,
          end_date: i.end_date,
          student_name: i.student?.name,
          company_name: i.company?.name,
          days_remaining: Math.ceil((new Date(i.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        })),
        total_count: approaching_deadlines.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /admin/internships/enhanced/documents/completion-rate
   * Get document completion rate
   */
  static async getDocumentCompletionRate(req: Request, res: Response): Promise<void> {
    try {
      const { internship_ids } = req.query;

      if (!internship_ids) {
        res.status(400).json({ success: false, error: 'internship_ids is required' });
        return;
      }

      const ids = (internship_ids as string).split(',');
      const completionRates = await internshipService.getDocumentCompletionRate(ids);

      const totalRate = Object.values(completionRates).reduce((sum: number, rate: any) => sum + rate, 0) / ids.length;

      res.json({
        overall_completion: Math.round(totalRate),
        by_internship: completionRates,
        total_internships: ids.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default InternshipsEnhancedController;
