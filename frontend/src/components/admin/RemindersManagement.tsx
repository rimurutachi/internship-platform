'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Plus, Edit, Trash2, Send, Calendar } from 'lucide-react';
import { InternshipReminder, CreateReminderRequest, ReminderType, NotificationChannel } from '@/types/internships-enhanced';
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';
import { useToast } from '@/hooks/use-toast';

interface RemindersManagementProps {
  internshipId: string;
}

export default function RemindersManagement({ internshipId }: RemindersManagementProps) {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<InternshipReminder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<InternshipReminder | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateReminderRequest>({
    reminder_type: 'pending_documents',
    scheduled_for: '',
    notification_channel: 'in_app',
    custom_message: ''
  });

  useEffect(() => {
    loadReminders();
  }, [internshipId]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await adminInternshipsEnhancedAPI.getReminders(internshipId);
      setReminders(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load reminders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    try {
      await adminInternshipsEnhancedAPI.createReminder(internshipId, formData);
      toast({
        title: 'Success',
        description: 'Reminder created successfully'
      });
      setShowCreateDialog(false);
      loadReminders();
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create reminder',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder) return;

    try {
      await adminInternshipsEnhancedAPI.updateReminder(editingReminder.id, {
        scheduled_for: formData.scheduled_for,
        notification_channel: formData.notification_channel,
        custom_message: formData.custom_message
      });
      toast({
        title: 'Success',
        description: 'Reminder updated successfully'
      });
      setEditingReminder(null);
      loadReminders();
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update reminder',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await adminInternshipsEnhancedAPI.deleteReminder(reminderId);
      toast({
        title: 'Success',
        description: 'Reminder deleted successfully'
      });
      loadReminders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete reminder',
        variant: 'destructive'
      });
    }
  };

  const handleSendNow = async (reminder: InternshipReminder) => {
    try {
      await adminInternshipsEnhancedAPI.sendReminder(reminder.id);
      toast({
        title: 'Success',
        description: 'Reminder sent successfully'
      });
      loadReminders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send reminder',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      reminder_type: 'pending_documents',
      scheduled_for: '',
      notification_channel: 'in_app',
      custom_message: ''
    });
  };

  const openEditDialog = (reminder: InternshipReminder) => {
    setEditingReminder(reminder);
    setFormData({
      reminder_type: reminder.reminder_type,
      scheduled_for: reminder.scheduled_for,
      notification_channel: reminder.notification_channel,
      custom_message: reminder.custom_message || ''
    });
  };

  const getReminderTypeLabel = (type: ReminderType): string => {
    const labels: Record<ReminderType, string> = {
      approaching_end_date: 'Approaching End Date',
      pending_documents: 'Pending Documents',
      pending_daily_report: 'Daily Report Reminder',
      evaluation_due: 'Evaluation Due',
      missing_supervisor: 'Missing Supervisor',
      custom: 'Custom'
    };
    return labels[type];
  };

  const getChannelBadge = (channel: NotificationChannel) => {
    const variants: Record<NotificationChannel, 'default' | 'secondary' | 'outline'> = {
      in_app: 'secondary',
      email: 'default',
      both: 'outline'
    };

    return (
      <Badge variant={variants[channel]}>
        {channel === 'in_app' ? 'In-App' : channel === 'email' ? 'Email' : 'Both'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reminders Management</CardTitle>
          <CardDescription>Loading reminders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reminders Management</CardTitle>
              <CardDescription>
                Schedule and manage automated reminders
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!reminders || reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reminders scheduled yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reminder Type</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {getReminderTypeLabel(reminder.reminder_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(reminder.scheduled_for).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {reminder.is_sent ? (
                        <Badge variant="default">Sent</Badge>
                      ) : (
                        <Badge variant="secondary">Scheduled</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getChannelBadge(reminder.notification_channel)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!reminder.is_sent && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendNow(reminder)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(reminder)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReminder(reminder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingReminder} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingReminder(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create New Reminder'}</DialogTitle>
            <DialogDescription>
              {editingReminder ? 'Update reminder details' : 'Schedule a new reminder for this internship'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reminder_type">Reminder Type</Label>
              <Select
                value={formData.reminder_type}
                onValueChange={(value) => setFormData({ ...formData, reminder_type: value as ReminderType })}
                disabled={!!editingReminder}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approaching_end_date">Approaching End Date</SelectItem>
                  <SelectItem value="pending_documents">Pending Documents</SelectItem>
                  <SelectItem value="pending_daily_report">Daily Report Reminder</SelectItem>
                  <SelectItem value="evaluation_due">Evaluation Due</SelectItem>
                  <SelectItem value="missing_supervisor">Missing Supervisor</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduled_for">Scheduled For</Label>
              <Input
                id="scheduled_for"
                type="datetime-local"
                value={formData.scheduled_for ? new Date(formData.scheduled_for).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, scheduled_for: new Date(e.target.value).toISOString() })}
              />
            </div>

            <div>
              <Label htmlFor="notification_channel">Notification Channel</Label>
              <Select
                value={formData.notification_channel}
                onValueChange={(value) => setFormData({ ...formData, notification_channel: value as NotificationChannel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="both">Both (In-App & Email)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom_message">Custom Message (Optional)</Label>
              <Textarea
                id="custom_message"
                value={formData.custom_message}
                onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                placeholder="Add a custom message..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingReminder(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingReminder ? handleUpdateReminder : handleCreateReminder}>
              {editingReminder ? 'Update Reminder' : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
