/**
 * Reject Evaluation Modal
 * 
 * Dialog for rejecting an evaluation with reason
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EvaluationWithRelations } from '@/types/api';
import { Loader2 } from 'lucide-react';

interface RejectEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (evaluationId: string, reason: string) => Promise<void>;
}

export function RejectEvaluationModal({
  evaluation,
  open,
  onClose,
  onConfirm,
}: RejectEvaluationModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation || !reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(evaluation.id, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error rejecting evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Evaluation</DialogTitle>
          <DialogDescription>
            Provide a reason for rejecting the evaluation from {evaluation.internship?.student?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this evaluation is being rejected..."
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                The supervisor will be notified and can resubmit the evaluation.
              </p>
            </div>

            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm font-medium text-destructive">Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                This action will notify the supervisor and require them to revise and resubmit the evaluation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
