'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Upload, Download, Share2, Trash2, Eye, File, FileText, Archive, History, Edit, Loader2, AlertCircle, CheckCircle, Search, UserPlus, X, Users } from 'lucide-react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { documentsAPI } from '@/lib/api/documents';
import { connectForUpdates } from '@/lib/documentSocket';
import { useUser } from '@/hooks/use-user';
import type { DocumentWithDetails } from '@/types/documents';
import type { Socket } from 'socket.io-client';

interface DocumentsPageProps {
  sidebar: ReactNode;
  header: ReactNode;
  userType: 'student' | 'advisor' | 'supervisor';
  defaultUploadType?: string;
}

export function DocumentsPage({ sidebar, header, userType, defaultUploadType = 'report' }: DocumentsPageProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Real-time state
  const [wsConnected, setWsConnected] = useState(false);
  const [realtimeUpdate, setRealtimeUpdate] = useState<string | null>(null);

  // View document state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentWithDetails | null>(null);

  // Edit document state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentWithDetails | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editing, setEditing] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<DocumentWithDetails | null>(null);

  // Version history state
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<DocumentWithDetails | null>(null);
  const [versions, setVersions] = useState<Array<{
    id: string;
    version: string;
    file_path?: string | null;
    file_name?: string | null;
    file_size?: number | null;
    change_summary?: string;
    created_at: string;
    is_current?: boolean;
    created_by_user?: { first_name: string; last_name: string };
  }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);
  
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [shareSearchResults, setShareSearchResults] = useState<Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  }>>([]);
  const [shareSearching, setShareSearching] = useState(false);
  const [selectedShareUser, setSelectedShareUser] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  } | null>(null);
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit' | 'admin'>('view');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [documentAccessList, setDocumentAccessList] = useState<Array<{
    id: string;
    user_id: string;
    permission_level: string;
    users?: { first_name: string; last_name: string; email: string };
  }>>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    let socket: Socket | null = null;

    const setupSocket = async () => {
      try {
        socket = await connectForUpdates();

        socket.on('connect', () => {
          console.log('✅ [DocumentSocket] Connected successfully with authentication');
          setWsConnected(true);
        });

        socket.on('disconnect', () => {
          console.warn('⚠️ [DocumentSocket] Disconnected');
          setWsConnected(false);
        });

        socket.on('document:update', (data: any) => {
          setRealtimeUpdate(data.message || 'Document updated');
          loadDocuments();
          setTimeout(() => setRealtimeUpdate(null), 3000);
        });

        socket.on('document:error', (error: any) => {
          console.error('[WebSocket] Error:', error);
        });
      } catch (error) {
        console.error('❌ [DocumentSocket] Failed to connect:', error);
      }
    };

    setupSocket();

    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [user?.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentsAPI.getDocuments();
      setDocuments(response.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) return 'File size must be less than 50MB';
    if (!allowedTypes.includes(file.type)) return 'File type not supported. Please upload PDF, DOCX, images, or ZIP files.';
    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    setUploadError(null);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle upload - Creates document metadata then uploads actual file to storage
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Please select a file and provide a title');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(10);
      
      console.log('📤 [Upload] Starting upload for:', uploadFile.name);

      // Determine file type from extension
      const fileExtension = uploadFile.name.split('.').pop()?.toLowerCase() || 'other';
      const typeMap: Record<string, string> = {
        'pdf': 'pdf',
        'doc': 'docx',
        'docx': 'docx',
        'xls': 'xlsx',
        'xlsx': 'xlsx',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'zip': 'zip'
      };
      const documentType = typeMap[fileExtension] || 'other';

      setUploadProgress(20);

      // Step 1: Create document metadata first
      console.log('📝 [Upload] Creating document metadata...');
      const newDocument = await documentsAPI.createDocument({
        title: uploadTitle.trim(),
        type: documentType,
        content: { 
          fileName: uploadFile.name, 
          fileSize: uploadFile.size,
          mimeType: uploadFile.type 
        },
        metadata: { 
          originalName: uploadFile.name,
          mimeType: uploadFile.type,
          size: uploadFile.size,
          uploadedAt: new Date().toISOString()
        }
      });

      console.log('✅ [Upload] Document created:', newDocument.id);
      setUploadProgress(40);

      // Step 2: Upload actual file to Supabase Storage via document-service
      console.log('📁 [Upload] Uploading file to storage...');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('is_primary', 'true');

      const DOCUMENT_SERVICE_URL = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || 'http://localhost:6001';
      const { createSupabaseClient } = await import('@/lib/supabase');
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const uploadResponse = await fetch(
        `${DOCUMENT_SERVICE_URL}/api/documents/${newDocument.id}/files`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      setUploadProgress(80);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      console.log('✅ [Upload] File uploaded:', uploadResult);

      setUploadProgress(100);

      // Show success notification
      setRealtimeUpdate(`Document "${uploadTitle}" uploaded successfully`);
      setTimeout(() => setRealtimeUpdate(null), 3000);

      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadProgress(0);
        setUploading(false);
        loadDocuments();
      }, 500);

    } catch (err) {
      console.error('❌ [Upload] Error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Reset upload form when dialog closes
  const handleDialogClose = () => {
    if (!uploading) {
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadError(null);
      setUploadProgress(0);
    }
  };

  // Handle delete document
  const handleDelete = async (documentId: string, documentTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${documentTitle}"?`)) return;

    try {
      await documentsAPI.deleteDocument(documentId);
      loadDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  // Handle view document
  const handleViewDocument = (doc: DocumentWithDetails) => {
    setViewingDocument(doc);
    setViewDialogOpen(true);
  };

  // Handle edit document
  const handleEditDocument = (doc: DocumentWithDetails) => {
    setEditingDocument(doc);
    setEditTitle(doc.title);
    setEditDialogOpen(true);
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!editingDocument || !editTitle.trim()) {
      alert('Title is required');
      return;
    }

    try {
      setEditing(true);
      await documentsAPI.updateDocument(editingDocument.id, {
        title: editTitle.trim(),
      });

      setEditDialogOpen(false);
      setEditingDocument(null);
      loadDocuments();
      
      setRealtimeUpdate(`Document "${editTitle}" updated successfully`);
      setTimeout(() => setRealtimeUpdate(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setEditing(false);
    }
  };

  // Handle share document
  const handleShareDocument = async (doc: DocumentWithDetails) => {
    setSharingDocument(doc);
    setShareDialogOpen(true);
    setShareSearchQuery('');
    setShareSearchResults([]);
    setSelectedShareUser(null);
    setSharePermission('view');
    setShareError(null);
    
    // Load existing access list
    setLoadingAccess(true);
    try {
      const accessList = await documentsAPI.listAccess(doc.id);
      setDocumentAccessList(accessList);
    } catch (err) {
      console.error('Failed to load access list:', err);
      setDocumentAccessList([]);
    } finally {
      setLoadingAccess(false);
    }
  };

  // Search users for sharing
  const handleShareUserSearch = async () => {
    if (!shareSearchQuery.trim() || shareSearchQuery.length < 2) {
      setShareSearchResults([]);
      return;
    }
    
    setShareSearching(true);
    try {
      const results = await documentsAPI.searchUsersForSharing(shareSearchQuery);
      // Filter out the current user and users who already have access
      const filteredResults = results.filter(u => 
        u.id !== user?.id && 
        !documentAccessList.some(a => a.user_id === u.id)
      );
      setShareSearchResults(filteredResults);
    } catch (err) {
      console.error('User search error:', err);
      setShareSearchResults([]);
    } finally {
      setShareSearching(false);
    }
  };

  // Grant access to selected user
  const handleGrantAccess = async () => {
    if (!sharingDocument || !selectedShareUser) return;
    
    setSharing(true);
    setShareError(null);
    
    try {
      await documentsAPI.grantAccess(sharingDocument.id, {
        user_id: selectedShareUser.id,
        permission_level: sharePermission,
      });
      
      // Refresh access list
      const accessList = await documentsAPI.listAccess(sharingDocument.id);
      setDocumentAccessList(accessList);
      
      // Reset selection
      setSelectedShareUser(null);
      setShareSearchQuery('');
      setShareSearchResults([]);
      
      // Show success feedback
      setRealtimeUpdate(`Shared with ${selectedShareUser.first_name} ${selectedShareUser.last_name}`);
      setTimeout(() => setRealtimeUpdate(null), 3000);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to grant access');
    } finally {
      setSharing(false);
    }
  };

  // Open version history dialog and fetch versions
  const handleOpenVersionHistory = async (doc: DocumentWithDetails) => {
    setVersionHistoryDoc(doc);
    setVersionHistoryOpen(true);
    setLoadingVersions(true);
    
    try {
      console.log('📚 [Versions] Fetching versions for:', doc.id);
      const response = await documentsAPI.getVersions(doc.id);
      console.log('📚 [Versions] Received:', response);
      setVersions(response);
    } catch (err) {
      console.error('Failed to fetch versions:', err);
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Download a specific version
  const handleDownloadVersion = async (versionId: string, fileName: string | null) => {
    if (!versionHistoryDoc) return;
    
    try {
      setDownloadingVersion(versionId);
      console.log('📥 [Versions] Downloading version:', versionId);
      
      const result = await documentsAPI.getVersionDownloadUrl(versionHistoryDoc.id, versionId);
      
      if (result?.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = fileName || `version-${versionId}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ [Versions] Download started');
      } else {
        alert('Could not get download URL for this version');
      }
    } catch (err) {
      console.error('Failed to download version:', err);
      alert('Failed to download this version');
    } finally {
      setDownloadingVersion(null);
    }
  };

  // Revoke access
  const handleRevokeAccess = async (accessId: string, userName: string) => {
    if (!confirm(`Remove access for ${userName}?`)) return;
    
    try {
      await documentsAPI.revokeAccess(accessId);
      setDocumentAccessList(prev => prev.filter(a => a.id !== accessId));
      setRealtimeUpdate(`Access removed for ${userName}`);
      setTimeout(() => setRealtimeUpdate(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke access');
    }
  };

  // Handle download document - Gets signed URL from Supabase Storage
  const handleDownloadDocument = async (doc: DocumentWithDetails) => {
    try {
      console.log('📥 [Download] Starting download for:', doc.title, doc.id);
      
      // Get download URL from document files in Supabase Storage
      const { url, fileName } = await documentsAPI.getDownloadUrl(doc.id);
      
      console.log('📥 [Download] Got signed URL for:', fileName);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || doc.title || 'document';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setRealtimeUpdate(`Downloading "${doc.title}"...`);
      setTimeout(() => setRealtimeUpdate(null), 2000);
    } catch (err) {
      console.error('❌ [Download] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download document';
      
      if (errorMessage.includes('No files attached')) {
        alert('This document does not have a file attached yet.\n\nPlease upload a file first.');
      } else {
        alert(errorMessage);
      }
    }
  };

  // Check if current user is the owner of the document
  const isDocumentOwner = (doc: DocumentWithDetails) => {
    return user?.id === doc.owner_id;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xlsx': return <FileText className="w-6 h-6 text-green-500" />;
      case 'zip': return <Archive className="w-6 h-6 text-yellow-500" />;
      case 'evaluation': return <FileText className="w-6 h-6 text-purple-500" />;
      case 'agreement': return <FileText className="w-6 h-6 text-indigo-500" />;
      case 'report': return <FileText className="w-6 h-6 text-orange-500" />;
      case 'template': return <FileText className="w-6 h-6 text-blue-600" />;
      case 'guideline': return <FileText className="w-6 h-6 text-teal-500" />;
      default: return <File className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.type)))];
  
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: documents.length,
    shared: 0,
    categories: categories.length - 1,
    versions: documents.reduce((sum, doc) => sum + (doc.versions?.length || 0), 0)
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Real-time Update Notification */}
      {realtimeUpdate && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{realtimeUpdate}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {sidebar}
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {header}
          
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            {/* WebSocket Status */}
            <div className="mb-6 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#4CAF50]' : 'bg-gray-400'}`} />
              <span className="text-base text-gray-600">
                {wsConnected ? 'Real-time updates enabled' : 'Connecting...'}
              </span>
            </div>

            {loading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-10 h-10 animate-spin text-[#4CAF50]" />
              </div>
            )}

            {error && !loading && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  <Button variant="outline" size="sm" onClick={loadDocuments} className="ml-4">Retry</Button>
                </AlertDescription>
              </Alert>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-600 mt-2 text-lg">Manage and share your internship documents</p>
                  </div>
                  
                  <Button 
                    className="bg-[#4CAF50] hover:bg-[#45a049] text-white text-base px-6 py-6"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Document
                  </Button>
                </div>

                {/* Upload Document Dialog */}
                <Dialog open={uploadDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Upload New Document</DialogTitle>
                        <DialogDescription>
                          Upload documents to your internship file (Max 50MB)
                        </DialogDescription>
                      </DialogHeader>

                      {uploadError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        {/* File Drop Zone */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            dragActive ? 'border-[#4CAF50] bg-[#4CAF50]/5' : uploadFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#4CAF50]'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                            onChange={handleFileInputChange}
                            disabled={uploading}
                          />
                          {uploadFile ? (
                            <div className="space-y-2">
                              <CheckCircle className="w-12 h-12 mx-auto text-[#4CAF50]" />
                              <p className="text-gray-900 font-medium">{uploadFile.name}</p>
                              <p className="text-sm text-gray-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadFile(null);
                                  setUploadTitle('');
                                }}
                                disabled={uploading}
                              >
                                Change File
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-600">Drag and drop your file here</p>
                              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                              <p className="text-xs text-gray-500 mt-2">Supported: PDF, DOCX, Images, ZIP</p>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <div>
                          <Label>Document Title *</Label>
                          <Input
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            placeholder="Enter document title"
                            className="mt-2"
                            disabled={uploading}
                          />
                          <p className="text-xs text-gray-500 mt-1">The file type will be automatically detected</p>
                        </div>

                        {/* Progress */}
                        {uploading && (
                          <div className="space-y-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#4CAF50] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
                          </div>
                        )}

                        {/* Upload Button */}
                        <Button
                          onClick={handleUpload}
                          disabled={uploading || !uploadFile || !uploadTitle.trim()}
                          className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Document
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                      <div className="text-base text-gray-600 mt-1">Total Documents</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-blue-600">{stats.shared}</div>
                      <div className="text-base text-gray-600 mt-1">Shared</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-purple-600">{stats.categories}</div>
                      <div className="text-base text-gray-600 mt-1">Categories</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-[#4CAF50]">{stats.versions}</div>
                      <div className="text-base text-gray-600 mt-1">Total Versions</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Filter */}
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-base h-11 border-gray-300"
                      />
                      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                        <TabsList className="w-full justify-start overflow-x-auto bg-gray-100 p-1">
                          {categories.map((cat) => (
                            <TabsTrigger key={cat} value={cat} className="capitalize data-[state=active]:bg-white text-base px-6 py-2">
                              {cat}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents List */}
                <div className="space-y-4">
                  {filteredDocuments.length === 0 ? (
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="py-16 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No documents found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredDocuments.map((doc) => (
                      <Card key={doc.id} className="hover:shadow-md transition-shadow bg-white border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-5">
                            <div className="p-4 bg-gray-100 rounded-lg">
                              {getFileIcon(doc.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900 text-lg">{doc.title}</h3>
                                <Badge variant="outline" className="text-sm border-gray-300">v{doc.version}</Badge>
                                <Badge className="capitalize text-sm">{doc.status}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-base text-gray-600">
                                <span>Created {new Date(doc.created_at).toLocaleDateString()}</span>
                                {doc.owner && (
                                  <>
                                    <span>•</span>
                                    <span>{doc.owner.first_name} {doc.owner.last_name}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="capitalize">{doc.type}</span>
                              </div>
                              {doc.updated_at !== doc.created_at && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Last modified: {new Date(doc.updated_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {/* Version History Button - Opens dedicated dialog */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenVersionHistory(doc)}
                                title="Version history"
                              >
                                <History className="w-4 h-4" />
                              </Button>

                              {/* Edit button - only show for document owner */}
                              {isDocumentOwner(doc) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditDocument(doc)}
                                  title="Edit document"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              
                              {/* Delete button - only show for document owner */}
                              {isDocumentOwner(doc) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(doc.id, doc.title)}
                                  title="Delete document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader title="Documents" subtitle="Manage and share your documents" />
        
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          <Button 
            className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{stats.shared}</div>
                  <div className="text-xs text-muted-foreground">Shared</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full grid grid-cols-3 h-auto">
              {categories.slice(0, 3).map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize text-xs">{cat}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-10 h-10 text-[#4CAF50] mx-auto animate-spin" />
                </CardContent>
              </Card>
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No documents found</p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">{getFileIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{doc.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize">{doc.type}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewDocument(doc)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <BottomNavigation type={userType} />
      </div>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingDocument && getFileIcon(viewingDocument.type)}
              {viewingDocument?.title}
            </DialogTitle>
            <DialogDescription>Document details and preview</DialogDescription>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{viewingDocument.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <p className="text-sm">v{viewingDocument.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="outline" className="capitalize">{viewingDocument.status}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(viewingDocument.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {viewingDocument.metadata?.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{viewingDocument.metadata.description}</p>
                </div>
              )}

              <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Document preview will be available soon</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => viewingDocument && handleDownloadDocument(viewingDocument)} disabled={!viewingDocument}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => {
                  if (viewingDocument) {
                    setViewDialogOpen(false);
                    handleShareDocument(viewingDocument);
                  }
                }} disabled={!viewingDocument}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document title</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                placeholder="Document title"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)} disabled={editing}>Cancel</Button>
              <Button className="flex-1 bg-[#4CAF50] hover:bg-[#45a049]" onClick={handleSubmitEdit} disabled={editing || !editTitle.trim()}>
                {editing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={(open) => {
        setShareDialogOpen(open);
        if (!open) {
          setShareSearchQuery('');
          setShareSearchResults([]);
          setSelectedShareUser(null);
          setShareError(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Document
            </DialogTitle>
            <DialogDescription>{sharingDocument?.title}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {shareError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{shareError}</AlertDescription>
              </Alert>
            )}

            {/* User Search */}
            <div>
              <Label className="text-sm font-medium">Add people</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Search by name or email..."
                  value={shareSearchQuery}
                  onChange={(e) => setShareSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShareUserSearch()}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShareUserSearch}
                  disabled={shareSearching || shareSearchQuery.length < 2}
                >
                  {shareSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {shareSearchResults.length > 0 && !selectedShareUser && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {shareSearchResults.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => setSelectedShareUser(u)}
                  >
                    <div>
                      <div className="font-medium text-sm">{u.first_name} {u.last_name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{u.role}</Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedShareUser && (
              <div className="border rounded-md p-3 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{selectedShareUser.first_name} {selectedShareUser.last_name}</div>
                      <div className="text-xs text-gray-500">{selectedShareUser.email}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedShareUser(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Permission Selection */}
                <div className="mt-3 flex items-center gap-3">
                  <Label className="text-sm">Permission:</Label>
                  <select 
                    className="border rounded-md p-1 text-sm flex-1"
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value as 'view' | 'comment' | 'edit' | 'admin')}
                  >
                    <option value="view">Can view</option>
                    <option value="comment">Can comment</option>
                    <option value="edit">Can edit</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button 
                    size="sm" 
                    className="bg-[#4CAF50] hover:bg-[#45a049]"
                    onClick={handleGrantAccess}
                    disabled={sharing}
                  >
                    {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
                  </Button>
                </div>
              </div>
            )}

            {/* Current Access List */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                People with access
              </Label>
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {loadingAccess ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : documentAccessList.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Only you have access to this document
                  </div>
                ) : (
                  documentAccessList.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <div className="font-medium text-sm">
                          {access.users?.first_name} {access.users?.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{access.users?.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {access.permission_level === 'write' ? 'Can edit' : 'Can view'}
                        </Badge>
                        {isDocumentOwner(sharingDocument!) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => handleRevokeAccess(access.id, `${access.users?.first_name || ''} ${access.users?.last_name || ''}`)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShareDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History - {versionHistoryDoc?.title}</DialogTitle>
            <DialogDescription>View and download previous versions of this document</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : versions.length > 0 ? (
              versions.map((version) => (
                <Card 
                  key={version.id} 
                  className={version.is_current ? 'border-green-500 dark:border-green-700' : ''}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={version.is_current ? 'default' : 'outline'}>
                            v{version.version}
                          </Badge>
                          {version.is_current && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Current
                            </Badge>
                          )}
                        </div>
                        {version.file_name && (
                          <div className="text-sm text-muted-foreground mb-1">
                            📄 {version.file_name}
                            {version.file_size && ` (${(version.file_size / 1024).toFixed(1)} KB)`}
                          </div>
                        )}
                        {version.change_summary && (
                          <div className="text-sm text-muted-foreground mb-1">
                            {version.change_summary}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {version.created_by_user && (
                            <span>{version.created_by_user.first_name} {version.created_by_user.last_name} • </span>
                          )}
                          {new Date(version.created_at).toLocaleString()}
                        </div>
                      </div>
                      {version.file_path && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadVersion(version.id, version.file_name || null)}
                          disabled={downloadingVersion === version.id}
                        >
                          {downloadingVersion === version.id ? (
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
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No version history available</p>
                <p className="text-sm mt-2">Upload a new version to see history</p>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setVersionHistoryOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
