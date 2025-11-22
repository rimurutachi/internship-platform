import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { DocumentStatus } from '@/types/documents';

interface DocumentStatusManagerProps {
  documentId: string;
  currentStatus: DocumentStatus;
  onStatusUpdate: () => void;
}

export function DocumentStatusManager({
  documentId,
  currentStatus,
  onStatusUpdate,
}: DocumentStatusManagerProps) {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(currentStatus);
  const [updating, setUpdating] = useState(false);

  const statusOptions: { value: DocumentStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'in_review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: 'No Changes',
        description: 'Status is already set to this value',
      });
      return;
    }

    try {
      setUpdating(true);
      await adminDocumentsAPI.updateStatus(documentId, { status: selectedStatus });
      
      toast({
        title: 'Success',
        description: 'Document status updated successfully',
      });
      
      onStatusUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
      setSelectedStatus(currentStatus); // Revert on error
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Document Status
            </label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as DocumentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === currentStatus}
            className="mt-6"
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Update
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Status transitions are validated. Invalid transitions will be rejected.
        </p>
      </CardContent>
    </Card>
  );
}
