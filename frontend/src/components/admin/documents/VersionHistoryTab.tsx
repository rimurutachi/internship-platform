import { useState, useEffect } from 'react';
import { Loader2, GitBranch, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { DocumentVersion } from '@/types/documents';

interface VersionHistoryTabProps {
  documentId: string;
}

export function VersionHistoryTab({ documentId }: VersionHistoryTabProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAPI.getVersions(documentId);
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
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

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No version history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version, index) => (
        <Card key={version.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono">
                    v{version.version}
                  </Badge>
                  {index === 0 && (
                    <Badge className="bg-green-100 text-green-800">
                      Current
                    </Badge>
                  )}
                </div>

                {version.change_summary && (
                  <p className="text-sm text-gray-600 mb-3">
                    {version.change_summary}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {version.created_by_user?.first_name} {version.created_by_user?.last_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(version.created_at)}
                  </div>
                </div>

                {version.file_url && (
                  <a
                    href={version.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    View File
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
