/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminDocumentsAdvancedAPI } from '@/lib/api/admin-documents-advanced';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccessTabProps {
  documentId: string;
}

export function AccessTab({ documentId }: AccessTabProps) {
  const { toast } = useToast();
  const [access, setAccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [granting, setGranting] = useState(false);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantLevel, setGrantLevel] = useState<'view' | 'comment' | 'edit' | 'admin'>('view');

  const fetchAccess = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAdvancedAPI.listAccess(documentId);
      setAccess(Array.isArray(data) ? data : data.access || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch access list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantUserId.trim()) {
      toast({
        title: 'Error',
        description: 'User ID is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGranting(true);
      await adminDocumentsAdvancedAPI.grantAccess(documentId, {
        user_id: grantUserId,
        permission_level: grantLevel,
      });
      toast({
        title: 'Success',
        description: `Access granted (${grantLevel})`,
      });
      setGrantDialogOpen(false);
      setGrantUserId('');
      setGrantLevel('view');
      fetchAccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to grant access',
        variant: 'destructive',
      });
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (accessId: string) => {
    if (!confirm('Revoke this access?')) return;

    try {
      await adminDocumentsAdvancedAPI.revokeAccess(documentId, accessId);
      toast({
        title: 'Success',
        description: 'Access revoked',
      });
      fetchAccess();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to revoke access',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [documentId]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'edit':
        return 'bg-blue-100 text-blue-800';
      case 'comment':
        return 'bg-yellow-100 text-yellow-800';
      case 'view':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={fetchAccess} disabled={loading} variant="outline">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Refresh
        </Button>
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Document Access</DialogTitle>
              <DialogDescription>
                Add a user and select their permission level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  placeholder="Enter user ID"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="level">Permission Level</Label>
                <Select value={grantLevel} onValueChange={(v: any) => setGrantLevel(v)}>
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGrant} disabled={granting} className="w-full">
                {granting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Grant Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Access</CardTitle>
          <CardDescription>
            {access.length} user{access.length !== 1 ? 's' : ''} with access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {access.length === 0 ? (
            <p className="text-sm text-gray-500">No access granted yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {access.map((a, idx) => (
                <div key={a.id || idx} className="border rounded p-3 bg-gray-50 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">
                      {a.users?.first_name} {a.users?.last_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {a.users?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getLevelColor(a.permission_level)}>
                      {a.permission_level}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
