/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Loader2, Activity, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { DocumentWorkflow, WorkflowStatus } from '@/types/documents';

interface WorkflowTabProps {
  documentId: string;
  onUpdate: () => void;
}

export function WorkflowTab({ documentId, onUpdate }: WorkflowTabProps) {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<DocumentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchWorkflow();
  }, [documentId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAPI.getWorkflow(documentId);
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowAction = async (action: 'approve' | 'reject' | 'advance') => {
    try {
      setActionLoading(true);
      await adminDocumentsAPI.updateWorkflow(documentId, {
        action,
        comments: comments || undefined,
      });
      
      toast({
        title: 'Success',
        description: `Workflow ${action}d successfully`,
      });
      
      setComments('');
      await fetchWorkflow();
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} workflow`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    const colors: Record<WorkflowStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No workflow history available</p>
      </div>
    );
  }

  const activeWorkflow = workflows[0];

  return (
    <div className="space-y-6">
      {/* Active Workflow */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium mb-1">{activeWorkflow.workflow_type}</h3>
              <Badge className={getStatusColor(activeWorkflow.status)}>
                {activeWorkflow.status.replace('_', ' ')}
              </Badge>
            </div>
            {activeWorkflow.current_stage !== undefined && (
              <div className="text-sm text-gray-600">
                Stage {activeWorkflow.current_stage}
              </div>
            )}
          </div>

          {/* Workflow Actions */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add comments (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleWorkflowAction('approve')}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleWorkflowAction('reject')}
                disabled={actionLoading}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleWorkflowAction('advance')}
                disabled={actionLoading}
                variant="outline"
              >
                Advance Stage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals History */}
      {activeWorkflow.approvals && activeWorkflow.approvals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Approval History</h3>
          {activeWorkflow.approvals.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {approval.approver?.first_name} {approval.approver?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {approval.approver?.email}
                      </p>
                      {approval.comments && (
                        <p className="text-sm text-gray-700 mb-2">
                          {approval.comments}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {approval.approved_at ? formatDate(approval.approved_at) : formatDate(approval.created_at)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      approval.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : approval.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {approval.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
