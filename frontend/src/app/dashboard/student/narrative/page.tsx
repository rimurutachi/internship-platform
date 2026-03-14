'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Loader2, 
  Wand2,
  Download,
  Copy,
  RefreshCcw,
  CheckCircle,
  Lightbulb,
  BookOpen,
  Award
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';
import { studentAPI } from '@/lib/api/student';

interface DailyReport {
  id: string;
  report_date: string;
  activities: string;
  hours_worked: number;
  learnings?: string;
  created_at: string;
}

interface Internship {
  id: string;
  position: string;
  company_name: string;
  department?: string;
  start_date: string;
  end_date: string;
  status: string;
  total_hours?: number;
}

interface NarrativeResult {
  narrative_draft: string;
  sections: Record<string, string>;
  word_count: number;
  key_themes: string[];
  skills_mentioned: string[];
  suggestions: string[];
  generated_at: string;
}

export default function NarrativePage() {
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [narrative, setNarrative] = useState<NarrativeResult | null>(null);
  const [editedNarrative, setEditedNarrative] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return;
      }
      
      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setUser(userData);
      
      // Fetch internship
      const { data: internshipData } = await supabase
        .from('internships')
        .select(`
          *,
          companies:company_id (name)
        `)
        .eq('student_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (internshipData) {
        setInternship({
          ...internshipData,
          company_name: internshipData.companies?.name || 'Unknown Company'
        });
        
        // Fetch daily reports for this internship
        const { data: reports } = await supabase
          .from('student_daily_reports')
          .select('*')
          .eq('internship_id', internshipData.id)
          .order('report_date', { ascending: true });
        
        setDailyReports(reports || []);
      }
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate narrative using AI
  const handleGenerateNarrative = useCallback(async () => {
    if (!user || !internship || dailyReports.length === 0) {
      toast({
        title: 'Cannot Generate',
        description: 'Need user info, internship data, and at least one daily report',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setGenerating(true);
      
      const studentName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
      
      const response = await studentAPI.generateNarrative({
        student_name: studentName,
        company_name: internship.company_name,
        position: internship.position,
        department: internship.department,
        start_date: internship.start_date,
        end_date: internship.end_date,
        total_hours: internship.total_hours,
        daily_reports: dailyReports.map(r => ({
          report_date: r.report_date,
          activities: r.activities,
          hours_worked: r.hours_worked,
          learnings: r.learnings
        }))
      });
      
      if (response.success && response.data) {
        setNarrative(response.data);
        setEditedNarrative(response.data.narrative_draft);
        toast({
          title: 'Narrative Generated',
          description: `Created ${response.data.word_count} words from ${dailyReports.length} daily reports`
        });
      } else {
        throw new Error(response.error || 'Failed to generate narrative');
      }
      
    } catch (error: any) {
      console.error('Error generating narrative:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate narrative',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  }, [user, internship, dailyReports, toast]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedNarrative || narrative?.narrative_draft || '');
      toast({ title: 'Copied', description: 'Narrative copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy', variant: 'destructive' });
    }
  };

  // Download as text file
  const handleDownload = () => {
    const content = editedNarrative || narrative?.narrative_draft || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OJT_Narrative_${user?.last_name || 'Student'}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Narrative saved as text file' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isInternshipComplete = internship?.status === 'completed';
  const canGenerate = internship && isInternshipComplete && dailyReports.length > 0;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-16 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader title="AI Narrative" />
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <StudentHeader />
        </div>

        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-primary" />
                AI Narrative Generator
              </CardTitle>
              <CardDescription>
                Generate a professional narrative report from your weekly accomplishments using AI.
                This creates a draft that you can edit and customize.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Status Alert */}
          {!isInternshipComplete && internship && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>
                  <strong>Requirement:</strong> You must complete your internship and submit all daily reports before you can generate your narrative report.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">{dailyReports.length}</div>
                <div className="text-sm text-muted-foreground">Daily Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-secondary">
                  {dailyReports.reduce((sum, r) => sum + (r.hours_worked || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-success">
                  {narrative?.word_count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Words Generated</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-info">
                  {narrative?.skills_mentioned?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Skills Identified</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Generate */}
            <div className="lg:col-span-2 space-y-4">
              {/* Generate Button */}
              {!narrative && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    {!isInternshipComplete ? (
                      <div className="py-8">
                        <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Internship Incomplete</h3>
                        <p className="text-muted-foreground">
                          Please complete your internship first before generating your narrative report.
                        </p>
                      </div>
                    ) : !canGenerate ? (
                      <div className="py-8">
                        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Daily Reports Yet</h3>
                        <p className="text-muted-foreground">
                          Submit your daily reports first, then come back to generate your narrative.
                        </p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <Wand2 className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                        <p className="text-muted-foreground mb-6">
                          Click below to generate your OJT narrative from {dailyReports.length} daily reports
                        </p>
                        <Button 
                          size="lg" 
                          onClick={handleGenerateNarrative}
                          disabled={generating}
                        >
                          {generating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-5 h-5 mr-2" />
                              Generate Narrative
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Narrative Result */}
              {narrative && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Generated Narrative</CardTitle>
                      <CardDescription>
                        Generated on {new Date(narrative.generated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerateNarrative} disabled={generating}>
                        <RefreshCcw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                        Regenerate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="sections">By Section</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="preview">
                        <div className="prose dark:prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                            {editedNarrative || narrative.narrative_draft}
                          </pre>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="edit">
                        <Textarea
                          value={editedNarrative}
                          onChange={(e) => setEditedNarrative(e.target.value)}
                          className="min-h-[500px] font-mono text-sm"
                          placeholder="Edit your narrative here..."
                        />
                        <div className="mt-2 text-sm text-muted-foreground text-right">
                          {editedNarrative.split(/\s+/).filter(Boolean).length} words
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sections" className="space-y-4">
                        {Object.entries(narrative.sections).map(([key, content]) => (
                          <Card key={key}>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm uppercase text-muted-foreground">
                                {key.replace(/_/g, ' ')}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm whitespace-pre-wrap">{content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Info & Suggestions */}
            <div className="space-y-4">
              {/* Internship Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Internship Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <span className="ml-2 font-medium">{internship?.company_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position:</span>
                    <span className="ml-2 font-medium">{internship?.position || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">
                      {internship?.start_date && internship?.end_date
                        ? `${new Date(internship.start_date).toLocaleDateString()} - ${new Date(internship.end_date).toLocaleDateString()}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={internship?.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                      {internship?.status || 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Identified */}
              {narrative && narrative.skills_mentioned.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="w-4 h-4 text-secondary" />
                      Skills Identified
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {narrative.skills_mentioned.map((skill, i) => (
                        <Badge key={i} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Themes */}
              {narrative && narrative.key_themes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Key Themes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {narrative.key_themes.map((theme, i) => (
                        <Badge key={i} variant="secondary" className="capitalize">{theme}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {narrative && narrative.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {narrative.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <BottomNavigation type="student" />
    </div>
  );
}
