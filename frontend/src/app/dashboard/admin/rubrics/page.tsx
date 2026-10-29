'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertCircle, 
  Save, 
  Power, 
  PowerOff,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';
import { adminRubricsAPI, type EvaluationRubric, type RubricCriterion, type GradingScale } from '@/lib/api/admin-rubrics';

const DEFAULT_CRITERIA: RubricCriterion[] = [
  {
    code: 'A',
    name: 'A. Quality of Work',
    description: 'Thoroughness, accuracy, and care in completing tasks',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Work is incomplete, inaccurate, or careless',
      '3-4': 'Work meets minimum standards but lacks attention to detail',
      '5-6': 'Work is adequate and meets basic expectations',
      '7-8': 'Work is thorough, accurate, and well-executed',
      '9-10': 'Work exceeds expectations with exceptional quality',
    },
  },
  {
    code: 'B',
    name: 'B. Attitude',
    description: 'Enthusiasm, interest, and positive approach to work',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Shows disinterest or negative attitude',
      '3-4': 'Attitude is occasionally negative or unmotivated',
      '5-6': 'Maintains professional attitude most of the time',
      '7-8': 'Consistently positive and enthusiastic',
      '9-10': 'Highly motivated with exceptional enthusiasm',
    },
  },
  {
    code: 'C',
    name: 'C. Judgment',
    description: 'Decision-making and problem-solving abilities',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Makes poor decisions without considering consequences',
      '3-4': 'Judgment is sometimes questionable',
      '5-6': 'Makes reasonable decisions in most situations',
      '7-8': 'Demonstrates sound judgment consistently',
      '9-10': 'Exceptional problem-solving and decision-making skills',
    },
  },
  {
    code: 'D',
    name: 'D. Cooperation',
    description: 'Teamwork and collaboration with others',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Difficult to work with, uncooperative',
      '3-4': 'Sometimes struggles with teamwork',
      '5-6': 'Works adequately with others',
      '7-8': 'Collaborates well with team members',
      '9-10': 'Outstanding team player, facilitates collaboration',
    },
  },
  {
    code: 'E',
    name: 'E. Dependability',
    description: 'Reliability and punctuality',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Unreliable, frequently absent or late',
      '3-4': 'Occasionally unreliable or late',
      '5-6': 'Generally reliable and punctual',
      '7-8': 'Consistently reliable and on time',
      '9-10': 'Exceptionally dependable in all situations',
    },
  },
  {
    code: 'F',
    name: 'F. Comprehension',
    description: 'Understanding and learning ability',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Struggles to understand instructions or concepts',
      '3-4': 'Requires repeated explanations',
      '5-6': 'Understands with minimal guidance',
      '7-8': 'Quickly grasps new concepts and instructions',
      '9-10': 'Outstanding learning ability and comprehension',
    },
  },
  {
    code: 'G',
    name: 'G. Safety',
    description: 'Safety awareness and adherence to protocols',
    max_score: 10,
    scale_descriptions: {
      '1-2': 'Disregards safety protocols',
      '3-4': 'Sometimes neglects safety procedures',
      '5-6': 'Follows basic safety guidelines',
      '7-8': 'Consistently adheres to safety protocols',
      '9-10': 'Exemplary safety awareness and practices',
    },
  },
];

const DEFAULT_GRADING_SCALE: GradingScale[] = [
  { min_score: 67, max_score: 70, grade: 1.0 },
  { min_score: 63, max_score: 66, grade: 1.25 },
  { min_score: 59, max_score: 62, grade: 1.5 },
  { min_score: 54, max_score: 58, grade: 1.75 },
  { min_score: 50, max_score: 53, grade: 2.0 },
  { min_score: 45, max_score: 49, grade: 2.25 },
  { min_score: 41, max_score: 44, grade: 2.5 },
  { min_score: 36, max_score: 40, grade: 2.75 },
  { min_score: 32, max_score: 35, grade: 3.0 },
  { min_score: 18, max_score: 31, grade: 4.0 },
  { min_score: 7, max_score: 17, grade: 5.0 },
];

