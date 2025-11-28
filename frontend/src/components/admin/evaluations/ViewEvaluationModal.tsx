/**
 * View Evaluation Modal
 * 
 * Dialog for viewing evaluation details, AI analysis, and history
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

  const aiResults = evaluation.sentiment_scores as any;

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">Final Grade</p>
                    <p className="text-sm font-medium">
                      {evaluation.final_grade ? `${evaluation.final_grade.toFixed(1)}%` : 'Not graded'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AI Suggested</p>
                    <p className="text-sm">
                      {evaluation.recommended_grade ? `${evaluation.recommended_grade.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Technical Skills</p>
                    <p className="text-sm font-medium">{evaluation.rating_technical || 'N/A'}/5</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Work Ethic</p>
                    <p className="text-sm font-medium">{evaluation.rating_work_ethic || 'N/A'}/5</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Communication</p>
                    <p className="text-sm font-medium">{evaluation.rating_communication || 'N/A'}/5</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall</p>
                    <p className="text-sm font-medium">{evaluation.rating_overall || 'N/A'}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {evaluation.feedback_text && (
              <Card>
                <CardHeader>
                  <CardTitle>Supervisor Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{evaluation.feedback_text}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-4">
            {aiResults ? (
              <>
                {aiResults.sentiment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Overall Sentiment</span>
                          <Badge>{aiResults.sentiment.overall}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence</span>
                          <span className="text-sm">{Math.round(aiResults.sentiment.confidence * 100)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {aiResults.bias_check && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bias Check</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Has Bias</span>
                          <Badge variant={aiResults.bias_check.has_bias ? 'destructive' : 'default'}>
                            {aiResults.bias_check.has_bias ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        {aiResults.bias_check.detected_biases?.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Detected Biases:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {aiResults.bias_check.detected_biases.map((bias: string, i: number) => (
                                <li key={i}>{bias}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {evaluation.confidence_score !== null && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${evaluation.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {Math.round(evaluation.confidence_score * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No AI analysis available
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
