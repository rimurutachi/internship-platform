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
import { Loader2, ArchiveRestore } from 'lucide-react';

interface UnarchiveCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  company: CompanyWithSupervisors;
  onSuccess: () => void;
}

export function UnarchiveCompanyDialog({
  open,
  onClose,
  company,
  onSuccess,
}: UnarchiveCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUnarchive = async () => {
    try {
      setLoading(true);
      await adminCompaniesAPI.unarchiveCompany(company.id);
      toast({
        title: 'Success',
        description: 'Company unarchived successfully. Company is now active again.',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unarchive company',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ArchiveRestore className="h-5 w-5 text-green-600" />
            Unarchive Company
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to unarchive <strong>{company.name}</strong>?
              </p>

              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Restore Company:</strong> This company will be restored and become active again. 
                  All historical data will remain intact.
                </p>
              </div>

              <p className="text-sm pt-2">
                The company will be available for new internship assignments after unarchiving.
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
            Unarchive Company
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
