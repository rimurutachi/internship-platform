import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminDocumentsAdvancedAPI } from '@/lib/api/admin-documents-advanced';
import { useToast } from '@/hooks/use-toast';

interface CollaborationTabProps {
  documentId: string;
}

export function CollaborationTab({ documentId }: CollaborationTabProps) {
  const { toast } = useToast();
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [stackStatus, setStackStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, changesData, stackData] = await Promise.all([
        adminDocumentsAdvancedAPI.getActiveUsers(documentId),
        adminDocumentsAdvancedAPI.getChanges(documentId, 20),
        adminDocumentsAdvancedAPI.getStackStatus(documentId),
      ]);

      setActiveUsers(Array.isArray(usersData) ? usersData : usersData.users || []);
      setChanges(Array.isArray(changesData) ? changesData : changesData.changes || []);
      setStackStatus(stackData);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch collaboration data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [documentId]);

  return (
    <div className="space-y-4">
      <Button onClick={fetchData} disabled={loading} variant="outline">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Refresh
      </Button>

      {/* Active Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Collaborators</CardTitle>
          <CardDescription>
            {activeUsers.length} user{activeUsers.length !== 1 ? 's' : ''} currently editing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No users currently editing</p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user, idx) => (
                <div key={user.user_id || idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: user.color || '#gray' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.user?.first_name} {user.user?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{user.user?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Changes</CardTitle>
          <CardDescription>
            Latest {changes.length} document modifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <p className="text-sm text-gray-500">No changes recorded</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {changes.map((change, idx) => (
                <div key={change.id || idx} className="border-l-2 border-blue-300 pl-3 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{change.operation}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(change.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-50 px-2 py-1 rounded">
                      Index: {change.index}
                    </span>
                  </div>
                  {change.content && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {change.content.substring(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Undo/Redo Status */}
      {stackStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Stack Status</CardTitle>
            <CardDescription>Undo/Redo capability indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">Can Undo</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stackStatus.canUndo ? '✓' : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stackStatus.undoCount} action{stackStatus.undoCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">Can Redo</p>
                <p className="text-2xl font-bold text-green-600">
                  {stackStatus.canRedo ? '✓' : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stackStatus.redoCount} action{stackStatus.redoCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
