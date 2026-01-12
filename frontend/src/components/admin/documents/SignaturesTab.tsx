import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { adminDocumentsAdvancedAPI } from '@/lib/api/admin-documents-advanced';
import { useToast } from '@/hooks/use-toast';

interface SignaturesTabProps {
  documentId: string;
}

export function SignaturesTab({ documentId }: SignaturesTabProps) {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAdvancedAPI.getSignatures(documentId);
      setSignatures(Array.isArray(data) ? data : data.signatures || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch signatures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    try {
      setSigning(true);
      await adminDocumentsAdvancedAPI.signDocument(documentId, {
        reason: 'Admin approval for compliance',
      });
      toast({
        title: 'Success',
        description: 'Document signed successfully',
      });
      fetchSignatures();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to sign document',
        variant: 'destructive',
      });
    } finally {
      setSigning(false);
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, [documentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800';
      case 'invalid':
        return 'bg-red-100 text-red-800';
      case 'revoked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={fetchSignatures} disabled={loading} variant="outline">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Refresh
        </Button>
        <Button onClick={handleSign} disabled={signing}>
          {signing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Sign Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Digital Signatures</CardTitle>
          <CardDescription>
            {signatures.length} signature{signatures.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length === 0 ? (
            <p className="text-sm text-gray-500">No signatures yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {signatures.map((sig, idx) => (
                <div key={sig.id || idx} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{sig.signer_name || 'Unknown'}</h4>
                      <p className="text-xs text-gray-500">{sig.signer_email}</p>
                    </div>
                    <Badge className={getStatusColor(sig.verification_status || 'valid')}>
                      {sig.verification_status || 'valid'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-medium">Signed:</span>{' '}
                      {new Date(sig.signed_at).toLocaleString()}
                    </p>
                    {sig.reason && (
                      <p>
                        <span className="font-medium">Reason:</span> {sig.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
