'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { createSupabaseClient } from '@/lib/supabase';
import {
  DocumentRequirement,
  DocumentSubmission,
  getDocumentRequirement,
  getRequirementSubmissions,
  reviewSubmission,
  getAdvisorSubmissionSignedUrl,
} from '@/lib/api/document-requirements';

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const requirementId = params.id as string;

  // State
  const [requirement, setRequirement] = useState<DocumentRequirement | null>(null);
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  // Review dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'revision_requested'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper function to try multiple path variations and return a signed URL
  const tryGenerateSignedUrl = async (
    supabase: ReturnType<typeof createSupabaseClient>,
    originalPath: string
  ): Promise<string | null> => {
    // Generate all possible path variations to try
    const pathsToTry: string[] = [];
    
    // Decode URL-encoded characters in the path
    let decodedPath = originalPath;
    try {
      decodedPath = decodeURIComponent(originalPath);
    } catch {
      // If decoding fails, use original
    }
    
    // 1. Original path as-is
    pathsToTry.push(decodedPath);
    
    // 2. Without document-submissions prefix
    if (decodedPath.startsWith('document-submissions/')) {
      const withoutPrefix = decodedPath.replace('document-submissions/', '');
      pathsToTry.push(withoutPrefix);
      
      // 3. Swap the first two path components (student_id/requirement_id -> requirement_id/student_id)
      const parts = withoutPrefix.split('/');
      if (parts.length >= 3) {
        // Swap first two parts: [student_id, requirement_id, ...rest] -> [requirement_id, student_id, ...rest]
        const swapped = [parts[1], parts[0], ...parts.slice(2)].join('/');
        pathsToTry.push(swapped);
      }
    }
    
    // 4. Try path segments extraction for various structures
    const segments = decodedPath.split('/').filter(s => s.length > 0);
    if (segments.length >= 3) {
      // If first segment is 'document-submissions', remove it and try swapped order
      if (segments[0] === 'document-submissions') {
        const withoutPrefix = segments.slice(1);
        if (withoutPrefix.length >= 3) {
          // Try requirement_id/student_id/file structure
          const swapped = [withoutPrefix[1], withoutPrefix[0], ...withoutPrefix.slice(2)].join('/');
          if (!pathsToTry.includes(swapped)) {
            pathsToTry.push(swapped);
          }
        }
      }
    }
    
    // Try each path variation
    for (const pathToTry of pathsToTry) {
      console.log('🔄 Trying path:', pathToTry);
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(pathToTry, 3600);
        
        if (!error && data) {
          console.log('✅ Success with path:', pathToTry);
          return data.signedUrl;
        }
        
        if (error && !error.message.includes('not found')) {
          console.error('❌ Non-recoverable error:', error.message);
        }
      } catch (e) {
        console.error('❌ Exception trying path:', pathToTry, e);
      }
    }
    
    console.error('❌ All path variations failed for:', originalPath);
    return null;
  };

  // Generate signed URLs for file paths
  const generateFileUrls = async (submissions: DocumentSubmission[]) => {
    const supabase = createSupabaseClient();
    const urls: Record<string, string> = {};

    console.log('🔍 Generating signed URLs for', submissions.length, 'submissions');

    for (const submission of submissions) {
      if (submission.file_url) {
        console.log(`📁 Processing submission ${submission.id}:`, submission.file_url);
        
        // Check if it's already a signed URL (old data)
        if (submission.file_url.includes('supabase.co/storage/v1/object/sign/')) {
          console.log('✅ Already a signed URL, using as-is');
          urls[submission.id] = submission.file_url;
          continue;
        }

        let signedUrl: string | null = null;

        // Check if it's a public URL - extract path and try variations
        if (submission.file_url.startsWith('http')) {
          console.log('⚠️ HTTP URL detected, attempting to extract path');
          try {
            const url = new URL(submission.file_url);
            // Handle both /object/public/documents/ and /object/sign/documents/ patterns
            const pathMatch = url.pathname.match(/\/(?:object\/(?:public|sign)\/)?documents\/(.+)$/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              console.log('📂 Extracted path:', filePath);
              
              signedUrl = await tryGenerateSignedUrl(supabase, filePath);
            } else {
              console.error('❌ Could not extract path from URL');
            }
          } catch (e) {
            console.error('❌ Error parsing URL:', e);
          }
        } else {
          // It's a file path - try variations
          signedUrl = await tryGenerateSignedUrl(supabase, submission.file_url);
        }

        // If direct approach worked, use it
        if (signedUrl) {
          urls[submission.id] = signedUrl;
          continue;
        }

        // Fallback: Use backend API to generate signed URL (bypasses RLS)
        console.log('🔄 Trying backend API fallback for submission:', submission.id);
        try {
          const response = await getAdvisorSubmissionSignedUrl(submission.id);
          if (response.success && response.data?.signedUrl) {
            console.log('✅ Backend API generated signed URL successfully');
            urls[submission.id] = response.data.signedUrl;
          } else {
            console.error('❌ Backend API failed to generate signed URL');
          }
        } catch (apiError) {
          console.error('❌ Backend API error:', apiError);
        }
      }
    }

    console.log('📊 Generated', Object.keys(urls).length, 'signed URLs out of', submissions.length, 'submissions');
    setFileUrls(urls);
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [reqResponse, subResponse] = await Promise.all([
        getDocumentRequirement(requirementId),
        getRequirementSubmissions(requirementId, {
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
      ]);

      if (reqResponse.success && reqResponse.data) {
        setRequirement(reqResponse.data);
      }

      if (subResponse.success) {
        setSubmissions(subResponse.data);
        // Generate signed URLs for all submissions
        await generateFileUrls(subResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load requirement details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [requirementId, statusFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle review submission
  const handleReview = async () => {
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      const response = await reviewSubmission(selectedSubmission.id, {
        status: reviewStatus,
        feedback: reviewNotes || undefined,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Submission ${reviewStatus.replace('_', ' ')} successfully`,
        });
        setShowReviewDialog(false);
        setSelectedSubmission(null);
        setReviewNotes('');
        fetchData();
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to review submission',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open review dialog
  const openReviewDialog = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setReviewStatus('approved');
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'revision_requested':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Revision Requested</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    revision: submissions.filter((s) => s.status === 'revision_requested').length,
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Requirement not found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <AdvisorSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {isMobile ? (
          <MobileHeader title="Requirement Details" />
        ) : (
          <AdvisorHeader />
        )}

        {/* Content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-6",
          isMobile && "pb-20"
        )}>
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requirements
          </Button>

          {/* Requirement Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{requirement.title}</CardTitle>
                    {requirement.is_mandatory && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                    {requirement.status === 'archived' && (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {requirement.description || 'No description provided'}
                  </CardDescription>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {requirement.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(requirement.due_date).toLocaleDateString()}</span>
                      {new Date(requirement.due_date) < new Date() && (
                        <Badge variant="destructive" className="ml-1">Overdue</Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>
                      {requirement.target_audience === 'all_students'
                        ? 'All students'
                        : requirement.target_audience === 'specific_internship'
                        ? 'Specific internships'
                        : 'Specific students'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.revision}</p>
                <p className="text-sm text-gray-500">Revision</p>
              </CardContent>
            </Card>
          </div>

          {/* Submissions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <CardTitle>Submissions</CardTitle>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Submissions</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revision_requested">Revision Requested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">
                                {submission.student?.first_name} {submission.student?.last_name}
                              </span>
                            </div>
                            {getStatusBadge(submission.status)}
                            {submission.version > 1 && (
                              <Badge variant="outline">v{submission.version}</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <FileText className="h-4 w-4" />
                            <span>{submission.file_name}</span>
                            <span className="text-gray-300">•</span>
                            <span>{formatFileSize(submission.file_size)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>
                              Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {submission.feedback && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                              <MessageSquare className="h-4 w-4 inline mr-1" />
                              <span className="text-gray-600">{submission.feedback}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!fileUrls[submission.id]}
                            asChild={!!fileUrls[submission.id]}
                          >
                            {fileUrls[submission.id] ? (
                              <a href={fileUrls[submission.id]} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!fileUrls[submission.id]}
                            asChild={!!fileUrls[submission.id]}
                          >
                            {fileUrls[submission.id] ? (
                              <a href={fileUrls[submission.id]} download>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                          
                          {submission.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => openReviewDialog(submission)}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Mobile Navigation */}
        {isMobile && <BottomNavigation type="advisor" />}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Review the submission from {selectedSubmission?.student?.first_name}{' '}
              {selectedSubmission?.student?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={reviewStatus === 'approved' ? 'default' : 'outline'}
                  onClick={() => setReviewStatus('approved')}
                  className={cn(
                    reviewStatus === 'approved' && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant={reviewStatus === 'revision_requested' ? 'default' : 'outline'}
                  onClick={() => setReviewStatus('revision_requested')}
                  className={cn(
                    reviewStatus === 'revision_requested' && 'bg-orange-600 hover:bg-orange-700'
                  )}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Revise
                </Button>
                <Button
                  variant={reviewStatus === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setReviewStatus('rejected')}
                  className={cn(
                    reviewStatus === 'rejected' && 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="review-notes">
                Notes {reviewStatus !== 'approved' && '(recommended for non-approvals)'}
              </Label>
              <Textarea
                id="review-notes"
                placeholder="Add feedback for the student..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReview} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
