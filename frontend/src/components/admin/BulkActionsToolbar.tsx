'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Download, FileText, Edit, CheckCircle, X } from 'lucide-react';
import { ReminderType, NotificationChannel } from '@/types/internships-enhanced';
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export default function BulkActionsToolbar({
  selectedIds,
  onClearSelection,
  onActionComplete
}: BulkActionsToolbarProps) {
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reminderForm, setReminderForm] = useState<{
    reminder_type: ReminderType;
    notification_channel: NotificationChannel;
    custom_message: string;
  }>({
    reminder_type: 'pending_documents',
    notification_channel: 'in_app',
    custom_message: ''
  });

  const [statusForm, setStatusForm] = useState({
    new_status: 'active'
  });

  const [exportForm, setExportForm] = useState({
    format: 'csv' as 'csv' | 'json' | 'excel'
  });

  const [reportForm, setReportForm] = useState({
    report_type: 'placement' as 'placement' | 'performance' | 'documents',
    format: 'pdf' as 'pdf' | 'excel'
  });

  const handleBulkSendReminders = async () => {
    try {
      setLoading(true);
      console.log('🚀 Sending bulk reminders...', { selectedIds, reminderForm });
      
      const result = await adminInternshipsEnhancedAPI.bulkSendReminders({
        internship_ids: selectedIds,
        ...reminderForm
      });

      console.log('✅ Bulk reminders result:', result);

      toast.success(`Reminders sent to ${result.sent_count || 0} internships. ${result.failed_count || 0} failed.`);

      setShowReminderDialog(false);
      onActionComplete();
    } catch (error: any) {
      console.error('❌ Bulk reminders error:', error);
      toast.error(error.response?.data?.error || 'Failed to send reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdateStatus = async () => {
    try {
      setLoading(true);
      const result = await adminInternshipsEnhancedAPI.bulkUpdateStatus({
        internship_ids: selectedIds,
        new_status: statusForm.new_status
      });

      toast.success(`Status updated for ${result.updated_count || 0} internships.`);

      setShowStatusDialog(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const result = await adminInternshipsEnhancedAPI.bulkExport({
        ids: selectedIds,
        format: exportForm.format
      });

      // Create download link
      const mimeTypes = {
        csv: 'text/csv',
        json: 'application/json',
        excel: 'text/csv'  // Excel format returns CSV
      };
      
      const fileExtensions = {
        csv: 'csv',
        json: 'json',
        excel: 'csv'  // Changed from xlsx to csv since we're exporting CSV format
      };
      
      // Prepare content based on format
      let content;
      if (exportForm.format === 'json') {
        content = JSON.stringify(result.export_data, null, 2);
      } else {
        // CSV and Excel both return CSV text from backend
        content = result.export_data;
      }
      
      const blob = new Blob([content], { 
        type: mimeTypes[exportForm.format as keyof typeof mimeTypes] || 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `internships-export-${Date.now()}.${fileExtensions[exportForm.format as keyof typeof fileExtensions]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${result.total_records} internships`);

      setShowExportDialog(false);
      onActionComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const result = await adminInternshipsEnhancedAPI.generateReport({
        internship_ids: selectedIds,
        ...reportForm
      });

      console.log('✅ Report generated:', result);

      // Show success message
      toast.success('Report generation requested successfully!', {
        description: 'Note: Actual PDF/Excel generation is a Phase 2 feature'
      });

      setShowReportDialog(false);
      onActionComplete();
    } catch (error: any) {
      console.error('❌ Report generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-primary" />
          <span className="font-medium">
            {selectedIds.length} internship{selectedIds.length > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowReminderDialog(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Reminders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Send Reminders Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk Reminders</DialogTitle>
            <DialogDescription>
              Send reminders to {selectedIds.length} selected internship{selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Reminder Type</Label>
              <Select
                value={reminderForm.reminder_type}
                onValueChange={(value) => setReminderForm({ ...reminderForm, reminder_type: value as ReminderType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approaching_end_date">Approaching End Date</SelectItem>
                  <SelectItem value="pending_documents">Pending Documents</SelectItem>
                  <SelectItem value="pending_daily_report">Daily Report Reminder</SelectItem>
                  <SelectItem value="evaluation_due">Evaluation Due</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notification Channel</Label>
              <Select
                value={reminderForm.notification_channel}
                onValueChange={(value) => setReminderForm({ ...reminderForm, notification_channel: value as NotificationChannel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Custom Message (Optional)</Label>
              <Textarea
                value={reminderForm.custom_message}
                onChange={(e) => setReminderForm({ ...reminderForm, custom_message: e.target.value })}
                placeholder="Add a custom message..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                console.log('Button clicked!');
                handleBulkSendReminders();
              }} 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reminders'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedIds.length} selected internship{selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select
                value={statusForm.new_status}
                onValueChange={(value) => setStatusForm({ new_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdateStatus} disabled={loading}>
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Selected</DialogTitle>
            <DialogDescription>
              Export {selectedIds.length} internship{selectedIds.length > 1 ? 's' : ''} to file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <Select
                value={exportForm.format}
                onValueChange={(value) => setExportForm({ format: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading}>
              {loading ? 'Exporting...' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Generate report for {selectedIds.length} internship{selectedIds.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select
                value={reportForm.report_type}
                onValueChange={(value) => setReportForm({ ...reportForm, report_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placement">Placement Summary</SelectItem>
                  <SelectItem value="performance">Performance Summary</SelectItem>
                  <SelectItem value="documents">Document Submission Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Format</Label>
              <Select
                value={reportForm.format}
                onValueChange={(value) => setReportForm({ ...reportForm, format: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
