'use client';

import React, { useState, useEffect } from 'react';
import { adminEvaluationsAPI } from '@/lib/api/admin-evaluations';
import {
  EvaluationWithRelations,
  EvaluationFilters,
  QualityMetrics,
  AIResults,
  ActivityLogEntry,
} from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUserContext } from '@/components/providers/UserProvider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminEvaluationsPage() {
  const { toast } = useToast();
  const { user } = useUserContext();
  const initials = user?.first_name && user?.last_name
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : 'AD';
  
  // State
  const [evaluations, setEvaluations] = useState<EvaluationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [filters, setFilters] = useState<EvaluationFilters>({
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationWithRelations | null>(null);
  const [aiResults, setAiResults] = useState<AIResults | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  
  // Form states
  const [approveForm, setApproveForm] = useState({
    final_grade: '',
    notes: '',
    use_ai_grade: true,
  });
  const [overrideForm, setOverrideForm] = useState({
    new_grade: '',
    reason: '',
  });
  const [rejectForm, setRejectForm] = useState({
    reason: '',
    comments: '',
  });

  // Load evaluations
  useEffect(() => {
    loadEvaluations();
  }, [filters]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response: any = await adminEvaluationsAPI.getEvaluations(filters);
      setEvaluations(response.data.evaluations);
      setPagination(response.data.pagination);
      setMetrics(response.data.metrics);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load evaluations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvaluation = async (evaluation: EvaluationWithRelations) => {
    try {
      setSelectedEvaluation(evaluation);
      
      // Load details
      const detailsResponse: any = await adminEvaluationsAPI.getEvaluation(evaluation.id);
      setActivityLog(detailsResponse.data.activity_log);
      
      // Load AI results if processed
      if (evaluation.status === 'processed' || evaluation.status === 'approved') {
        try {
          const aiResponse: any = await adminEvaluationsAPI.getAIResults(evaluation.id);
          setAiResults(aiResponse.data.ai_results);
        } catch (error) {
          setAiResults(null);
        }
      } else {
        setAiResults(null);
      }
      
      setViewModalOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load evaluation details',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedEvaluation) return;

    try {
      const data: any = {
        use_ai_grade: approveForm.use_ai_grade,
        notes: approveForm.notes,
      };
      
      if (!approveForm.use_ai_grade && approveForm.final_grade) {
        data.final_grade = parseFloat(approveForm.final_grade);
      }

      await adminEvaluationsAPI.approveEvaluation(selectedEvaluation.id, data);
      
      toast({
        title: 'Success',
        description: 'Evaluation approved successfully',
      });
      
      setApproveModalOpen(false);
      setViewModalOpen(false);
      loadEvaluations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve evaluation',
        variant: 'destructive',
      });
    }
  };

  const handleOverride = async () => {
    if (!selectedEvaluation) return;

    try {
      await adminEvaluationsAPI.overrideGrade(selectedEvaluation.id, {
        new_grade: parseFloat(overrideForm.new_grade),
        reason: overrideForm.reason,
      });
      
      toast({
        title: 'Success',
        description: 'Grade overridden successfully',
      });
      
      setOverrideModalOpen(false);
      setViewModalOpen(false);
      loadEvaluations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to override grade',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedEvaluation) return;

    try {
      await adminEvaluationsAPI.rejectEvaluation(selectedEvaluation.id, rejectForm);
      
      toast({
        title: 'Success',
        description: 'Evaluation rejected and returned to supervisor',
      });
      
      setRejectModalOpen(false);
      setViewModalOpen(false);
      loadEvaluations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject evaluation',
        variant: 'destructive',
      });
    }
  };

  const handleRequestReprocess = async (evaluationId: string) => {
    try {
      await adminEvaluationsAPI.requestReprocess(evaluationId, {
        reason: 'Admin requested reprocessing',
      });
      
      toast({
        title: 'Success',
        description: 'AI reprocessing requested',
      });
      
      loadEvaluations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request reprocessing',
        variant: 'destructive',
      });
    }
  };

  const handleBulkExport = async (format: 'csv' | 'json') => {
    try {
      await adminEvaluationsAPI.bulkExport({
        format,
        filters,
        include_ai_results: true,
      });
      
      toast({
        title: 'Success',
        description: `Evaluations exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export evaluations',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      submitted: 'default',
      processed: 'secondary',
      approved: 'default',
    };
    
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      submitted: 'bg-blue-500',
      processed: 'bg-yellow-500',
      approved: 'bg-green-500',
    };

    return (
      <Badge variant={variants[status] || 'default'} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdminHeader />

          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Breadcrumbs */}
              <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
                <ol className="flex items-center gap-2">
                  <li>
                    <Link href="/dashboard/admin" className="hover:text-foreground">Dashboard</Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="text-foreground">Evaluations</li>
                </ol>
              </nav>

              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold">Evaluations Management</h1>
                  <p className="text-muted-foreground">Monitor and validate internship evaluations</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleBulkExport('csv')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleBulkExport('json')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                </div>
              </div>

              {/* Quality Metrics */}
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{metrics.total_this_month}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Processed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{metrics.total_processed}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Avg Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{(metrics.avg_confidence * 100).toFixed(0)}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bias Pass Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{metrics.bias_pass_rate.toFixed(0)}%</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <Input
                        placeholder="Search student name..."
                        value={filters.search || ''}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                      />
                    </div>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value === 'all' ? undefined : value, page: 1 })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluations Table */}
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="text-center py-8">Loading evaluations...</div>
                  ) : evaluations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No evaluations found
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Supervisor</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Avg Rating</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {evaluations.map((evaluation) => (
                            <TableRow key={evaluation.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{evaluation.internship.student.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {evaluation.internship.student.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{evaluation.internship.supervisor.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {evaluation.internship.supervisor.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{evaluation.internship.company.name}</TableCell>
                              <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                              <TableCell>
                                {evaluation.avg_rating
                                  ? `${evaluation.avg_rating.toFixed(1)}/10`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {evaluation.confidence_score
                                  ? `${(evaluation.confidence_score * 100).toFixed(0)}%`
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewEvaluation(evaluation)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {evaluation.status === 'processed' && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => {
                                        setSelectedEvaluation(evaluation);
                                        setApproveModalOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                          Showing {evaluations.length} of {pagination.total} evaluations
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pagination.page === 1}
                            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="px-4 py-2 text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Evaluations"
            subtitle="Monitor and validate evaluations"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor and validate evaluations</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkExport('csv')}>
                  <Download className="mr-1 h-3 w-3" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkExport('json')}>
                  <Download className="mr-1 h-3 w-3" />
                  JSON
                </Button>
              </div>
            </div>

            {/* Quality Metrics */}
            {metrics && (
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Total This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{metrics.total_this_month}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Processed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{metrics.total_processed}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Avg Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{(metrics.avg_confidence * 100).toFixed(0)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Bias Pass Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{metrics.bias_pass_rate.toFixed(0)}%</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="Search student..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                  </div>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value === 'all' ? undefined : value, page: 1 })
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Evaluations List - Mobile optimized */}
            {loading ? (
              <Card>
                <CardContent className="py-8 text-center">Loading evaluations...</CardContent>
              </Card>
            ) : evaluations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No evaluations found
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {evaluations.map((evaluation) => (
                    <Card key={evaluation.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold">{evaluation.internship.student.name}</p>
                              <p className="text-xs text-muted-foreground">{evaluation.internship.student.email}</p>
                            </div>
                            {getStatusBadge(evaluation.status)}
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Supervisor:</span>
                              <span className="font-medium">{evaluation.internship.supervisor.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Company:</span>
                              <span className="font-medium">{evaluation.internship.company.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avg Rating:</span>
                              <span className="font-medium">
                                {evaluation.avg_rating ? `${evaluation.avg_rating.toFixed(1)}/10` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Confidence:</span>
                              <span className="font-medium">
                                {evaluation.confidence_score ? `${(evaluation.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleViewEvaluation(evaluation)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                            {evaluation.status === 'processed' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedEvaluation(evaluation);
                                  setApproveModalOpen(true);
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        {evaluations.length} of {pagination.total}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pagination.page === 1}
                          onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 text-xs flex items-center">
                          {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>

      {/* Modals - Shared across Desktop and Mobile */}
      {/* View Evaluation Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
            <DialogDescription>
              Review evaluation information and AI analysis results
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvaluation && (
            <div className="space-y-6">
              {/* Student & Internship Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Student</Label>
                  <p>{selectedEvaluation.internship.student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvaluation.internship.student.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Supervisor</Label>
                  <p>{selectedEvaluation.internship.supervisor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvaluation.internship.supervisor.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Company</Label>
                  <p>{selectedEvaluation.internship.company.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEvaluation.status)}</div>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <Label className="text-sm font-semibold">Supervisor Feedback</Label>
                <p className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedEvaluation.feedback_text}
                </p>
              </div>

              {/* Ratings */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Ratings</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">Overall: {selectedEvaluation.rating_overall || 'N/A'}/10</p>
                    <Progress value={(selectedEvaluation.rating_overall || 0) * 10} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-sm">Technical: {selectedEvaluation.rating_technical || 'N/A'}/10</p>
                    <Progress value={(selectedEvaluation.rating_technical || 0) * 10} className="mt-1" />
                  </div>
                  <div>
                    <p className="text-sm">
                      Communication: {selectedEvaluation.rating_communication || 'N/A'}/10
                    </p>
                    <Progress
                      value={(selectedEvaluation.rating_communication || 0) * 10}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <p className="text-sm">
                      Work Ethic: {selectedEvaluation.rating_work_ethic || 'N/A'}/10
                    </p>
                    <Progress value={(selectedEvaluation.rating_work_ethic || 0) * 10} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* AI Results */}
              {aiResults && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold mb-2 block">AI Analysis Results</Label>
                  
                  <div className="space-y-4">
                    {/* Sentiment Analysis */}
                    {aiResults.sentiment_analysis && (
                      <div>
                        <p className="text-sm font-medium mb-2">Sentiment Analysis</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 bg-green-50 dark:bg-green-950 rounded">
                            <p className="text-xs text-muted-foreground">Positive</p>
                            <p className="text-lg font-bold">
                              {((aiResults.sentiment_analysis.positive || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                            <p className="text-xs text-muted-foreground">Neutral</p>
                            <p className="text-lg font-bold">
                              {((aiResults.sentiment_analysis.neutral || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-950 rounded">
                            <p className="text-xs text-muted-foreground">Negative</p>
                            <p className="text-lg font-bold">
                              {((aiResults.sentiment_analysis.negative || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {aiResults.features && aiResults.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Extracted Features</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResults.features.map((feature, index) => (
                            <Badge key={index} variant="secondary">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grade & Confidence */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Recommended Grade</p>
                        <p className="text-2xl font-bold">{aiResults.recommended_grade}/100</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Confidence Score</p>
                        <p className="text-2xl font-bold">
                          {(aiResults.confidence_score * 100).toFixed(0)}%
                        </p>
                        <Progress value={aiResults.confidence_score * 100} className="mt-2" />
                      </div>
                    </div>

                    {/* Bias Check */}
                    <div>
                      <p className="text-sm font-medium mb-1">Bias Check</p>
                      <Badge variant={aiResults.bias_check_passed ? 'default' : 'destructive'}>
                        {aiResults.bias_check_passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t pt-4 flex-wrap">
                {selectedEvaluation.status === 'processed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRejectModalOpen(true);
                        setViewModalOpen(false);
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideModalOpen(true);
                        setViewModalOpen(false);
                      }}
                    >
                      Override Grade
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setApproveModalOpen(true);
                        setViewModalOpen(false);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {(selectedEvaluation.status === 'submitted' ||
                  selectedEvaluation.status === 'processed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleRequestReprocess(selectedEvaluation.id);
                      setViewModalOpen(false);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reprocess
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Evaluation</DialogTitle>
            <DialogDescription>
              Confirm the final grade and approve this evaluation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use-ai-grade"
                checked={approveForm.use_ai_grade}
                onChange={(e) =>
                  setApproveForm({ ...approveForm, use_ai_grade: e.target.checked })
                }
                className="mr-2"
              />
              <Label htmlFor="use-ai-grade" className="cursor-pointer">
                Use AI recommended grade ({selectedEvaluation?.recommended_grade || 'N/A'})
              </Label>
            </div>
            
            {!approveForm.use_ai_grade && (
              <div>
                <Label>Final Grade (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={approveForm.final_grade}
                  onChange={(e) =>
                    setApproveForm({ ...approveForm, final_grade: e.target.value })
                  }
                  placeholder="Enter final grade"
                />
              </div>
            )}
            
            <div>
              <Label>Approval Notes (Optional)</Label>
              <Textarea
                value={approveForm.notes}
                onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve Evaluation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Override Grade Modal */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Grade</DialogTitle>
            <DialogDescription>
              Override the AI recommended grade with a manual grade
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Current Recommended Grade</Label>
              <p className="text-2xl font-bold">{selectedEvaluation?.recommended_grade || 'N/A'}</p>
            </div>
            
            <div>
              <Label>New Grade (0-100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={overrideForm.new_grade}
                onChange={(e) =>
                  setOverrideForm({ ...overrideForm, new_grade: e.target.value })
                }
                placeholder="Enter new grade"
              />
            </div>
            
            <div>
              <Label>Reason for Override</Label>
              <Textarea
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                placeholder="Explain why you're overriding the grade..."
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOverride}>Override Grade</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Evaluation</DialogTitle>
            <DialogDescription>
              Return this evaluation to the supervisor for revision
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Reason for Rejection</Label>
              <Select
                value={rejectForm.reason}
                onValueChange={(value) => setRejectForm({ ...rejectForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete_feedback">Incomplete Feedback</SelectItem>
                  <SelectItem value="inaccurate_ratings">Inaccurate Ratings</SelectItem>
                  <SelectItem value="bias_detected">Bias Detected</SelectItem>
                  <SelectItem value="insufficient_detail">Insufficient Detail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Comments for Supervisor</Label>
              <Textarea
                value={rejectForm.comments}
                onChange={(e) => setRejectForm({ ...rejectForm, comments: e.target.value })}
                placeholder="Provide guidance for the supervisor..."
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
