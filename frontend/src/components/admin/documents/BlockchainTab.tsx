import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminDocumentsAdvancedAPI } from '@/lib/api/admin-documents-advanced';
import { useToast } from '@/hooks/use-toast';

interface BlockchainTabProps {
  documentId: string;
}

export function BlockchainTab({ documentId }: BlockchainTabProps) {
  const { toast } = useToast();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState<any>(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAdvancedAPI.getLedger(documentId);
      setLedger(Array.isArray(data) ? data : data.ledger || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch ledger',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const result = await adminDocumentsAdvancedAPI.verifyDocument(documentId);
      setIntegrity(result);
      toast({
        title: 'Verified',
        description: result.isValid ? '✅ Document blockchain is valid' : '❌ Integrity check failed',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Verification failed',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [documentId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={fetchLedger} disabled={loading} variant="outline">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Refresh Ledger
        </Button>
        <Button onClick={handleVerify} disabled={verifying}>
          {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Verify Integrity
        </Button>
      </div>

      {integrity && (
        <Alert className={integrity.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {integrity.isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={integrity.isValid ? 'text-green-800' : 'text-red-800'}>
            {integrity.isValid ? 'Document blockchain is intact' : 'Blockchain integrity verification failed'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Blockchain Ledger</CardTitle>
          <CardDescription>
            {ledger.length} entries recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-gray-500">No blockchain entries yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ledger.map((entry, idx) => (
                <div key={entry.id || idx} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-gray-600">Block #{idx}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium">Hash:</span>
                      <code className="ml-2 font-mono bg-white p-1 rounded truncate">
                        {entry.block_hash?.substring(0, 32)}...
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Previous:</span>
                      <code className="ml-2 font-mono bg-white p-1 rounded truncate">
                        {entry.previous_hash?.substring(0, 32)}...
                      </code>
                    </div>
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
