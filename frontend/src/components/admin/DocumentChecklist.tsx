'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, AlertCircle, Eye, Send, FileText } from 'lucide-react';
import { DocumentSubmissionStatus, DocumentStatusInfo } from '@/types/internships-enhanced';
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';
import { useToast } from '@/hooks/use-toast';

interface DocumentChecklistProps {
  internshipId: string;
}

export default function DocumentChecklist({ internshipId }: DocumentChecklistProps) {
  const [loading, setLoading] = useState(true);
  const [documentStatus, setDocumentStatus] = useState<DocumentSubmissionStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocumentStatus();
  }, [internshipId]);

  const loadDocumentStatus = async () => {
    try {
      setLoading(true);
      const data = await adminInternshipsEnhancedAPI.getDocumentStatus(internshipId);
      setDocumentStatus(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load document status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (documentType: string) => {
    try {
      await adminInternshipsEnhancedAPI.sendImmediateReminder(internshipId, {
        reminder_type: 'pending_documents',
        notification_channel: 'both',
        custom_message: `Please submit the required document: ${documentType}`
      });

      toast({
        title: 'Reminder Sent',
        description: `Reminder for ${documentType} has been sent successfully`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send reminder',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      submitted: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      missing: 'destructive'
    };

    const labels: Record<string, string> = {
      submitted: 'Submitted',
      pending: 'Pending',
      overdue: 'Overdue',
      missing: 'Missing'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const renderDocumentRow = (doc: DocumentStatusInfo) => (
    <TableRow key={doc.type}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {getStatusIcon(doc.status)}
          <span>{doc.type}</span>
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(doc.status)}</TableCell>
      <TableCell>{doc.submitted_by || '-'}</TableCell>
      <TableCell>
        {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {doc.status === 'submitted' && (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )}
          {(doc.status === 'pending' || doc.status === 'overdue' || doc.status === 'missing') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendReminder(doc.type)}
            >
              <Send className="h-4 w-4 mr-1" />
              Send Reminder
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>Loading document status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documentStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>Failed to load document status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allDocuments = [
    ...(documentStatus?.required_documents || [])
  ];

  const completedCount = allDocuments.filter(d => d.status === 'submitted').length;
  const totalCount = allDocuments.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Document Checklist</CardTitle>
            <CardDescription>
              Track required documents and submission status
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} submitted
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Required Documents */}
          {documentStatus?.required_documents && documentStatus.required_documents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Required Documents</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentStatus.required_documents.map(renderDocumentRow)}
                </TableBody>
              </Table>
            </div>
          )}

          {/* No Documents Message */}
          {(!documentStatus?.required_documents || documentStatus.required_documents.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents available for this internship</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
