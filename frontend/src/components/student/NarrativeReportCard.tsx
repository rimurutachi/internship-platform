'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Lock, Sparkles, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import studentAPI from '@/lib/api/student';
import { NarrativeReportModal } from './NarrativeReportModal';

interface NarrativeReportCardProps {
  internshipId?: string;
}

export const NarrativeReportCard = ({ internshipId }: NarrativeReportCardProps) => {
  const [loading, setLoading] = useState(true);
  const [eligibilityData, setEligibilityData] = useState<{
    isEligible: boolean;
    progressPercentage: number;
    totalHoursWorked: number;
    requiredHours: number;
    requiredThresholdHours: number;
    remainingHoursToUnlock: number;
    metadata?: any;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, [internshipId]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getNarrativeReportEligibility();
      if (res.success && res.data) {
        setEligibilityData(res.data);
      }
    } catch (e) {
      console.warn('⚠️ Failed to load narrative report eligibility:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            AI Narrative Report Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Checking narrative report eligibility...
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEligible = eligibilityData?.isEligible ?? false;
  const progress = eligibilityData?.progressPercentage ?? 0;
  const totalWorked = eligibilityData?.totalHoursWorked ?? 0;
  const required = eligibilityData?.requiredHours ?? 240;
  const thresholdHours = eligibilityData?.requiredThresholdHours ?? Math.ceil(required * 0.8);
  const remainingHours = eligibilityData?.remainingHoursToUnlock ?? Math.max(0, thresholdHours - totalWorked);

  const defaultMetadata = eligibilityData?.metadata || {
    studentName: 'Student Intern',
    degreeProgram: 'Bachelor of Science in Computer Science',
    department: 'Department of Computer Studies',
    institution: 'Cavite State University',
    campus: 'Bacoor City Campus',
    campusAddress: 'Bacoor, Cavite',
    companyName: 'Partner Establishment',
    reportMonthYear: 'September 2025',
  };

  return (
    <>
      <Card className={`border shadow-sm transition-all duration-200 ${
        isEligible
          ? 'bg-gradient-to-br from-card via-card to-primary/5 border-primary/30 shadow-primary/5'
          : 'bg-card border-border'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${
                isEligible ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isEligible ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              AI Narrative Report Assistant
            </CardTitle>
            {isEligible ? (
              <Badge className="bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30 text-xs font-semibold">
                ✨ Unlocked ({progress}%)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground border-slate-300 dark:border-slate-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked (80% req.)
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isEligible ? (
            // UNLOCKED STATE (>= 80%)
            <div className="space-y-3.5">
              <p className="text-sm text-foreground/90 leading-relaxed">
                Congratulations! You have completed <strong>{progress}%</strong> ({totalWorked}/{required} hrs) of your required internship. Your official CvSU-formatted narrative report scaffold is ready to generate.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-sm py-5"
                >
                  <FileText className="w-4 h-4" />
                  Generate Narrative Report (.docx)
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-5"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  Writing Guide
                </Button>
              </div>
            </div>
          ) : (
            // LOCKED STATE (< 80%)
            <div className="space-y-3.5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Render at least <strong>80%</strong> ({thresholdHours} of {required} hours) to unlock the standard CvSU narrative report generator.
              </p>

              {/* Progress towards 80% */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">Progress towards Narrative Unlock</span>
                  <span className="text-muted-foreground">
                    {totalWorked} / {thresholdHours} hrs ({progress}% / 80%)
                  </span>
                </div>
                <Progress value={Math.min((totalWorked / thresholdHours) * 100, 100)} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {remainingHours > 0
                    ? `Keep logging your hours! ${remainingHours} more hours needed to unlock.`
                    : 'Almost there! Continue logging your attendance.'}
                </p>
              </div>

              <Button disabled variant="outline" className="w-full flex items-center justify-center gap-2 py-5 text-muted-foreground">
                <Lock className="w-4 h-4" />
                Locked until 80% Rendered Hours
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Narrative Report Generator & Writing Guide Modal */}
      <NarrativeReportModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        metadata={defaultMetadata}
      />
    </>
  );
};
