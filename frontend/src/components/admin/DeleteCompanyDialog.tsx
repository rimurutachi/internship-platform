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
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  company: CompanyWithSupervisors;
  onSuccess: () => void;
}

export function DeleteCompanyDialog({
  open,
  onClose,
  company,
  onSuccess,
}: DeleteCompanyDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await adminCompaniesAPI.deleteCompany(company.id);
      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete company',
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
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Company
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete <strong>{company.name}</strong>?
            </p>
            
            {hasActiveInternships && (
              <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Warning:</strong> This company has {company.current_students || company.active_internships} active student(s). 
                  Deleting this company may affect their internship records.
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

            <p className="text-sm pt-2">
              This action cannot be undone. This will permanently delete the company record and 
              may affect related internship and supervisor data.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Company
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
