import { useState, useEffect } from 'react';
import { Loader2, Users, User, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { CollaborationInfo } from '@/types/documents';

interface CollaboratorsTabProps {
  documentId: string;
}

export function CollaboratorsTab({ documentId }: CollaboratorsTabProps) {
  const [collaborationInfo, setCollaborationInfo] = useState<CollaborationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborators();
    const interval = setInterval(fetchCollaborators, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [documentId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAPI.getCollaborators(documentId);
      setCollaborationInfo(data);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen: Date | string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (loading && !collaborationInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!collaborationInfo || collaborationInfo.active_users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No active collaborators</p>
        <p className="text-sm text-gray-500 mt-2">
          Users who have accessed this document in the last 5 minutes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">
          Active Collaborators ({collaborationInfo.active_users.length})
        </h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Circle className="h-2 w-2 mr-1 fill-current" />
          Live
        </Badge>
      </div>

      {collaborationInfo.active_users.map((user) => (
        <Card key={user.user_id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: user.user_color }}
                >
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last seen: {formatLastSeen(user.last_seen)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Circle className="h-2 w-2 mr-1 fill-current" />
                  Online
                </Badge>
                {user.cursor_position > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Position: {user.cursor_position}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
