/**
 * Approve Evaluation Modal
 * 
 * Dialog for approving an evaluation with final grade confirmation
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EvaluationWithRelations } from '@/types/api';
import { Loader2 } from 'lucide-react';

interface ApproveEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (evaluationId: string, finalGrade: number) => Promise<void>;
}

export function ApproveEvaluationModal({
  evaluation,
  open,
  onClose,
  onConfirm,
}: ApproveEvaluationModalProps) {
  const [finalGrade, setFinalGrade] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (evaluation?.recommended_grade) {
      setFinalGrade(evaluation.recommended_grade.toFixed(1));
    }
  }, [evaluation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation) return;

    const grade = parseFloat(finalGrade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(evaluation.id, grade);
      onClose();
    } catch (error) {
      console.error('Error approving evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Evaluation</DialogTitle>
          <DialogDescription>
            Confirm the final grade for {evaluation.internship?.student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="finalGrade">Final Grade (%)</Label>
              <Input
                id="finalGrade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={finalGrade}
                onChange={(e) => setFinalGrade(e.target.value)}
                placeholder="Enter final grade"
                required
              />
              {evaluation.recommended_grade && (
                <p className="text-sm text-muted-foreground">
                  AI Suggested: {evaluation.recommended_grade.toFixed(1)}%
                </p>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Evaluation Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Technical: </span>
                  <span>{evaluation.rating_technical || 'N/A'}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Work Ethic: </span>
                  <span>{evaluation.rating_work_ethic || 'N/A'}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Communication: </span>
                  <span>{evaluation.rating_communication || 'N/A'}/5</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Overall: </span>
                  <span>{evaluation.rating_overall || 'N/A'}/5</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
