import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { createSupabaseClient } from '@/lib/supabase';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
} from 'lucide-react';

interface VerificationItem {
  id: string;
  signature_id: string;
  document_id: string;
  document_name: string;
  signer_name: string;
  signer_email: string;
  status: 'pending' | 'in_progress' | 'verified' | 'rejected' | 'expired';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  assigned_at?: string;
  due_date: string;
  scanned_file_url?: string;
  digital_signature_data?: string;
  created_at: string;
}

export function SignatureVerificationQueue() {
  const { toast } = useToast();
  const supabase = createSupabaseClient();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load verification queue
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      console.log('🔵 [VerificationQueue] Loading queue');
      setIsLoading(true);

      const { data, error } = await supabase
        .from('signature_verification_queue')
        .select(
          `
          id,
          signature_id,
          document_id,
          status,
          priority,
          assigned_to,
          assigned_at,
          due_date,
          created_at,
          document_signatures!inner(
            id,
            signer_id,
            scanned_file_url,
            signature_data,
            certificate_data
          ),
          documents!inner(
            id,
            name
          ),
          users!inner(
            first_name,
            last_name,
            email
          )
        `
        )
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('✅ [VerificationQueue] Queue loaded:', data?.length || 0, 'items');

      const formattedItems: VerificationItem[] = (data || []).map((item: any) => ({
        id: item.id,
        signature_id: item.signature_id,
        document_id: item.document_id,
        document_name: item.documents?.name || 'Unknown',
        signer_name: `${item.users?.first_name} ${item.users?.last_name}`,
        signer_email: item.users?.email || 'unknown',
        status: item.status,
        priority: item.priority,
        assigned_to: item.assigned_to,
        assigned_at: item.assigned_at,
        due_date: item.due_date,
        scanned_file_url: item.document_signatures?.[0]?.scanned_file_url,
        digital_signature_data: item.document_signatures?.[0]?.signature_data,
        created_at: item.created_at,
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('❌ [VerificationQueue] Load error:', error);
      toast({
        title: 'Failed to load queue',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (item: VerificationItem) => {
    try {
      setIsSubmitting(true);
      console.log('✅ [VerificationQueue] Approving:', item.signature_id);

      // Update signature verification status
      const { error: sigError } = await supabase
        .from('document_signatures')
        .update({
          physical_verification_status: 'verified',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes,
        })
        .eq('id', item.signature_id);

      if (sigError) throw sigError;

      // Update queue status
      const { error: queueError } = await supabase
        .from('signature_verification_queue')
        .update({
          status: 'verified',
        })
        .eq('id', item.id);

      if (queueError) throw queueError;

      // Create verification attempt record
      await supabase.from('signature_verification_attempts').insert({
        signature_id: item.signature_id,
        document_id: item.document_id,
        verified_by: (await supabase.auth.getUser()).data.user?.id,
        verification_result: 'approved',
        verification_reason: `Admin verified scanned document. ${verificationNotes}`,
      });

      console.log('✅ [VerificationQueue] Signature approved');

      toast({
        title: 'Signature verified',
        description: `${item.signer_name}'s signature has been approved`,
      });

      setIsComparisonOpen(false);
      setVerificationNotes('');
      setSelectedItem(null);
      loadQueue();
    } catch (error) {
      console.error('❌ [VerificationQueue] Approval error:', error);
      toast({
        title: 'Failed to approve',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (item: VerificationItem) => {
    try {
      setIsSubmitting(true);
      console.log('❌ [VerificationQueue] Rejecting:', item.signature_id);

      // Update signature verification status
      const { error: sigError } = await supabase
        .from('document_signatures')
        .update({
          physical_verification_status: 'rejected',
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
          verification_notes: verificationNotes,
        })
        .eq('id', item.signature_id);

      if (sigError) throw sigError;

      // Update queue status
      const { error: queueError } = await supabase
        .from('signature_verification_queue')
        .update({
          status: 'rejected',
        })
        .eq('id', item.id);

      if (queueError) throw queueError;

      // Create verification attempt record
      await supabase.from('signature_verification_attempts').insert({
        signature_id: item.signature_id,
        document_id: item.document_id,
        verified_by: (await supabase.auth.getUser()).data.user?.id,
        verification_result: 'rejected',
        verification_reason: `Admin rejected scanned document. ${verificationNotes}`,
      });

      console.log('✅ [VerificationQueue] Signature rejected');

      toast({
        title: 'Signature rejected',
        description: `${item.signer_name}'s signature has been rejected`,
      });

      setIsComparisonOpen(false);
      setVerificationNotes('');
      setSelectedItem(null);
      loadQueue();
    } catch (error) {
      console.error('❌ [VerificationQueue] Rejection error:', error);
      toast({
        title: 'Failed to reject',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
      in_progress: {
        color: 'bg-blue-100 text-blue-800',
        icon: <AlertCircle className="h-4 w-4" />,
      },
      verified: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> },
      expired: { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-4 w-4" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[priority] || colors.low;
  };

  const isDeadlineApproaching = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue < 24 && hoursUntilDue > 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signature Verification Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading queue...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Signature Verification Queue
          </CardTitle>
          <CardDescription>
            {items.length} document{items.length !== 1 ? 's' : ''} awaiting verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No documents in verification queue</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{item.document_name}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <User className="h-4 w-4" />
                        <span>{item.signer_name}</span>
                        <span className="text-xs">({item.signer_email})</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className={isDeadlineApproaching(item.due_date) ? 'text-orange-600 font-medium' : ''}>
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {getStatusBadge(item.status)}
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority.toUpperCase()} PRIORITY
                        </Badge>
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <Button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsComparisonOpen(true);
                        }}
                        className="whitespace-nowrap"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Dialog */}
      <Dialog open={isComparisonOpen} onOpenChange={setIsComparisonOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Signature Verification</DialogTitle>
            <DialogDescription>
              Compare the scanned original with the digital signature
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
                <p className="font-medium">{selectedItem.document_name}</p>
                <p className="text-sm text-slate-600">
                  Signed by: {selectedItem.signer_name} ({selectedItem.signer_email})
                </p>
                <p className="text-sm text-slate-600">
                  Due: {new Date(selectedItem.due_date).toLocaleDateString()}
                </p>
              </div>

              {/* Scanned Document Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Scanned Original</h4>
                {selectedItem.scanned_file_url ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={selectedItem.scanned_file_url}
                      alt="Scanned document"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No scanned document uploaded</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Verification Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Notes</label>
                <Textarea
                  placeholder="Add notes about the verification process..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              </div>

              {/* Alert for Requirements */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Verification Checklist:</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>Verify scanned document matches the digital signature</li>
                    <li>Check all signatures are present and clear</li>
                    <li>Ensure document integrity (no tampering)</li>
                    <li>Confirm signer identity if needed</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsComparisonOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleReject(selectedItem)}
              disabled={isSubmitting}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedItem && handleApprove(selectedItem)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
