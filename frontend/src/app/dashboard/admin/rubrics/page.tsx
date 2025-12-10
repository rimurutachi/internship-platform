'use client';

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

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_score: number;
  scale_descriptors: {
    range: string;
    label: string;
    description: string;
  }[];
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  university_id: string;
  version: number;
  is_active: boolean;
  criteria: RubricCriterion[];
  grading_scale: {
    min_score: number;
    max_score: number;
    grade: number;
  }[];
  created_at: string;
  created_by: string;
  activated_at?: string;
  deactivated_at?: string;
  deactivation_reason?: string;
}

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
    id: 'quality_of_work',
    name: 'A. Quality of Work',
    description: 'Thoroughness, accuracy, and care in completing tasks',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Work is incomplete, inaccurate, or careless' },
      { range: '3-4', label: 'Below Average', description: 'Work meets minimum standards but lacks attention to detail' },
      { range: '5-6', label: 'Satisfactory', description: 'Work is adequate and meets basic expectations' },
      { range: '7-8', label: 'Good', description: 'Work is thorough, accurate, and well-executed' },
      { range: '9-10', label: 'Excellent', description: 'Work exceeds expectations with exceptional quality' },
    ],
  },
  {
    id: 'attitude',
    name: 'B. Attitude',
    description: 'Enthusiasm, interest, and positive approach to work',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Shows disinterest or negative attitude' },
      { range: '3-4', label: 'Below Average', description: 'Attitude is occasionally negative or unmotivated' },
      { range: '5-6', label: 'Satisfactory', description: 'Maintains professional attitude most of the time' },
      { range: '7-8', label: 'Good', description: 'Consistently positive and enthusiastic' },
      { range: '9-10', label: 'Excellent', description: 'Highly motivated with exceptional enthusiasm' },
    ],
  },
  {
    id: 'judgment',
    name: 'C. Judgment',
    description: 'Decision-making and problem-solving abilities',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Makes poor decisions without considering consequences' },
      { range: '3-4', label: 'Below Average', description: 'Judgment is sometimes questionable' },
      { range: '5-6', label: 'Satisfactory', description: 'Makes reasonable decisions in most situations' },
      { range: '7-8', label: 'Good', description: 'Demonstrates sound judgment consistently' },
      { range: '9-10', label: 'Excellent', description: 'Exceptional problem-solving and decision-making skills' },
    ],
  },
  {
    id: 'cooperation',
    name: 'D. Cooperation',
    description: 'Teamwork and collaboration with others',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Difficult to work with, uncooperative' },
      { range: '3-4', label: 'Below Average', description: 'Sometimes struggles with teamwork' },
      { range: '5-6', label: 'Satisfactory', description: 'Works adequately with others' },
      { range: '7-8', label: 'Good', description: 'Collaborates well with team members' },
      { range: '9-10', label: 'Excellent', description: 'Outstanding team player, facilitates collaboration' },
    ],
  },
  {
    id: 'dependability',
    name: 'E. Dependability',
    description: 'Reliability and punctuality',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Unreliable, frequently absent or late' },
      { range: '3-4', label: 'Below Average', description: 'Occasionally unreliable or late' },
      { range: '5-6', label: 'Satisfactory', description: 'Generally reliable and punctual' },
      { range: '7-8', label: 'Good', description: 'Consistently reliable and on time' },
      { range: '9-10', label: 'Excellent', description: 'Exceptionally dependable in all situations' },
    ],
  },
  {
    id: 'comprehension',
    name: 'F. Comprehension',
    description: 'Understanding and learning ability',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Struggles to understand instructions or concepts' },
      { range: '3-4', label: 'Below Average', description: 'Requires repeated explanations' },
      { range: '5-6', label: 'Satisfactory', description: 'Understands with minimal guidance' },
      { range: '7-8', label: 'Good', description: 'Quickly grasps new concepts and instructions' },
      { range: '9-10', label: 'Excellent', description: 'Outstanding learning ability and comprehension' },
    ],
  },
  {
    id: 'safety',
    name: 'G. Safety',
    description: 'Safety awareness and adherence to protocols',
    max_score: 10,
    scale_descriptors: [
      { range: '1-2', label: 'Poor', description: 'Disregards safety protocols' },
      { range: '3-4', label: 'Below Average', description: 'Sometimes neglects safety procedures' },
      { range: '5-6', label: 'Satisfactory', description: 'Follows basic safety guidelines' },
      { range: '7-8', label: 'Good', description: 'Consistently adheres to safety protocols' },
      { range: '9-10', label: 'Excellent', description: 'Exemplary safety awareness and practices' },
    ],
  },
];

