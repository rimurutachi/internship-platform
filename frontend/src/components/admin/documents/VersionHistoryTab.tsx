/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Loader2, GitBranch, Calendar, User, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { DocumentVersion } from '@/types/documents';

interface VersionHistoryTabProps {
  documentId: string;
}

export function VersionHistoryTab({ documentId }: VersionHistoryTabProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const data = await adminDocumentsAPI.getVersions(documentId);
      console.log('📚 [VersionHistory] Fetched versions:', data);
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (versionId: string, fileName: string | null) => {
    try {
      setDownloading(versionId);
      console.log('📥 [VersionHistory] Downloading version:', versionId);
      
      const result = await adminDocumentsAPI.getVersionDownloadUrl(documentId, versionId);
      
      if (result?.url) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = fileName || `version-${versionId}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ [VersionHistory] Download started');
      } else {
        alert('Could not get download URL for this version');
      }
    } catch (error) {
      console.error('Failed to download version:', error);
      alert('Failed to download this version. The file may no longer be available.');
    } finally {
      setDownloading(null);
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
        <p className="text-gray-600 dark:text-gray-400">No version history available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Upload a new version of this document to see history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => (
        <Card key={version.id} className={version.is_current ? 'border-green-300 dark:border-green-700' : ''}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="font-mono">
                    v{version.version}
                  </Badge>
                  {version.is_current && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Current
                    </Badge>
                  )}
                </div>

                {version.file_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <FileText className="h-4 w-4" />
                    <span>{version.file_name}</span>
                    {version.file_size && (
                      <span className="text-gray-400">({formatFileSize(version.file_size)})</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {version.created_by_user?.first_name} {version.created_by_user?.last_name}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(version.created_at)}
                  </div>
                </div>
              </div>

              {/* Download button */}
              {version.file_path && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadVersion(version.id, version.file_name ?? null)}
                  disabled={downloading === version.id}
                  className="ml-4"
                >
                  {downloading === version.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
