/**
 * Archive Evaluation Modal
 * 
 * Dialog for archiving an evaluation (soft delete)
 * Preserves data for AI features and historical tracking
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EvaluationWithRelations } from '@/types/api';
import { Loader2, Archive } from 'lucide-react';

interface ArchiveEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (evaluationId: string) => Promise<void>;
}

export function ArchiveEvaluationModal({
  evaluation,
  open,
  onClose,
  onConfirm,
}: ArchiveEvaluationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation) return;

    console.log('🔵 Admin archiving evaluation:', {
      evaluationId: evaluation.id,
      studentName: evaluation.internship?.student?.name,
      status: evaluation.status,
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    try {
      await onConfirm(evaluation.id);
      console.log('✅ Evaluation archived successfully:', evaluation.id);
      onClose();
    } catch (error) {
      console.error('❌ Error archiving evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-600" />
            Archive Evaluation
          </DialogTitle>
          <DialogDescription>
            Archive evaluation from {evaluation.internship?.student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Archive this evaluation?
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                The evaluation will be archived and removed from the active list, but data will be preserved for historical tracking and AI analysis features.
              </p>
            </div>

            {/* Evaluation Details */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{evaluation.internship?.student?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium">{evaluation.internship?.company?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{evaluation.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{evaluation.evaluation_period || 'Final'}</span>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                ℹ️ Archived evaluations can be restored by administrators if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Re-export as RejectEvaluationModal for backward compatibility
 * Components using the old name will still work
 */
export { ArchiveEvaluationModal as RejectEvaluationModal };

