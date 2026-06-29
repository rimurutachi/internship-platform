'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  History,
  Loader2,
  AlertCircle,
  Save,
  Power,
  PowerOff
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
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

interface RubricHistory {
  id: string;
  rubric_id: string;
  version: number;
  changes: string;
  change_reason: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
}

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
  const [rubricHistory, setRubricHistory] = useState<RubricHistory[]>([]);
  const [universityId, setUniversityId] = useState<string>('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  
  // Form state
  const [rubricName, setRubricName] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [criteria, setCriteria] = useState<RubricCriterion[]>(DEFAULT_CRITERIA);
  const [gradingScale, setGradingScale] = useState<GradingScale[]>(DEFAULT_GRADING_SCALE);
  const [changeReason, setChangeReason] = useState('');
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

      if (userError) throw userError;
      
      const univId = userData.university_id;
      setUniversityId(univId);

      // Fetch rubrics from backend
      await fetchRubrics(univId);
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

  const fetchRubricHistory = async (rubricId: string) => {
    try {
      const response = await adminRubricsAPI.getRubricHistory(rubricId);
      if (response.success) {
        setRubricHistory(response.data);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Failed to fetch history:', error);
      setRubricHistory([]);
    }
  };

  const openCreateDialog = () => {
    const currentYear = new Date().getFullYear();
    setRubricName('CvSU Final Evaluation Rubric');
    setRubricDescription('Standard rubric for final internship evaluation');
    setCriteria(DEFAULT_CRITERIA);
    setGradingScale(DEFAULT_GRADING_SCALE);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (rubric: EvaluationRubric) => {
    setSelectedRubric(rubric);
    setRubricName(rubric.rubric_name || '');
    setRubricDescription(rubric.description || '');
    setCriteria(rubric.criteria);
    setGradingScale(rubric.grading_scale);
    setChangeReason('');
    setEditDialogOpen(true);
  };

  const openHistoryDialog = async (rubric: EvaluationRubric) => {
    setSelectedRubric(rubric);
    await fetchRubricHistory(rubric.id);
    setHistoryDialogOpen(true);
  };

  const openDeactivateDialog = (rubric: EvaluationRubric) => {
    setSelectedRubric(rubric);
    setDeactivationReason('');
    setDeactivateDialogOpen(true);
  };

  const handleCreateRubric = async () => {
    if (!rubricName || rubricName.length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Rubric name must be at least 5 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!rubricDescription || rubricDescription.length < 10) {
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
      const academicYear = `${currentYear}-${currentYear + 1}`;

      console.log('[AdminRubrics] Creating rubric:', { rubricName, universityId });

      const response = await adminRubricsAPI.createRubric({
        university_id: universityId,
        academic_year: academicYear,
        rubric_name: rubricName,
        description: rubricDescription || undefined,
        criteria,
        grading_scale: gradingScale,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Rubric created successfully',
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

  const handleUpdateRubric = async () => {
    if (!selectedRubric) return;

    if (!rubricName || rubricName.length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Rubric name must be at least 5 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!changeReason || changeReason.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Change reason must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('[AdminRubrics] Updating rubric:', selectedRubric.id);

      const response = await adminRubricsAPI.updateRubric(
        selectedRubric.id,
        {
          rubric_name: rubricName,
          description: rubricDescription || undefined,
          criteria,
          grading_scale: gradingScale,
        },
        changeReason
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'Rubric updated successfully',
        });
        setEditDialogOpen(false);
        await fetchRubrics(universityId);
      }
    } catch (error: any) {
      console.error('[AdminRubrics] Update error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update rubric',
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
          description: 'Rubric activated successfully',
        });
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
    <>
      <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Rubrics Management</h1>
                  <p className="text-muted-foreground mt-1">Manage evaluation rubrics and grading scales</p>
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

              {/* Rubrics List */}
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation Rubrics</CardTitle>
                  <CardDescription>
                    {rubrics.length} rubric{rubrics.length !== 1 ? 's' : ''} • {rubrics.filter(r => r.is_active).length} active
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
                        <Card key={rubric.id} className={`hover:shadow-card transition-shadow ${rubric.is_active ? 'border-green-500 border-2' : ''}`}>
                          <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-foreground">{rubric.rubric_name}</h3>
                                  {rubric.is_active && (
                                    <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  )}
                                  <Badge variant="outline">v{rubric.version}</Badge>
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3">{rubric.description}</p>

                                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                  <div>
                                    <span className="text-muted-foreground">Criteria:</span>
                                    <span className="font-bold text-foreground ml-2">
                                      {rubric.criteria.length}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Max Score:</span>
                                    <span className="font-bold text-foreground ml-2">
                                      {rubric.criteria.reduce((sum, c) => sum + c.max_score, 0)}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  Created: {formatDate(rubric.created_at)}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 sm:ml-4 mt-4 sm:mt-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openHistoryDialog(rubric)}
                                >
                                  <History className="w-4 h-4 mr-2" />
                                  History
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(rubric)}
                                  disabled={submitting}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                                {rubric.is_active ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeactivateDialog(rubric)}
                                    disabled={submitting}
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
                                    className="bg-green-600 hover:bg-green-700"
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
      </div>
      {/* Create Rubric Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Rubric</DialogTitle>
            <DialogDescription>
              Define evaluation criteria and grading scale for your university
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Rubric Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., CvSU Final Evaluation Rubric"
                value={rubricName}
                onChange={(e) => setRubricName(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {rubricName.length} / 5 characters minimum
              </p>
            </div>

            <div>
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe the purpose and usage of this rubric..."
                value={rubricDescription}
                onChange={(e) => setRubricDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {rubricDescription.length} / 10 characters minimum
              </p>
            </div>

            <div>
              <Label>Criteria ({criteria.length})</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                Using CvSU default 7 criteria (A-G): Quality of Work, Attitude, Judgment, Cooperation, Dependability, Comprehension, Safety. Each criterion has 5 performance levels (Poor to Outstanding) with 1-10 point scale. Maximum total score: 70 points.
              </div>
            </div>

            <div>
              <Label>Grading Scale</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                Using CvSU default grading scale (based on 70-point maximum): 1.0 (67-70), 1.25 (63-66), 1.5 (59-62), 1.75 (54-58), 2.0 (50-53), 2.25 (45-49), 2.5 (41-44), 2.75 (36-40), 3.0 (32-35), 4.0 (18-31), 5.0 (7-17)
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRubric}
              disabled={submitting || rubricName.length < 5 || rubricDescription.length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Create Rubric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rubric Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rubric - {selectedRubric?.rubric_name}</DialogTitle>
            <DialogDescription>
              Editing will create version {selectedRubric ? selectedRubric.version + 1 : ''}. You can modify criteria and grading scale based on official evaluation forms.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="criteria">Criteria</TabsTrigger>
              <TabsTrigger value="grading">Grading Scale</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label>Rubric Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g., CvSU Final Evaluation Rubric"
                  value={rubricName}
                  onChange={(e) => setRubricName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Describe the purpose and usage of this rubric..."
                  value={rubricDescription}
                  onChange={(e) => setRubricDescription(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Change Reason <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Explain what changes you made and why (minimum 10 characters)..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {changeReason.length} / 10 characters minimum
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This will create a new version and save the change to history
                </p>
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4 mt-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md mb-4">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Modify criteria based on official university evaluation forms. Each criterion should have a code (A-G), name, description, and score descriptions for each rating level.
                </p>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {criteria.map((criterion, index) => (
                  <Card key={criterion.code} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{criterion.code}</Badge>
                        <Input
                          value={criterion.name}
                          onChange={(e) => {
                            const newCriteria = [...criteria];
                            newCriteria[index] = { ...criterion, name: e.target.value };
                            setCriteria(newCriteria);
                          }}
                          placeholder="Criterion name"
                          className="flex-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Description</Label>
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

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Max Score</Label>
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
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Performance Level Descriptions</Label>
                        <div className="grid gap-2">
                          {(['1-2', '3-4', '5-6', '7-8', '9-10'] as const).map((range) => (
                            <div key={range} className="flex items-center gap-2">
                              <Badge variant="secondary" className="w-12 justify-center text-xs">{range}</Badge>
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
                                className="flex-1 text-sm"
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

            <TabsContent value="grading" className="space-y-4 mt-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md mb-4">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Adjust the grading scale based on university standards. Ensure score ranges don't overlap and cover 0-100%.
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground px-2">
                  <span>Grade</span>
                  <span>Min Score (%)</span>
                  <span>Max Score (%)</span>
                  <span></span>
                </div>
                
                {gradingScale.map((scale, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center">
                    <Input
                      type="number"
                      step="0.25"
                      value={scale.grade}
                      onChange={(e) => {
                        const newScale = [...gradingScale];
                        newScale[index] = { ...scale, grade: parseFloat(e.target.value) || 1.0 };
                        setCriteria([...criteria]); // Trigger re-render
                        setGradingScale(newScale);
                      }}
                      className="text-center"
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
                    <span className="text-xs text-muted-foreground text-center">
                      {scale.min_score === scale.max_score ? `${scale.min_score}%` : `${scale.min_score}-${scale.max_score}%`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>CvSU Standard Scale (70-point max):</strong> 1.0 (67-70), 1.25 (63-66), 1.5 (59-62), 1.75 (54-58), 2.0 (50-53), 2.25 (45-49), 2.5 (41-44), 2.75 (36-40), 3.0 (32-35), 4.0 (18-31), 5.0 (7-17)
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRubric}
              disabled={submitting || changeReason.length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History - {selectedRubric?.rubric_name}</DialogTitle>
            <DialogDescription>
              View all changes made to this rubric
            </DialogDescription>
          </DialogHeader>
          
          {rubricHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rubricHistory.map((history) => (
                <Card key={history.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">Version {history.version}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(history.changed_at)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {history.change_reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Changed by: {history.changed_by_name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
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
              disabled={submitting || deactivationReason.length < 10}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PowerOff className="w-4 h-4 mr-2" />}
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
