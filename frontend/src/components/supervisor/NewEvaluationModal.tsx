/**
 * New Evaluation Modal Component
 * 
 * Allows supervisor to create a new evaluation by selecting an internship
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createSupabaseClient } from '@/lib/supabase';
import { createEvaluation } from '@/lib/api/supervisor-evaluations';
import { EvaluationType } from '@/types/api';

interface Internship {
  id: string;
  position: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
  };
  company: {
    id: string;
    name: string;
  };
}

interface NewEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evaluationId: string) => void;
}

export function NewEvaluationModal({ isOpen, onClose, onSuccess }: NewEvaluationModalProps) {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');
  const [evaluationType, setEvaluationType] = useState<EvaluationType>('final');
  const [weekNumber, setWeekNumber] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInternships, setIsFetchingInternships] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch supervisor's internships
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const fetchInternships = async () => {
      setIsFetchingInternships(true);
      setError(null);

      try {
        // Fetch internships from backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/internships/my-internships`, {
          headers: {
            'Authorization': `Bearer ${(await createSupabaseClient().auth.getSession()).data.session?.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch internships (${response.status})`);
        }

        setInternships(data.data || []);
      } catch (err) {
        console.error('Error fetching internships:', err);
        setError(err instanceof Error ? err.message : 'Failed to load internships');
      } finally {
        setIsFetchingInternships(false);
      }
    };

    fetchInternships();
  }, [isOpen, currentUserId]);

  const handleCreate = async () => {
    if (!selectedInternshipId || !currentUserId) {
      setError('Please select an internship');
      return;
    }

    // Validate week number for weekly evaluations
    if (evaluationType === 'weekly') {
      const week = parseInt(weekNumber);
      if (!weekNumber || isNaN(week) || week < 1 || week > 20) {
        setError('Please enter a valid week number (1-20) for weekly evaluation');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const evaluationData: any = {
        internship_id: selectedInternshipId,
        supervisor_id: currentUserId,
        evaluation_type: evaluationType,
        feedback_text: '',
        rating_overall: null,
        rating_technical: null,
        rating_communication: null,
        rating_work_ethic: null,
      };

      // Add week_number only for weekly evaluations
      if (evaluationType === 'weekly' && weekNumber) {
        evaluationData.week_number = parseInt(weekNumber);
      }

      // Add due_date if provided
      if (dueDate) {
        evaluationData.due_date = dueDate;
      }

      const newEvaluation = await createEvaluation(evaluationData);

      onSuccess(newEvaluation.id);
      handleClose();
    } catch (err) {
      console.error('Error creating evaluation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedInternshipId('');
      setEvaluationType('final');
      setWeekNumber('');
      setDueDate('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Create New Evaluation</span>
          </DialogTitle>
          <DialogDescription>
            Select an internship to create a new evaluation draft
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Internship Selection */}
          <div className="space-y-2">
            <Label htmlFor="internship">Select Internship</Label>
            {isFetchingInternships ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : internships.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active internships found. You need an active internship to create an evaluation.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedInternshipId} onValueChange={setSelectedInternshipId}>
                <SelectTrigger id="internship">
                  <SelectValue placeholder="Choose an internship..." />
                </SelectTrigger>
                <SelectContent>
                  {internships.map((internship) => (
                    <SelectItem key={internship.id} value={internship.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {internship.student.first_name} {internship.student.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {internship.position} • {internship.company.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Evaluation Type Selection */}
          <div className="space-y-3">
            <Label>Evaluation Type</Label>
            <RadioGroup value={evaluationType} onValueChange={(value) => {
              setEvaluationType(value as EvaluationType);
              if (value !== 'weekly') setWeekNumber(''); // Clear week number when switching away from weekly
            }}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">Weekly Evaluation</span>
                    <span className="text-xs text-muted-foreground">Regular progress check-in</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="midterm" id="midterm" />
                <Label htmlFor="midterm" className="flex-1 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">Midterm Evaluation</span>
                    <span className="text-xs text-muted-foreground">Comprehensive mid-internship review</span>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="final" id="final" />
                <Label htmlFor="final" className="flex-1 cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">Final Evaluation</span>
                    <span className="text-xs text-muted-foreground">Complete internship assessment</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Week Number Input (only for weekly) */}
          {evaluationType === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="weekNumber">Week Number *</Label>
              <Input
                id="weekNumber"
                type="number"
                min="1"
                max="20"
                placeholder="Enter week number (1-20)"
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Required for weekly evaluations
              </p>
            </div>
          )}

          {/* Due Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Set a deadline for completing this evaluation
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Message */}
          <Alert>
            <AlertDescription className="text-sm">
              This will create a <strong>draft evaluation</strong> that you can complete and submit later.
              {evaluationType === 'midterm' || evaluationType === 'final' 
                ? ' This is a mandatory evaluation.' 
                : ''}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isLoading || !selectedInternshipId || isFetchingInternships}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Create Draft
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
