'use client';

import { useState } from 'react';
import { adminInternshipsAPI, InternshipWithRelations } from '@/lib/api/admin-internships';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Archive as ArchiveIcon } from 'lucide-react';

interface ArchiveInternshipDialogProps {
  open: boolean;
  onClose: () => void;
  internship: InternshipWithRelations;
  onSuccess: () => void;
}

export function ArchiveInternshipDialog({
  open,
  onClose,
  internship,
  onSuccess,
}: ArchiveInternshipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setLoading(true);
      await adminInternshipsAPI.archiveInternship(internship.id);
      toast({
        title: 'Success',
        description: 'Internship archived successfully. Historical data preserved.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive internship',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const studentName = internship.student?.name || 'Unknown Student';
  const companyName = internship.company?.name || 'Unknown Company';

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="h-5 w-5 text-orange-600" />
            Archive Internship
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to archive this internship?
              </p>
              
              <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                <p className="text-sm">
                  <strong>Student:</strong> {studentName}<br />
                  <strong>Company:</strong> {companyName}<br />
                  <strong>Position:</strong> {internship.position}<br />
                  <strong>Status:</strong> {internship.status}
                </p>
              </div>

              {internship.status === 'active' && (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ Warning:</strong> This internship is currently active. 
                    Consider completing or cancelling it before archiving.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Historical Data Preserved:</strong> All evaluations, documents, and 
                  activity logs will be preserved for reporting and analytics.
                </p>
              </div>

              <p className="text-sm pt-2">
                Archived internships can be restored later if needed. This action does not permanently delete any data.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Archive Internship
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
