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
import { Loader2, ArchiveRestore } from 'lucide-react';

interface UnarchiveInternshipDialogProps {
  open: boolean;
  onClose: () => void;
  internship: InternshipWithRelations;
  onSuccess: () => void;
}

export function UnarchiveInternshipDialog({
  open,
  onClose,
  internship,
  onSuccess,
}: UnarchiveInternshipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUnarchive = async () => {
    try {
      setLoading(true);
      await adminInternshipsAPI.unarchiveInternship(internship.id);
      toast({
        title: 'Success',
        description: 'Internship unarchived successfully. Internship is now active again.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unarchive internship',
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
            <ArchiveRestore className="h-5 w-5 text-green-600" />
            Unarchive Internship
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to unarchive this internship?
              </p>

              <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                <p className="text-sm">
                  <strong>Student:</strong> {studentName}<br />
                  <strong>Company:</strong> {companyName}<br />
                  <strong>Position:</strong> {internship.position}<br />
                  <strong>Status:</strong> {internship.status}
                </p>
              </div>

              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Restore Internship:</strong> This internship will be restored and become visible again. 
                  All historical data will remain intact.
                </p>
              </div>

              <p className="text-sm pt-2">
                The internship will be available for management and reporting after unarchiving.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnarchive}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Unarchive Internship
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
