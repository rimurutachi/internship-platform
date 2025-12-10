'use client';

import { useState } from 'react';
import { adminCompaniesAPI, CompanyWithSupervisors } from '@/lib/api/admin-companies';
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

interface ArchiveCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  company: CompanyWithSupervisors;
  onSuccess: () => void;
}

export function ArchiveCompanyDialog({
  open,
  onClose,
  company,
  onSuccess,
}: ArchiveCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    try {
      setLoading(true);
      // Use archive endpoint to preserve historical data
      await adminCompaniesAPI.archiveCompany(company.id);
      toast({
        title: 'Success',
        description: 'Company archived successfully. Historical data preserved.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive company',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasActiveInternships = (company.active_internships && company.active_internships > 0) || 
                               (company.current_students && company.current_students > 0);
  const hasSupervisors = company.supervisor_count && company.supervisor_count > 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="h-5 w-5 text-orange-600" />
            Archive Company
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to archive <strong>{company.name}</strong>?
              </p>
              
              {hasActiveInternships && (
                <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ Warning:</strong> This company has {company.current_students || company.active_internships} active student(s). 
                    Please complete or transfer their internships before archiving.
                  </p>
                </div>
              )}

              {hasSupervisors && (
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>ℹ️ Info:</strong> This company has {company.supervisor_count} supervisor(s) assigned.
                  </p>
                </div>
              )}

              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Historical Data Preserved:</strong> All internship records, evaluations, and 
                  historical data will be preserved for reporting and analytics.
                </p>
              </div>

              <p className="text-sm pt-2">
                Archived companies can be restored later if needed. This action does not permanently delete any data.
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
            Archive Company
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
