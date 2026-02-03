/**
 * Approve Evaluation Modal
 * 
 * Dialog for confirming evaluation approval
 * Shows score summary and requires admin confirmation
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
import { Loader2, CheckCircle2 } from 'lucide-react';
import { convertScoreToGrade } from './gradeUtils';

interface ApproveEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (evaluationId: string) => Promise<void>;
}

export function ApproveEvaluationModal({
  evaluation,
  open,
  onClose,
  onConfirm,
}: ApproveEvaluationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation) return;

    console.log('🔵 Admin approving evaluation:', {
      evaluationId: evaluation.id,
      studentName: evaluation.internship?.student?.name,
      totalScore: evaluation.total_score,
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    try {
      await onConfirm(evaluation.id);
      console.log('✅ Evaluation approved successfully:', evaluation.id);
      onClose();
    } catch (error) {
      console.error('❌ Error approving evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  const calculatedGrade = evaluation.total_score 
    ? convertScoreToGrade(evaluation.total_score) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Approve Evaluation
          </DialogTitle>
          <DialogDescription>
            Confirm approval for {evaluation.internship?.student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Confirmation Message */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                Are you sure you want to approve this evaluation?
              </p>
              <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                This will set the final grade based on the supervisor's score.
              </p>
            </div>

            {/* Score Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-semibold">Score Summary</p>
              
              {/* Total Score and Grade */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Score:</span>
                  <span className="font-bold">{evaluation.total_score || 0}/70</span>
                </div>
                {calculatedGrade && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Equivalent Grade (CvSU):</span>
                    <span className="font-bold text-lg">{calculatedGrade.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Supervisor Info */}
            {evaluation.internship?.supervisor && (
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p>Submitted by: <span className="font-medium">{evaluation.internship.supervisor.name}</span></p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