const DEFAULT_GRADING_SCALE = [
  { min_score: 97, max_score: 100, grade: 1.0 },
  { min_score: 94, max_score: 96, grade: 1.25 },
  { min_score: 91, max_score: 93, grade: 1.5 },
  { min_score: 88, max_score: 90, grade: 1.75 },
  { min_score: 85, max_score: 87, grade: 2.0 },
  { min_score: 82, max_score: 84, grade: 2.25 },
  { min_score: 79, max_score: 81, grade: 2.5 },
  { min_score: 76, max_score: 78, grade: 2.75 },
  { min_score: 75, max_score: 75, grade: 3.0 },
  { min_score: 70, max_score: 74, grade: 4.0 },
  { min_score: 0, max_score: 69, grade: 5.0 },
];

export default function AdminRubricsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Data state
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
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
  const [gradingScale, setGradingScale] = useState(DEFAULT_GRADING_SCALE);
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

      // Fetch rubrics
      await fetchRubrics(univId);
    } catch (error: any) {
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
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('rubrics')
        .select('*')
        .eq('university_id', univId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRubrics(data || []);
    } catch (error: any) {
      console.error('Failed to fetch rubrics:', error);
    }
  };

  const fetchRubricHistory = async (rubricId: string) => {
    try {
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('rubric_history')
        .select(`
          *,
          changer:users!rubric_history_changed_by_fkey(first_name, last_name)
        `)
        .eq('rubric_id', rubricId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      const formattedHistory: RubricHistory[] = (data || []).map((item: any) => ({
        id: item.id,
        rubric_id: item.rubric_id,
        version: item.version,
        changes: item.changes,
        change_reason: item.change_reason,
        changed_by: item.changed_by,
        changed_by_name: item.changer 
          ? `${item.changer.first_name} ${item.changer.last_name}`
          : 'Unknown',
        changed_at: item.changed_at,
      }));

      setRubricHistory(formattedHistory);
    } catch (error: any) {
      console.error('Failed to fetch history:', error);
      setRubricHistory([]);
    }
  };

  const openCreateDialog = () => {
    setRubricName('CvSU Final Evaluation Rubric');
    setRubricDescription('Standard rubric for final internship evaluation');
    setCriteria(DEFAULT_CRITERIA);
    setGradingScale(DEFAULT_GRADING_SCALE);
    setCreateDialogOpen(true);
  };

  const openEditDialog = (rubric: Rubric) => {
    setSelectedRubric(rubric);
    setRubricName(rubric.name);
    setRubricDescription(rubric.description);
    setCriteria(rubric.criteria);
    setGradingScale(rubric.grading_scale);
    setChangeReason('');
    setEditDialogOpen(true);
  };

  const openHistoryDialog = async (rubric: Rubric) => {
    setSelectedRubric(rubric);
    await fetchRubricHistory(rubric.id);
    setHistoryDialogOpen(true);
  };

  const openDeactivateDialog = (rubric: Rubric) => {
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

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newRubric = {
        name: rubricName,
        description: rubricDescription,
        university_id: universityId,
        version: 1,
        is_active: false,
        criteria: criteria,
        grading_scale: gradingScale,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('rubrics')
        .insert([newRubric]);

      if (error) throw error;

      toast({
        title: 'Rubric Created',
        description: 'New rubric has been created successfully',
      });

      setCreateDialogOpen(false);
      fetchRubrics(universityId);
    } catch (error: any) {
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
      const supabase = createSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create history record
      const { error: historyError } = await supabase
        .from('rubric_history')
        .insert([{
          rubric_id: selectedRubric.id,
          version: selectedRubric.version,
          changes: JSON.stringify({
            previous: {
              name: selectedRubric.name,
              description: selectedRubric.description,
              criteria: selectedRubric.criteria,
              grading_scale: selectedRubric.grading_scale,
            },
            new: {
              name: rubricName,
              description: rubricDescription,
              criteria: criteria,
              grading_scale: gradingScale,
            },
          }),
          change_reason: changeReason,
          changed_by: user.id,
        }]);

      if (historyError) throw historyError;

      // Update rubric with incremented version
      const { error: updateError } = await supabase
        .from('rubrics')
        .update({
          name: rubricName,
          description: rubricDescription,
          criteria: criteria,
          grading_scale: gradingScale,
          version: selectedRubric.version + 1,
        })
        .eq('id', selectedRubric.id);

      if (updateError) throw updateError;

      toast({
        title: 'Rubric Updated',
        description: `Version ${selectedRubric.version + 1} saved`,
      });

      setEditDialogOpen(false);
      setSelectedRubric(null);
      fetchRubrics(universityId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update rubric',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateRubric = async (rubric: Rubric) => {
    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();

      // Deactivate all other rubrics for this university
      const { error: deactivateError } = await supabase
        .from('rubrics')
        .update({ is_active: false })
        .eq('university_id', universityId)
        .eq('is_active', true);

      if (deactivateError) throw deactivateError;

      // Activate selected rubric
      const { error: activateError } = await supabase
        .from('rubrics')
        .update({ 
          is_active: true,
          activated_at: new Date().toISOString(),
        })
        .eq('id', rubric.id);

      if (activateError) throw activateError;

      toast({
        title: 'Rubric Activated',
        description: `${rubric.name} is now the active rubric`,
      });

      fetchRubrics(universityId);
    } catch (error: any) {
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

    if (!deactivationReason || deactivationReason.length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Deactivation reason must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createSupabaseClient();

      const { error } = await supabase
        .from('rubrics')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: deactivationReason,
        })
        .eq('id', selectedRubric.id);

      if (error) throw error;

      toast({
        title: 'Rubric Deactivated',
        description: `${selectedRubric.name} has been deactivated`,
      });

      setDeactivateDialogOpen(false);
      setSelectedRubric(null);
      fetchRubrics(universityId);
    } catch (error: any) {
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
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
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
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-foreground">{rubric.name}</h3>
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
                                  {rubric.activated_at && (
                                    <> • Activated: {formatDate(rubric.activated_at)}</>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 ml-4">
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
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Rubrics"
          subtitle="Manage Evaluation Rubrics"
        />

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            <Button onClick={openCreateDialog} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Rubric
            </Button>

            {rubrics.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No rubrics found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rubrics.map((rubric) => (
                  <Card key={rubric.id} className={rubric.is_active ? 'border-green-500 border-2' : ''}>
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{rubric.name}</div>
                            <div className="text-xs text-muted-foreground">v{rubric.version}</div>
                          </div>
                          {rubric.is_active && (
                            <Badge className="bg-green-500/10 text-green-600" style={{ fontSize: '0.65rem' }}>
                              Active
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">{rubric.description}</p>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => openEditDialog(rubric)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => openHistoryDialog(rubric)}
                          >
                            <History className="w-3 h-3 mr-1" />
                            History
                          </Button>
                          {!rubric.is_active && (
                            <Button
                              size="sm"
                              className="flex-1 text-xs bg-green-600"
                              onClick={() => handleActivateRubric(rubric)}
                            >
                              <Power className="w-3 h-3 mr-1" />
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
          </div>
        </div>

        <BottomNavigation type="admin" />
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
                Using CvSU default 7 criteria (A-G): Quality of Work, Attitude, Judgment, Cooperation, Dependability, Comprehension, Safety. Each criterion has 5 performance levels (Poor to Excellent) with 1-10 scale.
              </div>
            </div>

            <div>
              <Label>Grading Scale</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                Using CvSU default grading scale: 1.0 (97-100%), 1.25 (94-96%), 1.5 (91-93%), ..., 5.0 (&lt;70%)
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rubric - {selectedRubric?.name}</DialogTitle>
            <DialogDescription>
              Editing will create version {selectedRubric ? selectedRubric.version + 1 : ''}
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
          </div>

          <DialogFooter>
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
            <DialogTitle>Version History - {selectedRubric?.name}</DialogTitle>
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
              This will deactivate {selectedRubric?.name}. Provide a reason for this action.
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
    </div>
  );
}
