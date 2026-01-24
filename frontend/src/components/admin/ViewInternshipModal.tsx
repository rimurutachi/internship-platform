'use client';

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import type {
  InternshipWithRelations,
  ActivityLogEntry,
} from '@/lib/api/admin-internships';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, User, Building2, Briefcase } from 'lucide-react';
import RemindersManagement from './RemindersManagement';

interface ViewInternshipModalProps {
  open: boolean;
  onClose: () => void;
  internshipId: string;
}

export function ViewInternshipModal({
  open,
  onClose,
  internshipId,
}: ViewInternshipModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [internship, setInternship] = useState<InternshipWithRelations | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    if (open && internshipId) {
      fetchInternshipDetails();
    }
  }, [open, internshipId]);

  const fetchInternshipDetails = async () => {
    try {
      setLoading(true);
      const response = await adminInternshipsAPI.getInternship(internshipId);
      setInternship(response.data.internship);
      setActivityLog(response.data.activity_log);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch internship details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Internship Details</DialogTitle>
          <DialogDescription>
            View complete information about this internship assignment
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : internship ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Overview Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Overview</h3>
                {getStatusBadge(internship.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{internship.position}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {Math.ceil(
                      (new Date(internship.end_date).getTime() -
                        new Date(internship.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Student Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Student</h3>
              </div>
              <div className="ml-7 space-y-1">
                <p className="font-medium">{internship.student?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{internship.student?.email || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Company Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Company</h3>
              </div>
              <div className="ml-7 space-y-1">
                <p className="font-medium">{internship.company?.name || 'Unknown'}</p>
                {internship.company?.industry && (
                  <p className="text-sm text-muted-foreground">
                    Industry: {internship.company.industry}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Mentors Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Mentors</h3>
              </div>
              <div className="ml-7 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Advisor</p>
                  <p className="font-medium">{internship.advisor?.name || 'Not assigned'}</p>
                  <p className="text-sm text-muted-foreground">{internship.advisor?.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Supervisor</p>
                  <p className="font-medium">{internship.supervisor?.name || 'Not assigned'}</p>
                  <p className="text-sm text-muted-foreground">
                    {internship.supervisor?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Timeline</h3>
              </div>
              <div className="ml-7 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(internship.start_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(internship.end_date)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Activity Log Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Activity Log</h3>
              {activityLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activityLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {log.action.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.user?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                        {log.metadata?.changes && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p className="font-medium">Changes:</p>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata.changes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </TabsContent>

            <TabsContent value="reminders" className="mt-6">
              <RemindersManagement internshipId={internshipId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Internship not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
