/**
 * Override Grade Modal
 * 
 * Dialog for manually overriding AI-suggested grade with reason
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EvaluationWithRelations } from '@/types/api';
import { Loader2 } from 'lucide-react';

interface OverrideGradeModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (evaluationId: string, overrideGrade: number, reason: string) => Promise<void>;
}

export function OverrideGradeModal({
  evaluation,
  open,
  onClose,
  onConfirm,
}: OverrideGradeModalProps) {
  const [overrideGrade, setOverrideGrade] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (evaluation?.recommended_grade) {
      setOverrideGrade(evaluation.recommended_grade.toFixed(1));
    }
  }, [evaluation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation || !reason.trim()) {
      alert('Please provide a reason for the override');
      return;
    }

    const grade = parseFloat(overrideGrade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      alert('Please enter a valid grade between 0 and 100');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(evaluation.id, grade, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error overriding grade:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  const aiGrade = evaluation.recommended_grade || 0;
  const gradeDifference = overrideGrade ? Math.abs(parseFloat(overrideGrade) - aiGrade).toFixed(1) : '0';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Override AI Grade</DialogTitle>
          <DialogDescription>
            Manually set the final grade for {evaluation.internship?.student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideGrade">Override Grade (%)</Label>
              <Input
                id="overrideGrade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={overrideGrade}
                onChange={(e) => setOverrideGrade(e.target.value)}
                placeholder="Enter override grade"
                required
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  AI Suggested: {aiGrade.toFixed(1)}%
                </span>
                {gradeDifference !== '0' && (
                  <span className={parseFloat(gradeDifference) > 10 ? 'text-warning' : 'text-muted-foreground'}>
                    Difference: {gradeDifference}%
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Override</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're overriding the AI suggestion..."
                rows={3}
                required
              />
            </div>

            {parseFloat(gradeDifference) > 10 && (
              <div className="bg-warning/10 p-4 rounded-lg">
                <p className="text-sm font-medium text-warning">Large Deviation Warning</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The override grade differs by more than 10% from the AI suggestion. Please ensure this is intentional.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Overriding...
                </>
              ) : (
                'Override'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
