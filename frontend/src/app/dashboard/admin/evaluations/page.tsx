'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import { adminEvaluationsAPI } from '@/lib/api/admin-evaluations';
import {
  EvaluationWithRelations,
  EvaluationFilters,
  QualityMetrics,
} from '@/types/api';
import { convertScoreToGrade } from '@/components/admin/evaluations/gradeUtils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUserContext } from '@/components/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  EvaluationStatsCards,
  EvaluationFilters as EvaluationFiltersComponent,
  EvaluationTable,
  ViewEvaluationModal,
  ApproveEvaluationModal,
  RejectEvaluationModal,
  OverrideGradeModal,
} from '@/components/admin/evaluations';

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

  // Load evaluations
  useEffect(() => {
    loadEvaluations();
  }, [filters]);

  const loadEvaluations = async () => {
    console.log('📊 Loading admin evaluations with filters:', filters);
    try {
      setLoading(true);
      console.log('📤 Fetching from API...');
      const response: any = await adminEvaluationsAPI.getEvaluations(filters);
      
      console.log('✅ Evaluations fetched:', {
        count: response.data.evaluations.length,
        totalCount: response.data.pagination.total,
        page: response.data.pagination.page,
        totalPages: response.data.pagination.totalPages,
      });
      
      console.log('📊 [Admin] Full backend response:', JSON.stringify(response, null, 2));
      console.log('📊 [Admin] Response data structure:', {
        hasEvaluations: !!response.data.evaluations,
        hasPagination: !!response.data.pagination,
        hasMetrics: !!response.data.metrics,
        metricsKeys: response.data.metrics ? Object.keys(response.data.metrics) : 'NO METRICS',
      });
      
      setEvaluations(response.data.evaluations);
      setPagination(response.data.pagination);
      setMetrics(response.data.metrics);
      
      console.log('📋 Metrics after setState:', response.data.metrics);
      console.log('📋 Evaluations status breakdown:', {
        total: response.data.evaluations.length,
        byStatus: response.data.evaluations.reduce((acc: any, e: any) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch (error: any) {
      console.error('❌ Error loading evaluations:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load evaluations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvaluation = (evaluation: EvaluationWithRelations) => {
    console.log('🔍 Viewing evaluation details:', evaluation.id);
    setSelectedEvaluation(evaluation);
    setViewModalOpen(true);
  };

  const handleOpenApprove = (evaluation: EvaluationWithRelations) => {
    console.log('📋 Opening approve modal for evaluation:', {
      evaluationId: evaluation.id,
      studentName: evaluation.internship?.student?.name,
      status: evaluation.status,
    });
    setSelectedEvaluation(evaluation);
    setApproveModalOpen(true);
  };

  const handleOpenReject = (evaluation: EvaluationWithRelations) => {
    console.log('📋 Opening archive modal for evaluation:', evaluation.id);
    setSelectedEvaluation(evaluation);
    setRejectModalOpen(true);
  };

  const handleApprove = async (evaluationId: string) => {
    console.log('🔵 handleApprove called for evaluation:', evaluationId);
    
    // Find the evaluation to get total_score
    const evaluation = evaluations.find(e => e.id === evaluationId);
    if (!evaluation || !evaluation.total_score) {
      toast({
        title: 'Error',
        description: 'Evaluation score not found',
        variant: 'destructive',
      });
      return;
    }
    
    // Calculate the final grade from total_score using CvSU scale
    const calculatedGrade = convertScoreToGrade(evaluation.total_score);
    console.log('📊 Calculated grade from score:', {
      total_score: evaluation.total_score,
      calculated_grade: calculatedGrade,
    });
    
    try {
      console.log('📤 Sending approval request to API');
      await adminEvaluationsAPI.approveEvaluation(evaluationId, {
        final_grade: calculatedGrade, // Calculated grade from supervisor's score
        use_ai_grade: false,
      });
      
      console.log('✅ API response: Evaluation approved successfully');
      toast({
        title: 'Success',
        description: 'Evaluation approved successfully',
      });
      
      loadEvaluations();
    } catch (error: any) {
      console.error('❌ Error approving evaluation:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve evaluation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleArchive = async (evaluationId: string) => {
    console.log('🔵 handleArchive called for evaluation:', evaluationId);
    try {
      console.log('📤 Sending archive request to API');
      // Using rejectEvaluation endpoint to archive (soft delete)
      await adminEvaluationsAPI.rejectEvaluation(evaluationId, {
        reason: 'ARCHIVED',
        comments: 'Evaluation archived by admin - data preserved for historical tracking and AI analysis',
      });
      
      console.log('✅ API response: Evaluation archived successfully');
      toast({
        title: 'Success',
        description: 'Evaluation archived and removed from active list',
      });
      
      loadEvaluations();
    } catch (error: any) {
      console.error('❌ Error archiving evaluation:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive evaluation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleOverride = async (evaluationId: string, overrideGrade: number, reason: string) => {
    console.log('🔵 handleOverride called:', {
      evaluationId,
      newGrade: overrideGrade,
      reason,
    });
    try {
      console.log('📤 Sending grade override request to API');
      await adminEvaluationsAPI.overrideGrade(evaluationId, {
        new_grade: overrideGrade,
        reason,
      });
      
      console.log('✅ API response: Grade overridden successfully');
      toast({
        title: 'Success',
        description: 'Grade overridden successfully',
      });
      
      loadEvaluations();
    } catch (error: any) {
      console.error('❌ Error overriding grade:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to override grade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRequestReprocess = async (evaluationId: string) => {
    console.log('🔵 handleRequestReprocess called for evaluation:', evaluationId);
    try {
      console.log('📤 Sending reprocess request to API');
      await adminEvaluationsAPI.requestReprocess(evaluationId, {
        reason: 'Admin requested reprocessing',
      });
      
      console.log('✅ API response: Reprocessing requested');
      toast({
        title: 'Success',
        description: 'AI reprocessing requested',
      });
      
      loadEvaluations();
    } catch (error: any) {
      console.error('❌ Error requesting reprocessing:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to request reprocessing',
        variant: 'destructive',
      });
    }
  };



  const handleFiltersChange = (newFilters: EvaluationFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 20 });
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />

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
              </div>

              {/* Stats Cards */}
              {metrics && <EvaluationStatsCards metrics={metrics} loading={loading} />}

              {/* Filters */}
              <EvaluationFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />

              {/* Table */}
              <EvaluationTable
                evaluations={evaluations}
                loading={loading}
                onView={handleViewEvaluation}
                onApprove={handleOpenApprove}
                onReject={handleOpenReject}
                onReprocess={handleRequestReprocess}
              />

              {/* Pagination */}
              {!loading && evaluations.length > 0 && (
                <div className="flex justify-between items-center">
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
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

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold">Evaluations</h1>
                <p className="text-sm text-muted-foreground">Monitor and validate</p>
              </div>
            </div>

            {metrics && <EvaluationStatsCards metrics={metrics} loading={loading} />}

            <EvaluationFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />

            <EvaluationTable
              evaluations={evaluations}
              loading={loading}
              onView={handleViewEvaluation}
              onApprove={handleOpenApprove}
              onReject={handleOpenReject}
              onReprocess={handleRequestReprocess}
            />

            {!loading && evaluations.length > 0 && (
              <div className="flex justify-between items-center p-4 border rounded-lg">
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
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>

      {/* Modals */}
      <ViewEvaluationModal
        evaluation={selectedEvaluation}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />

      <ApproveEvaluationModal
        evaluation={selectedEvaluation}
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleApprove}
      />

      <RejectEvaluationModal
        evaluation={selectedEvaluation}
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleArchive}
      />

      <OverrideGradeModal
        evaluation={selectedEvaluation}
        open={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        onConfirm={handleOverride}
      />
    </div>
  );
}