export default function AdminRubricsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data state
  const [rubrics, setRubrics] = useState<EvaluationRubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<EvaluationRubric | null>(null);
  const [universityId, setUniversityId] = useState<string>('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  
  // Create Rubric Form state
  const [rubricName, setRubricName] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [isActiveOnCreate, setIsActiveOnCreate] = useState(true);
  const [criteria, setCriteria] = useState<RubricCriterion[]>(DEFAULT_CRITERIA);
  const [gradingScale, setGradingScale] = useState<GradingScale[]>(DEFAULT_GRADING_SCALE);
  const [deactivationReason, setDeactivationReason] = useState('');

  useEffect(() => {
    fetchUserAndRubrics();
  }, []);

  const fetchUserAndRubrics = async () => {
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's university_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('university_id')
        .eq('id', user.id)
        .single();

      let univId = userData?.university_id;
      if (!univId) {
        const { data: firstUniv } = await supabase
          .from('universities')
          .select('id')
          .limit(1)
          .single();
        univId = firstUniv?.id;
      }
      setUniversityId(univId);

      // Fetch rubrics from backend
      if (univId) {
        await fetchRubrics(univId);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRubrics = async (univId: string) => {
    try {
      console.log('[AdminRubrics] Fetching rubrics for university:', univId);
      const response = await adminRubricsAPI.getAllRubrics(univId, true);
      if (response.success) {
        setRubrics(response.data);
        console.log('[AdminRubrics] Fetched rubrics:', response.data.length);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Failed to fetch rubrics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load rubrics',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    const currentYear = new Date().getFullYear();
    const nextVersion = rubrics.length > 0 
      ? Math.max(...rubrics.map(r => r.version || 1)) + 1 
      : 1;

    setRubricName(`CvSU Final Evaluation Rubric version ${nextVersion}`);
    setRubricDescription(`Standard rubric for final internship evaluation (v${nextVersion})`);
    setAcademicYear(`${currentYear}-${currentYear + 1}`);
    setIsActiveOnCreate(true);
    setCriteria(JSON.parse(JSON.stringify(DEFAULT_CRITERIA)));
    setGradingScale(JSON.parse(JSON.stringify(DEFAULT_GRADING_SCALE)));
    setCreateDialogOpen(true);
  };

  const openViewDialog = (rubric: EvaluationRubric) => {
    setSelectedRubric(rubric);
    setViewDialogOpen(true);
  };

  const openDeactivateDialog = (rubric: EvaluationRubric) => {
    setSelectedRubric(rubric);
    setDeactivationReason('');
    setDeactivateDialogOpen(true);
  };

  const handleCreateRubric = async () => {
    if (!rubricName || rubricName.trim().length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Rubric name must be at least 5 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!rubricDescription || rubricDescription.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Description must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!criteria || criteria.length !== 7) {
      toast({
        title: 'Validation Error',
        description: 'Rubric must have exactly 7 criteria (A-G)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const currentYear = new Date().getFullYear();
      const yr = academicYear.trim() || `${currentYear}-${currentYear + 1}`;

      console.log('[AdminRubrics] Creating rubric:', { rubricName, universityId, academicYear: yr });

      const response = await adminRubricsAPI.createRubric({
        university_id: universityId,
        academic_year: yr,
        rubric_name: rubricName.trim(),
        description: rubricDescription.trim() || undefined,
        criteria,
        grading_scale: gradingScale,
        is_active: isActiveOnCreate,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Rubric version created successfully${isActiveOnCreate ? ' and set as active' : ''}`,
        });
        setCreateDialogOpen(false);
        await fetchRubrics(universityId);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Create error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create rubric',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateRubric = async (rubric: EvaluationRubric) => {
    if (rubric.is_active) {
      toast({
        title: 'Info',
        description: 'This rubric is already active',
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('[AdminRubrics] Activating rubric:', rubric.id);

      const response = await adminRubricsAPI.activateRubric(rubric.id);

      if (response.success) {
        toast({
          title: 'Success',
          description: `${rubric.rubric_name} activated successfully. Other rubrics have been deactivated.`,
        });
        if (viewDialogOpen) {
          setViewDialogOpen(false);
        }
        await fetchRubrics(universityId);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Activate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to activate rubric',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateRubric = async () => {
    if (!selectedRubric) return;

    try {
      setSubmitting(true);
      console.log('[AdminRubrics] Deactivating rubric:', selectedRubric.id);

      const response = await adminRubricsAPI.deactivateRubric(
        selectedRubric.id,
        deactivationReason || undefined
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Rubric deactivated successfully',
        });
        setDeactivateDialogOpen(false);
        await fetchRubrics(universityId);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Deactivate error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate rubric',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rubrics Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage evaluation criteria and grading scales. Rubrics list acts as the complete version history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchRubrics(universityId)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Create Rubric
          </Button>
        </div>
      </div>

      {/* Rubrics List (Acts as the Full Version History) */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Rubrics</CardTitle>
          <CardDescription>
            {rubrics.length} rubric version{rubrics.length !== 1 ? 's' : ''} recorded • {rubrics.filter(r => r.is_active).length} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rubrics.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No rubrics found</p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Rubric
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rubrics.map((rubric) => (
                <Card 
                  key={rubric.id} 
                  className={`hover:shadow-card transition-shadow ${
                    rubric.is_active ? 'border-green-500 border-2 bg-green-50/20 dark:bg-green-950/10' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-foreground">{rubric.rubric_name}</h3>
                          {rubric.is_active ? (
                            <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-500/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          <Badge variant="outline">v{rubric.version}</Badge>
                          <Badge variant="secondary">{rubric.academic_year}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{rubric.description}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Criteria:</span>
                            <span className="font-bold text-foreground ml-2">
                              {rubric.criteria?.length || 7}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Score:</span>
                            <span className="font-bold text-foreground ml-2">
                              {rubric.criteria?.reduce((sum, c) => sum + (c.max_score || 0), 0) || 70}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <span className="font-medium text-foreground ml-2">
                              {formatDate(rubric.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: View Details & Activate/Deactivate (No Edit or separate History button) */}
                      <div className="flex flex-wrap gap-2 sm:ml-4 mt-4 sm:mt-0 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(rubric)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        {rubric.is_active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeactivateDialog(rubric)}
                            disabled={submitting}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            <PowerOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleActivateRubric(rubric)}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Power className="w-4 h-4 mr-2" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgraded Create Rubric Dialog (Features 3 Tabs: Basic Info, Criteria A-G, and Grading Scale) */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create New Rubric
            </DialogTitle>
            <DialogDescription>
              Define the evaluation criteria and grading scale. When activated, this rubric becomes the official standard for all student evaluations.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">1. Basic Info</TabsTrigger>
              <TabsTrigger value="criteria">2. Criteria (A–G)</TabsTrigger>
              <TabsTrigger value="grading">3. Grading Scale</TabsTrigger>
            </TabsList>

            {/* Tab 1: Basic Info */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Rubric Name <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., CvSU Final Evaluation Rubric version 2"
                    value={rubricName}
                    onChange={(e) => setRubricName(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {rubricName.length} / 5 characters minimum
                  </p>
                </div>

                <div>
                  <Label>Academic Year <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="e.g., 2026-2027"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Applicable academic school year
                  </p>
                </div>
              </div>

              <div>
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Describe the purpose, revision notes, and usage of this rubric version..."
                  value={rubricDescription}
                  onChange={(e) => setRubricDescription(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {rubricDescription.length} / 10 characters minimum
                </p>
              </div>

              {/* Set Active Toggle Callout */}
              <div className="p-4 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="set_active"
                    checked={isActiveOnCreate}
                    onChange={(e) => setIsActiveOnCreate(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="set_active" className="font-semibold text-foreground cursor-pointer text-sm">
                    Set as Active Rubric immediately
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
                  When enabled, this rubric will immediately become the official evaluation standard for supervisors, and any currently active rubric will be automatically deactivated.
                </p>
              </div>
            </TabsContent>

            {/* Tab 2: Criteria Customization */}
            <TabsContent value="criteria" className="space-y-4 mt-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-xs sm:text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-primary" />
                  Pre-populated with official CvSU evaluation criteria (A–G). You can customize criterion names, descriptions, max score, and performance level descriptions.
                </p>
              </div>
              
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {criteria.map((criterion, index) => (
                  <Card key={criterion.code} className="p-4 border border-border">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold text-sm px-2.5 py-0.5">
                          {criterion.code}
                        </Badge>
                        <Input
                          value={criterion.name}
                          onChange={(e) => {
                            const newCriteria = [...criteria];
                            newCriteria[index] = { ...criterion, name: e.target.value };
                            setCriteria(newCriteria);
                          }}
                          placeholder="Criterion name"
                          className="flex-1 font-semibold"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Input
                          value={criterion.description}
                          onChange={(e) => {
                            const newCriteria = [...criteria];
                            newCriteria[index] = { ...criterion, description: e.target.value };
                            setCriteria(newCriteria);
                          }}
                          placeholder="Brief description"
                          className="mt-1"
                        />
                      </div>

                      <div className="w-36">
                        <Label className="text-xs text-muted-foreground">Max Score</Label>
                        <Input
                          type="number"
                          value={criterion.max_score}
                          onChange={(e) => {
                            const newCriteria = [...criteria];
                            newCriteria[index] = { ...criterion, max_score: parseInt(e.target.value) || 10 };
                            setCriteria(newCriteria);
                          }}
                          min={1}
                          max={100}
                          className="mt-1"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs font-semibold text-foreground">Performance Level Descriptions</Label>
                        <div className="grid gap-2">
                          {(['1-2', '3-4', '5-6', '7-8', '9-10'] as const).map((range) => (
                            <div key={range} className="flex items-center gap-2">
                              <Badge variant="secondary" className="w-14 justify-center text-xs flex-shrink-0">
                                {range}
                              </Badge>
                              <Input
                                value={criterion.scale_descriptions[range]}
                                onChange={(e) => {
                                  const newCriteria = [...criteria];
                                  newCriteria[index] = {
                                    ...criterion,
                                    scale_descriptions: {
                                      ...criterion.scale_descriptions,
                                      [range]: e.target.value
                                    }
                                  };
                                  setCriteria(newCriteria);
                                }}
                                placeholder={`Description for score ${range}`}
                                className="flex-1 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab 3: Grading Scale Customization */}
            <TabsContent value="grading" className="space-y-4 mt-4">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-xs sm:text-sm text-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-primary" />
                  Pre-populated with CvSU official grading scale (based on 70-point max). You can adjust score ranges if your department requires specific grade boundaries.
                </p>
              </div>

              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground px-2">
                  <span>Grade</span>
                  <span>Min Score</span>
                  <span>Max Score</span>
                  <span className="text-center">Score Range</span>
                </div>
                
                {gradingScale.map((scale, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center p-1.5 rounded-md hover:bg-muted/40">
                    <Input
                      type="number"
                      step="0.25"
                      value={scale.grade}
                      onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[index] = { ...scale, grade: parseFloat(e.target.value) || 1.0 };
                        setGradingScale(newScale);
                      }}
                      className="text-center font-bold"
                    />
                    <Input
                      type="number"
                      value={scale.min_score}
                      onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[index] = { ...scale, min_score: parseInt(e.target.value) || 0 };
                        setGradingScale(newScale);
                      }}
                      min={0}
                      max={100}
                      className="text-center"
                    />
                    <Input
                      type="number"
                      value={scale.max_score}
                      onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[index] = { ...scale, max_score: parseInt(e.target.value) || 100 };
                        setGradingScale(newScale);
                      }}
                      min={0}
                      max={100}
                      className="text-center"
                    />
                    <span className="text-xs text-muted-foreground text-center font-mono">
                      {scale.min_score === scale.max_score ? `${scale.min_score} pts` : `${scale.min_score} - ${scale.max_score} pts`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted rounded-md text-xs text-muted-foreground">
                <strong>CvSU Standard Scale Reference (70-point max):</strong> 1.0 (67-70), 1.25 (63-66), 1.5 (59-62), 1.75 (54-58), 2.0 (50-53), 2.25 (45-49), 2.5 (41-44), 2.75 (36-40), 3.0 (32-35), 4.0 (18-31), 5.0 (7-17)
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRubric}
              disabled={submitting || rubricName.trim().length < 5 || rubricDescription.trim().length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Create Rubric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rubric Details Dialog (Read-Only Inspection) */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRubric && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <DialogTitle className="text-2xl font-bold">{selectedRubric.rubric_name}</DialogTitle>
                  {selectedRubric.is_active ? (
                    <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                  <Badge variant="outline">v{selectedRubric.version}</Badge>
                </div>
                <DialogDescription>
                  Academic Year: {selectedRubric.academic_year} • Created: {formatDate(selectedRubric.created_at)}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full mt-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="criteria">Criteria ({selectedRubric.criteria?.length || 7})</TabsTrigger>
                  <TabsTrigger value="grading">Grading Scale</TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Info */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Rubric Name</Label>
                        <p className="font-semibold text-base mt-0.5">{selectedRubric.rubric_name}</p>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm mt-0.5 leading-relaxed">{selectedRubric.description || 'No description provided.'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">Academic Year</Label>
                          <p className="font-medium mt-0.5">{selectedRubric.academic_year}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Version</Label>
                          <p className="font-medium mt-0.5">Version {selectedRubric.version}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Created At</Label>
                          <p className="font-medium mt-0.5">{formatDateTime(selectedRubric.created_at)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Current Status</Label>
                          <p className="font-medium mt-0.5 capitalize">{selectedRubric.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                      </div>

                      {selectedRubric.deactivation_reason && (
                        <div className="p-3 bg-muted rounded-md text-xs mt-2 border">
                          <span className="font-semibold text-foreground">Deactivation Reason:</span>{' '}
                          <span className="text-muted-foreground">{selectedRubric.deactivation_reason}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 2: Criteria */}
                <TabsContent value="criteria" className="space-y-4 mt-4">
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                    {selectedRubric.criteria?.map((criterion) => (
                      <Card key={criterion.code} className="p-4 border border-border">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-bold">{criterion.code}</Badge>
                              <span className="font-semibold text-sm">{criterion.name}</span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted">
                              Max: {criterion.max_score} pts
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground">{criterion.description}</p>

                          <div className="grid gap-1.5 pt-2 border-t">
                            {Object.entries(criterion.scale_descriptions || {}).map(([range, desc]) => (
                              <div key={range} className="flex items-start gap-2 text-xs">
                                <Badge variant="secondary" className="w-12 justify-center flex-shrink-0 text-xs">
                                  {range}
                                </Badge>
                                <span className="text-muted-foreground italic">&ldquo;{desc}&rdquo;</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Tab 3: Grading Scale */}
                <TabsContent value="grading" className="space-y-4 mt-4">
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground px-3 py-1">
                      <span>Grade Equivalent</span>
                      <span>Point Range</span>
                      <span className="text-right">Max Scale</span>
                    </div>

                    {selectedRubric.grading_scale?.map((scale, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 items-center p-2 rounded-md bg-muted/30 border text-xs">
                        <span className="font-bold text-foreground text-sm">{scale.grade.toFixed(2)}</span>
                        <span className="text-muted-foreground font-mono">
                          {scale.min_score} - {scale.max_score} pts
                        </span>
                        <span className="text-right text-muted-foreground font-medium">
                          {scale.max_score}/70
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6 flex justify-between items-center">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {!selectedRubric.is_active && (
                  <Button
                    onClick={() => handleActivateRubric(selectedRubric)}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Activate This Rubric
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Rubric</DialogTitle>
            <DialogDescription>
              This will deactivate {selectedRubric?.rubric_name}. Provide a reason for this action.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <Label>Deactivation Reason <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Explain why this rubric is being deactivated (minimum 10 characters)..."
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {deactivationReason.length} / 10 characters minimum
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateRubric}
              disabled={submitting || deactivationReason.trim().length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PowerOff className="w-4 h-4 mr-2" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
