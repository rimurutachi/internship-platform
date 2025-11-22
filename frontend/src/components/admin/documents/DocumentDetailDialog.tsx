import { useState } from 'react';
import { X, Calendar, User, FileText, GitBranch, MessageSquare, Users, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DocumentResponse, DocumentStatus, DocumentType } from '@/types/documents';
import { VersionHistoryTab } from './VersionHistoryTab';
import { CommentsTab } from './CommentsTab';
import { WorkflowTab } from './WorkflowTab';
import { CollaboratorsTab } from './CollaboratorsTab';
import { DocumentStatusManager } from './DocumentStatusManager';

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

  const getStatusColor = (status: DocumentStatus) => {
    const colors: Record<DocumentStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      published: 'bg-purple-100 text-purple-800',
      archived: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: DocumentType) => {
    const colors: Record<DocumentType, string> = {
      evaluation: 'bg-indigo-100 text-indigo-800',
      agreement: 'bg-cyan-100 text-cyan-800',
      report: 'bg-emerald-100 text-emerald-800',
      form: 'bg-amber-100 text-amber-800',
      certificate: 'bg-violet-100 text-violet-800',
      memorandum: 'bg-rose-100 text-rose-800',
      other: 'bg-slate-100 text-slate-800',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{document.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getTypeColor(document.type)}>
                  {document.type}
                </Badge>
                <Badge className={getStatusColor(document.status)}>
                  {document.status.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-gray-500 font-mono">
                  v{document.version}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="versions">
              <GitBranch className="h-4 w-4 mr-2" />
              Versions ({document.versions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments ({document.comments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="workflow">
              <Activity className="h-4 w-4 mr-2" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            {/* Status Manager */}
            <DocumentStatusManager
              documentId={document.id}
              currentStatus={document.status}
              onStatusUpdate={onUpdate}
            />

            {/* Document Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">
                  {document.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Owner
                  </h3>
                  <p className="text-gray-600">
                    {document.owner?.first_name} {document.owner?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{document.owner?.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created
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

              {document.metadata && Object.keys(document.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(document.metadata, null, 2)}
                  </pre>
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

          <TabsContent value="collaborators" className="mt-4">
            <CollaboratorsTab documentId={document.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
