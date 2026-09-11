'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  BookOpen,
  Info,
} from 'lucide-react';
import studentAPI from '@/lib/api/student';

interface NarrativeReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: {
    studentName: string;
    degreeProgram: string;
    department: string;
    institution: string;
    campus: string;
    campusAddress: string;
    companyName: string;
    companyAddress?: string;
    adviserName?: string;
    supervisorName?: string;
    startDate?: string;
    endDate?: string;
    reportMonthYear: string;
  };
}

export const NarrativeReportModal = ({
  open,
  onOpenChange,
  metadata,
}: NarrativeReportModalProps) => {
  const [formData, setFormData] = useState({ ...metadata });
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setErrorMessage(null);
      setDownloadSuccess(false);

      const result = await studentAPI.downloadNarrativeReport(formData);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to download narrative report.');
      } else {
        setDownloadSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(title);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const writingGuides = [
    {
      title: 'Biographical Data (Page ii)',
      desc: 'Written in third-person narrative format.',
      tips: 'Cover your full legal name, date and place of birth, parents/family details, address, and educational milestones (Elementary, Junior High School, Senior High School with strand, and Cavite State University degree).',
      prompt: 'I, [Full Name], born on [Date] in [Place of Birth]. [Family and residence details]. Finished elementary education at [School] in [Year], junior high school at [School] in [Year], and senior high school at [School] in [Year] under [Strand]. In [Year], enrolled in [Degree] at Cavite State University – [Campus].',
    },
    {
      title: 'The Linkage Establishment (Page 4-8)',
      desc: 'Official company profile and organizational setup.',
      tips: 'Include official company name, branch location, founding story/founder, vision and mission statements, primary business operations/divisions, and overall organizational chart.',
      prompt: 'Include:\n1. Location Map (Figure 1)\n2. Establishment Profile & History\n3. Company Vision & Mission statements\n4. Company Goals & Objectives\n5. Organizational Chart (Figure 3)',
    },
    {
      title: 'The Training Area (Page 9-13)',
      desc: 'Department details, facilities, and workstation specs.',
      tips: 'Detail the department function, supervisory hierarchy, workplace facilities, workstation hardware specs (CPU, RAM, storage, monitor, peripherals, OS), and Standard Operating Procedures (office hours, lunch breaks, ticketing, policies).',
      prompt: 'Describe:\n- Department function and supervisor reporting lines\n- Workstation hardware: CPU model, RAM, storage, peripherals, OS version\n- SOPs: Working schedule, ticketing system, and company guidelines',
    },
    {
      title: 'The Training Experience (Page 14-16)',
      desc: 'Tasks performed, strengths, problems, and insights.',
      tips: 'Detail your actual hands-on tasks, PC standardization, network troubleshooting, or software development. Highlight observed team strengths and explain specific challenges you faced and how you solved them.',
      prompt: 'Key sections to write:\n• Tasks Performed: Itemized breakdown of primary responsibilities\n• Observed Strengths: Collaboration, technology, and mentorship in the team\n• Insights: Personal and professional development\n• Problems Encountered & Resolutions: Challenges faced and solutions applied',
    },
    {
      title: 'Summary (Page 17)',
      desc: 'Synthesis of academic learning and workplace experience.',
      tips: 'Synthesize how the internship bridged academic theory with actual industry practice, your key takeaways, and how it prepared you for your professional career.',
      prompt: 'Summarize your total rendered hours, key achievements, professional competencies acquired, and future career readiness.',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                CvSU Standard OJT Narrative Report Assistant
              </DialogTitle>
              <DialogDescription>
                Generates a fully editable Microsoft Word (.docx) scaffold formatted to CvSU standards.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="generate" className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Setup & Download
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Ethical Writing Guide
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERATE & DOWNLOAD */}
          <TabsContent value="generate" className="space-y-4 pt-3">
            {/* Formatting Compliance Badges */}
            <div className="p-3.5 rounded-lg border bg-muted/40 text-xs space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary" />
                CvSU Formatting Standards Built-in:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
                <Badge variant="outline" className="justify-center bg-background py-1">
                  A4 Paper Size
                </Badge>
                <Badge variant="outline" className="justify-center bg-background py-1">
                  1.5&quot; Left / 1.0&quot; Others
                </Badge>
                <Badge variant="outline" className="justify-center bg-background py-1">
                  Arial 11pt, Double Spaced
                </Badge>
                <Badge variant="outline" className="justify-center bg-background py-1">
                  Roman &amp; Arabic Headers
                </Badge>
              </div>
            </div>

            {/* Editable Fields Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="studentName" className="text-xs font-medium">Student Full Name</Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => handleInputChange('studentName', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="degreeProgram" className="text-xs font-medium">Degree / Program</Label>
                <Input
                  id="degreeProgram"
                  value={formData.degreeProgram}
                  onChange={(e) => handleInputChange('degreeProgram', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-medium">Company / Host Establishment</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyAddress" className="text-xs font-medium">Company Address</Label>
                <Input
                  id="companyAddress"
                  value={formData.companyAddress || ''}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  placeholder="e.g., 5th Floor Tower 2, PITX..."
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adviserName" className="text-xs font-medium">OJT Practicum Adviser</Label>
                <Input
                  id="adviserName"
                  value={formData.adviserName || ''}
                  onChange={(e) => handleInputChange('adviserName', e.target.value)}
                  placeholder="e.g., Mr. Stephen G. Bacolor"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supervisorName" className="text-xs font-medium">Immediate Company Supervisor</Label>
                <Input
                  id="supervisorName"
                  value={formData.supervisorName || ''}
                  onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                  placeholder="e.g., Mr. Joshua Hanz Salmorin"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-medium">Training Start Date</Label>
                <Input
                  id="startDate"
                  value={formData.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  placeholder="e.g., July 29, 2025"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-medium">Training End Date</Label>
                <Input
                  id="endDate"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  placeholder="e.g., September 15, 2025"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="reportMonthYear" className="text-xs font-medium">Report Submission (Month &amp; Year)</Label>
                <Input
                  id="reportMonthYear"
                  value={formData.reportMonthYear}
                  onChange={(e) => handleInputChange('reportMonthYear', e.target.value)}
                  placeholder="e.g., September 2025"
                  className="h-9"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {downloadSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Document successfully downloaded! Open in Microsoft Word to review your scaffold.</span>
              </div>
            )}

            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building Standard .docx Document...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Standard CvSU Narrative Report (.docx)
                </>
              )}
            </Button>
          </TabsContent>

          {/* TAB 2: ETHICAL WRITING GUIDE */}
          <TabsContent value="guide" className="space-y-3.5 pt-3">
            <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              <strong>Ethical AI Policy:</strong> This guide provides standard outline structures and prompts so you can write your genuine experiences. Do not use AI to generate fabricated reflections.
            </div>

            <div className="space-y-3">
              {writingGuides.map((guide, idx) => (
                <div key={idx} className="p-3.5 rounded-lg border bg-card text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{guide.title}</h4>
                      <p className="text-muted-foreground">{guide.desc}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(guide.prompt, guide.title)}
                      className="h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedSection === guide.title ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Outline
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded">
                    {guide.tips}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
