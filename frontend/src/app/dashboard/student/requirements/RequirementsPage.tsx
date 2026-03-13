'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  Eye,
  Download,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DocumentRequirement,
  getStudentDocumentRequirements,
} from '@/lib/api/document-requirements';

export default function StudentRequirementsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getStudentDocumentRequirements({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.success) {
        setRequirements(response.data);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document requirements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements
  const filteredRequirements = requirements.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get submission status badge
  const getStatusBadge = (requirement: DocumentRequirement) => {
    const status = requirement.submission_status;
    
    switch (status) {
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'revision_requested':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <RotateCcw className="h-3 w-3 mr-1" />
            Revision Needed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Upload className="h-3 w-3 mr-1" />
            Not Submitted
          </Badge>
        );
    }
  };

  // Calculate stats
  const stats = {
    total: requirements.length,
    completed: requirements.filter((r) => r.submission_status === 'approved').length,
    pending: requirements.filter((r) => 
      r.submission_status === 'pending' || 
      r.submission_status === 'not_submitted' ||
      !r.submission_status
    ).length,
    overdue: requirements.filter((r) => r.is_overdue).length,
  };

  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <StudentSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {isMobile ? (
          <MobileHeader title="Required Documents" />
        ) : (
          <StudentHeader />
        )}

        {/* Content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-6",
          isMobile && "pb-20"
        )}>
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Required Documents</h1>
            <p className="text-gray-600 mt-1">
              Submit and track your required document submissions
            </p>
          </div>

          {/* Progress Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Your Progress
                  </h3>
                  <div className="flex items-center gap-4">
                    <Progress value={completionPercentage} className="flex-1 h-3" />
                    <span className="text-lg font-bold text-blue-600">
                      {completionPercentage}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {stats.completed} of {stats.total} requirements completed
                  </p>
                </div>
                
                <div className="flex gap-4 text-center">
                  <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  {stats.overdue > 0 && (
                    <div className="px-4 py-2 bg-white rounded-lg shadow-sm">
                      <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                      <p className="text-xs text-gray-500">Overdue</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'pending' | 'completed') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requirements List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredRequirements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {statusFilter === 'pending' 
                    ? 'No pending requirements!' 
                    : 'No document requirements'}
                </h3>
                <p className="text-gray-500 text-center">
                  {statusFilter === 'pending'
                    ? "You're all caught up. Check back later for new requirements."
                    : 'Your advisor has not assigned any document requirements yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequirements.map((requirement) => (
                <Card 
                  key={requirement.id} 
                  className={cn(
                    "hover:shadow-md transition-shadow cursor-pointer",
                    requirement.is_overdue && requirement.submission_status !== 'approved' 
                      && "border-red-200 bg-red-50/50"
                  )}
                  onClick={() => window.location.href = `/dashboard/student/requirements/${requirement.id}`}
                >
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {requirement.title}
                          </h3>
                          {requirement.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        
                        {requirement.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {requirement.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {requirement.due_date && (
                            <div className={cn(
                              "flex items-center gap-1",
                              requirement.is_overdue && "text-red-600"
                            )}>
                              <Calendar className="h-4 w-4" />
                              <span>
                                Due: {new Date(requirement.due_date).toLocaleDateString()}
                              </span>
                              {requirement.is_overdue && requirement.submission_status !== 'approved' && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          )}
                          {requirement.my_submission && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Version {requirement.my_submission.version}</span>
                            </div>
                          )}
                        </div>
                        
                        {requirement.my_submission?.feedback && (
                          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
                            <span className="font-medium">Feedback: </span>
                            <span className="text-gray-600">{requirement.my_submission.feedback}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(requirement)}
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Mobile Navigation */}
        {isMobile && <BottomNavigation type="student" />}
      </div>
    </div>
  );
}
