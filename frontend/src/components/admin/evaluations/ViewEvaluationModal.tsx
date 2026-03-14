/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * View Evaluation Modal
 * 
 * Dialog for viewing evaluation details with rubric-based criteria scores
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EvaluationWithRelations } from '@/types/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ViewEvaluationModalProps {
  evaluation: EvaluationWithRelations | null;
  open: boolean;
  onClose: () => void;
}

export function ViewEvaluationModal({ evaluation, open, onClose }: ViewEvaluationModalProps) {
  if (!evaluation) return null;

  const criterionScores = evaluation.criterion_scores as any[] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluation Details</DialogTitle>
          <DialogDescription>
            {evaluation.internship?.student?.name} - {evaluation.internship?.company?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{evaluation.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="text-sm">{new Date(evaluation.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                    <p className="text-sm font-medium">{evaluation.total_score || 'N/A'}/70</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Final Grade</p>
                    <p className="text-sm font-medium">{evaluation.final_grade ? evaluation.final_grade.toFixed(2) : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance & Punctuality */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance & Punctuality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                    <Badge variant="outline" className="capitalize">
                      {evaluation.attendance || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Punctuality</p>
                    <Badge variant="outline" className="capitalize">
                      {evaluation.punctuality || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rubric Criteria Scores */}
            {criterionScores && criterionScores.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Criteria (CvSU A-G)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {criterionScores.map((score: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{score.criterion_code}. {score.criterion_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{score.score}/10</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Supervisor Comments */}
            {evaluation.supervisor_comments && (
              <Card>
                <CardHeader>
                  <CardTitle>Supervisor Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{evaluation.supervisor_comments}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(evaluation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {evaluation.updated_at !== evaluation.created_at && (
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(evaluation.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
