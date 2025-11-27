'use client';

import { useState } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import type { InternshipWithRelations } from '@/lib/api/admin-internships';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteInternshipDialogProps {
  open: boolean;
  onClose: () => void;
  internship: InternshipWithRelations;
  onSuccess: () => void;
}

export function DeleteInternshipDialog({
  open,
  onClose,
  internship,
  onSuccess,
}: DeleteInternshipDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await adminInternshipsAPI.deleteInternship(internship.id);
      toast({
        title: 'Success',
        description: 'Internship cancelled successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel internship',
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
          <AlertDialogTitle>Cancel Internship</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this internship assignment? This will set the
            status to "cancelled" and can be reverted later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-muted rounded-lg space-y-2">
          <div>
            <span className="text-sm font-medium">Student:</span>{' '}
            <span className="text-sm">{internship.student?.name || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium">Position:</span>{' '}
            <span className="text-sm">{internship.position || 'N/A'}</span>
          </div>
          <div>
            <span className="text-sm font-medium">Company:</span>{' '}
            <span className="text-sm">{internship.company?.name || 'N/A'}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Internship
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Internship
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
