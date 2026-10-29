/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import {
  Calendar,
  User,
  FileText,
  GitBranch,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  GraduationCap,
  Eye,
  ShieldCheck,
  Archive,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentResponse, DocumentType } from '@/types/documents';
import { VersionHistoryTab } from './VersionHistoryTab';
import { documentsAPI } from '@/lib/api/documents';

interface DocumentDetailDialogProps {
  document: DocumentResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

/**
 * Intelligent categorization based on document title and type
 */
export function getDocumentCategory(title: string, type: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('moa') || t.includes('memorandum')) {
    return { label: 'MOA (Agreement)', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  }
  if (t.includes('waiver') || t.includes('liability')) {
    return { label: 'Liability Waiver', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  }
  if (t.includes('endorsement')) {
    return { label: 'Endorsement Letter', color: 'bg-purple-100 text-purple-800 border-purple-200' };
  }
  if (t.includes('placement')) {
    return { label: 'OJT Placement Form', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
  if (t.includes('eval')) {
    return { label: 'Evaluation Form', color: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  if (t.includes('template')) {
    return { label: 'Official Template', color: 'bg-teal-100 text-teal-800 border-teal-200' };
  }
  return { label: (type || 'DOCUMENT').toUpperCase(), color: 'bg-slate-100 text-slate-800 border-slate-200' };
}

/**
 * Status badge styling and text
 */
export function getDocumentStatusInfo(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'pre_approved':
      return {
        label: status === 'pre_approved' ? 'Pre-Approved' : 'Approved',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        Icon: CheckCircle2,
      };
    case 'in_review':
      return {
        label: 'In Review',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        Icon: Clock,
      };
    case 'archived':
      return {
        label: 'Archived',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
        Icon: Archive,
      };
    case 'draft':
    default:
      return {
        label: 'Draft',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        Icon: FileText,
      };
  }
}

export function DocumentDetailDialog({
  document,
  open,
  onOpenChange,
  onUpdate,
}: DocumentDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const category = getDocumentCategory(document.title, document.type);
  const statusInfo = getDocumentStatusInfo(document.status);
  const StatusIcon = statusInfo.Icon;

  // Differentiate uploader role
  const isAdvisorUpload = document.owner?.role === 'advisor';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      console.log('📥 [Admin] Downloading document:', document.id);

      // If secure signed url is available directly, trigger it
      if (document.preview_url) {
        window.open(document.preview_url, '_blank');
        return;
      }

      const { url, fileName } = await documentsAPI.getDownloadUrl(document.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName || document.title || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('❌ [Admin] Download error:', error);
      alert(error instanceof Error ? error.message : 'Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  // Handle preview in new tab
  const handlePreview = async () => {
    try {
      setPreviewing(true);
      if (document.preview_url) {
        window.open(document.preview_url, '_blank');
        return;
      }

      const { url } = await documentsAPI.getDownloadUrl(document.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        alert('Document preview URL is currently unavailable. Please download the file instead.');
      }
    } catch (error) {
      console.error('❌ [Admin] Preview error:', error);
      alert('Failed to preview document. You can download the file instead.');
    } finally {
      setPreviewing(false);
    }
  };

  // Determine reviewer display details for Student uploads
  const reviewerName =
    document.reviewer_details?.name ||
    document.internship_details?.advisor_name ||
    'Assigned Course Advisor';
  const reviewerEmail =
    document.reviewer_details?.email ||
    document.internship_details?.advisor_email ||
    'Advisor Reviewer';
  const reviewDate =
    document.reviewer_details?.reviewed_at ||
    (document.status === 'pre_approved' || document.status === 'approved' ? document.updated_at : undefined);
  const reviewerRemarks =
    document.reviewer_details?.remarks ||
    (document.status === 'pre_approved'
      ? 'Pre-approved for company internship deployment'
      : document.status === 'approved'
      ? 'Verified and officially approved for CvSU institutional records'
      : 'Document is currently awaiting review by the assigned advisor.');

  const fileSizeDisplay =
    formatFileSize(document.metadata?.size) ||
    (document.metadata?.file_size ? formatFileSize(document.metadata.file_size) : null);

  const fileFormat =
    document.metadata?.mimeType?.includes('pdf') || document.type === 'pdf'
      ? 'PDF'
      : document.metadata?.mimeType?.includes('word') || document.type === 'docx'
      ? 'DOCX'
      : document.type.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Dialog Header with pr-12 spacing to avoid overlapping the top-right X close button */}
        <DialogHeader className="border-b pb-4 pr-12">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {document.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`font-medium ${category.color}`}>
                  {category.label}
                </Badge>
                <Badge variant="outline" className={`font-medium flex items-center gap-1 ${statusInfo.badgeClass}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="secondary" className="font-mono text-xs">
                  {fileFormat}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                  v{document.version}
                </span>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="self-start sm:self-auto shrink-0 shadow-sm mr-2"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Copy
            </Button>
          </div>
        </DialogHeader>

        {/* 2 Streamlined Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/60">
            <TabsTrigger value="overview" className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4" />
              <span>{isAdvisorUpload ? 'Overview & Template Details' : 'Overview & Approval Trail'}</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-2 font-medium">
              <GitBranch className="h-4 w-4" />
              <span>Version History</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-5 space-y-5">
            {isAdvisorUpload ? (
              /* =========================================================================
                 ADVISOR / INSTITUTIONAL UPLOAD VIEW
                 ========================================================================= */
              <>
                {/* 1. Faculty / Advisor Document Information */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="py-3.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Faculty / Advisor Document Information
                    </CardTitle>
                    <Badge variant="secondary" className="capitalize text-xs font-medium">
                      Faculty Advisor
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5">Uploaded By (Faculty Advisor)</span>
                      <p className="font-semibold text-foreground">
                        {document.owner?.first_name} {document.owner?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{document.owner?.email || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5">Academic Institution</span>
                      <p className="font-medium text-foreground">
                        Cavite State University - Bacoor City Campus
                      </p>
                      <p className="text-xs text-muted-foreground">OJT & Practicum Department</p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Document Classification
                      </span>
                      <p className="font-medium text-foreground">
                        {category.label}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Target Beneficiaries
                      </span>
                      <p className="font-medium text-foreground">
                        All Student Trainees & Host Training Establishments
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Institutional Form & Template Purpose */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="py-3.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Institutional Form & Template Details
                    </CardTitle>
                    <Badge variant="outline" className={`text-xs font-medium ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5">Document Version</span>
                        <p className="font-mono font-semibold text-foreground">v{document.version}</p>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date Uploaded / Published
                        </span>
                        <p className="font-medium text-foreground">{formatDate(document.created_at)}</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-3 border border-border/60 flex items-start gap-2.5">
                      <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
                          Institutional Usage & Distribution Note:
                        </span>
                        <p className="text-sm text-foreground/90">
                          This is an official university template/requirement uploaded by the faculty advisor. Enrolled student interns download, fill out, and submit signed copies of this form for compliance and verification.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* =========================================================================
                 STUDENT INTERN SUBMISSION VIEW
                 ========================================================================= */
              <>
                {/* 1. Student & Internship Context */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="py-3.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Student & Internship Information
                    </CardTitle>
                    <Badge variant="secondary" className="capitalize text-xs font-medium">
                      Student Intern
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5">Uploaded By (Student / Intern)</span>
                      <p className="font-semibold text-foreground">
                        {document.owner?.first_name} {document.owner?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{document.owner?.email || 'N/A'}</p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5">Degree Program</span>
                      <p className="font-medium text-foreground">
                        {document.internship_details?.program_code || 'BSIT'}
                      </p>
                      <p className="text-xs text-muted-foreground">Cavite State University - Bacoor Campus</p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Partner Company / Host Establishment
                      </span>
                      <p className="font-medium text-foreground">
                        {document.internship_details?.company_name || 'Assigned Practicum Site'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        Intern Position & Department
                      </span>
                      <p className="font-medium text-foreground">
                        {document.internship_details?.position || 'OJT Practicum Trainee'}
                        {document.internship_details?.department && ` (${document.internship_details.department})`}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Advisor Review & Verification Trail */}
                <Card className="border border-border/80 shadow-sm">
                  <CardHeader className="py-3.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Advisor Review & Approval Trail
                    </CardTitle>
                    <Badge variant="outline" className={`text-xs font-medium ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5">Reviewing Advisor</span>
                        <p className="font-semibold text-foreground">{reviewerName}</p>
                        <p className="text-xs text-muted-foreground">{reviewerEmail}</p>
                      </div>

                      <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Approval / Review Timestamp
                        </span>
                        <p className="font-medium text-foreground">{formatDate(reviewDate)}</p>
                        <p className="text-xs text-muted-foreground">Compliance verification status recorded</p>
                      </div>
                    </div>

                    <div className="bg-muted/40 rounded-lg p-3 border border-border/60">
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Advisor Remarks / Compliance Feedback:
                      </span>
                      <p className="text-sm text-foreground/90 italic">
                        &ldquo;{reviewerRemarks}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* 3. File Details & Actions Card (Common for all uploads) */}
            <Card className="border border-border/80 shadow-sm">
              <CardHeader className="py-3.5 px-4 bg-muted/30 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  File Specifications & Direct Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground truncate max-w-md">
                    {document.metadata?.originalName || document.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Uploaded: {formatDate(document.created_at)}</span>
                    {fileSizeDisplay && <span>• Size: {fileSizeDisplay}</span>}
                    <span>• Format: {fileFormat}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={previewing}
                    className="flex items-center gap-1.5"
                  >
                    {previewing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Preview Document
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Version History */}
          <TabsContent value="versions" className="mt-5">
            <VersionHistoryTab documentId={document.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
