import { useState } from 'react';
import { Calendar, User, FileText, GitBranch, MessageSquare, Users, Activity, Lock, PenTool, Network, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentResponse, DocumentType } from '@/types/documents';
import { VersionHistoryTab } from './VersionHistoryTab';
import { CommentsTab } from './CommentsTab';
import { WorkflowTab } from './WorkflowTab';
import { AccessTab } from './AccessTab';
import { documentsAPI } from '@/lib/api/documents';

interface DocumentDetailDialogProps {
  document: DocumentResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function DocumentDetailDialog({
  document,
  open,
  onOpenChange,
  onUpdate,
}: DocumentDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [downloading, setDownloading] = useState(false);

  const getTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, string> = {
      evaluation: 'bg-indigo-100 text-indigo-800',
      agreement: 'bg-cyan-100 text-cyan-800',
      report: 'bg-emerald-100 text-emerald-800',
      form: 'bg-amber-100 text-amber-800',
      certificate: 'bg-violet-100 text-violet-800',
      memorandum: 'bg-rose-100 text-rose-800',
      other: 'bg-slate-100 text-slate-800',
      pdf: 'bg-red-100 text-red-800',
      docx: 'bg-blue-100 text-blue-800',
      xlsx: 'bg-green-100 text-green-800',
      image: 'bg-purple-100 text-purple-800',
      zip: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      setDownloading(true);
      console.log('📥 [Admin] Downloading document:', document.id);
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{document.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getTypeColor(document.type)}>
                  {document.type}
                </Badge>
                <span className="text-sm text-gray-500 font-mono">
                  v{document.version}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="ml-4"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-xs sm:text-sm">
              <GitBranch className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Versions</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="text-xs sm:text-sm">
              <Activity className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Workflow</span>
            </TabsTrigger>
            <TabsTrigger value="access" className="text-xs sm:text-sm">
              <Lock className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Access</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Document Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Uploaded By
                  </h3>
                  <p className="text-gray-600">
                    {document.owner?.first_name} {document.owner?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{document.owner?.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Upload Date
                  </h3>
                  <p className="text-gray-600">{formatDate(document.created_at)}</p>
                </div>
              </div>

              {document.file_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">File</h3>
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Document
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="versions" className="mt-4">
            <VersionHistoryTab documentId={document.id} />
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsTab documentId={document.id} />
          </TabsContent>

          <TabsContent value="workflow" className="mt-4">
            <WorkflowTab documentId={document.id} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <AccessTab documentId={document.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
