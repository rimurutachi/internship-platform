/**
 * Bias Warning Modal Component
 * 
 * Displays bias warnings detected by AI and asks supervisor to review before submission
 */

'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BiasWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  biasFlags: string[];
  severity: 'low' | 'medium' | 'high';
  consistencyScore?: number;
}

/**
 * Get severity color based on level
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'medium':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'low':
    default:
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
  }
}

/**
 * Bias Warning Modal Component
 */
export function BiasWarningModal({
  isOpen,
  onClose,
  onConfirm,
  biasFlags,
  severity,
  consistencyScore,
}: BiasWarningModalProps) {
  const severityColor = getSeverityColor(severity);
  const severityIcon = getSeverityIcon(severity);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {severityIcon}
            <span>Potential Bias Detected</span>
          </DialogTitle>
          <DialogDescription>
            Our AI has detected potential bias indicators in your evaluation. Please review before submitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Severity Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Severity Level</span>
            <Badge className={severityColor}>
              {severity.toUpperCase()}
            </Badge>
          </div>

          {/* Consistency Score */}
          {consistencyScore !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Consistency Score</span>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(consistencyScore * 100)}%
              </span>
            </div>
          )}

          {/* Bias Flags */}
          {biasFlags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Detected Issues:</p>
              <div className="space-y-2">
                {biasFlags.map((flag, index) => (
                  <Alert key={index} className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{flag}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              <strong>Important:</strong> These are AI-detected suggestions only. You are the primary
              evaluator and can proceed with your professional judgment. However, we recommend reviewing
              your feedback for potential unconscious bias.
            </AlertDescription>
          </Alert>

          {/* Guidance */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-2">Recommended Actions:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Review your feedback for objective, measurable criteria</li>
              <li>Ensure consistency between ratings and written feedback</li>
              <li>Focus on specific behaviors and outcomes</li>
              <li>Avoid subjective or ambiguous language</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <X className="w-4 h-4 mr-2" />
            Review Evaluation
          </Button>
          <Button onClick={onConfirm} className="flex-1 sm:flex-none">
            <CheckCircle className="w-4 h-4 mr-2" />
            Submit Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
