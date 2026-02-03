'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Calendar,
  AlertCircle,
  Eye,
  History,
  File,
  Trash2,
} from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase';
import {
  DocumentRequirement,
  DocumentSubmission,
  getStudentDocumentRequirement,
  getSubmissionHistory,
  submitDocument,
  resubmitDocument,
} from '@/lib/api/document-requirements';

export default function StudentRequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const requirementId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [requirement, setRequirement] = useState<DocumentRequirement | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [reqResponse, historyResponse] = await Promise.all([
        getStudentDocumentRequirement(requirementId),
        getSubmissionHistory(requirementId),
      ]);

      if (reqResponse.success && reqResponse.data) {
        setRequirement(reqResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setSubmissionHistory(historyResponse.data);
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
  }, [requirementId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setShowConfirmDialog(true);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !requirement) return;

    try {
      setUploading(true);
      setShowConfirmDialog(false);

      // Upload to Supabase Storage
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `document-submissions/${user.id}/${requirementId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 31536000); // 1 year in seconds

      if (urlError || !urlData) {
        throw new Error('Failed to generate file URL');
      }

      // Submit or resubmit based on current status
      const submissionData = {
        file_url: urlData.signedUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
      };

      let response;
      if (requirement.submission_status === 'revision_requested' && requirement.my_submission) {
        response = await resubmitDocument(requirement.my_submission.id, submissionData);
      } else {
        response = await submitDocument(requirementId, submissionData);
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Document submitted successfully',
        });
        setSelectedFile(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
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
            Revision Requested
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

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine if submission is allowed
  const canSubmit = () => {
    if (!requirement) return false;
    const status = requirement.submission_status;
    
    // Can submit if: not submitted, rejected, or revision requested
    return !status || status === 'not_submitted' || status === 'rejected' || status === 'revision_requested';
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
      {!isMobile && <StudentSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {isMobile ? (
          <MobileHeader title="Requirement Details" />
        ) : (
          <StudentHeader />
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

          {/* Requirement Details */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{requirement.title}</CardTitle>
                    {requirement.is_mandatory && (
                      <Badge variant="destructive">Required</Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {requirement.description || 'No description provided'}
                  </CardDescription>
                </div>
                
                {getStatusBadge(requirement.submission_status || 'not_submitted')}
              </div>
              
              {requirement.due_date && (
                <div className={cn(
                  "flex items-center gap-2 mt-4 text-sm",
                  requirement.is_overdue ? "text-red-600" : "text-gray-500"
                )}>
                  <Calendar className="h-4 w-4" />
                  <span>Due: {new Date(requirement.due_date).toLocaleDateString()}</span>
                  {requirement.is_overdue && requirement.submission_status !== 'approved' && (
                    <Badge variant="destructive">Overdue</Badge>
                  )}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Current Submission */}
          {requirement.my_submission && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Current Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{requirement.my_submission.file_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(requirement.my_submission.file_size)} • 
                        Version {requirement.my_submission.version} • 
                        Submitted {new Date(requirement.my_submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={requirement.my_submission.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={requirement.my_submission.file_url} download>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
                
                {requirement.my_submission.feedback && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Advisor Feedback:
                    </p>
                    <p className="text-sm text-blue-700">
                      {requirement.my_submission.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upload Section */}
          {canSubmit() && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {requirement.submission_status === 'revision_requested' 
                    ? 'Resubmit Document' 
                    : 'Submit Document'}
                </CardTitle>
                <CardDescription>
                  {requirement.submission_status === 'revision_requested'
                    ? 'Please address the feedback and upload a revised version.'
                    : 'Upload your document to submit for this requirement.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-primary/5",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG (max 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission History */}
          {submissionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Submission History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissionHistory.map((submission, index) => (
                    <div
                      key={submission.id}
                      className={cn(
                        "flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg",
                        index === 0 ? "bg-blue-50" : "bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <File className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{submission.file_name}</p>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Version {submission.version} • 
                            {formatFileSize(submission.file_size)} • 
                            {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(submission.status)}
                        <Button variant="ghost" size="sm" asChild>
                          <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Mobile Navigation */}
        {isMobile && <BottomNavigation type="student" />}
      </div>

      {/* Confirm Upload Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit &quot;{selectedFile?.name}&quot; for this requirement?
              {requirement.submission_status === 'revision_requested' && (
                <span className="block mt-2 text-orange-600">
                  This will create a new version replacing your previous submission.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFile(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
