'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Share2, Trash2, Eye, File, FileText, Archive, History, Edit, Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
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


export default function Documents() {
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
  const [uploadType, setUploadType] = useState<string>('template');
  const [uploadDescription, setUploadDescription] = useState('');
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

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔵 [WebSocket] Connecting to document service...');
    
    try {
      const socket = connectForUpdates();

      socket.on('connect', () => {
        console.log('🟢 [WebSocket] Connected to document service');
        setWsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('⚠️ [WebSocket] Disconnected from document service');
        setWsConnected(false);
      });

      socket.on('document:update', (data: any) => {
        console.log('📥 [WebSocket] Document update received:', data);
        setRealtimeUpdate(data.message || 'Document updated');
        loadDocuments();
        setTimeout(() => setRealtimeUpdate(null), 3000);
      });

      socket.on('document:error', (error: any) => {
        console.error('❌ [WebSocket] Error:', error);
      });

      return () => {
        console.log('🔌 [WebSocket] Disconnecting...');
        if (socket && socket.connected) {
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error('❌ [WebSocket] Connection error:', err);
    }
  }, [user?.id]);

  const loadDocuments = async () => {
    try {
      console.log('🔵 [Documents] Loading documents...');
      setLoading(true);
      setError(null);

      const response = await documentsAPI.getDocuments();
      console.log('🟢 [Documents] Documents loaded:', response);
      
      setDocuments(response.documents || []);
    } catch (err) {
      console.error('❌ [Documents] Load error:', err);
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

    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, DOCX, images, or ZIP files.';
    }

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

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Please select a file and provide a title');
      return;
    }

    try {
      console.log('🔵 [Upload] Starting upload...', uploadFile.name);
      setUploading(true);
      setUploadError(null);
      setUploadProgress(10);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const newDocument = await documentsAPI.createDocument({
        title: uploadTitle.trim(),
        type: uploadType,
        description: uploadDescription.trim() || undefined,
        content: { fileName: uploadFile.name, fileSize: uploadFile.size },
        metadata: { 
          originalName: uploadFile.name,
          mimeType: uploadFile.type,
          size: uploadFile.size 
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('🟢 [Upload] Document created:', newDocument);

      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadType('template');
        setUploadDescription('');
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

  // Handle download
  const handleDownload = async (doc: DocumentWithDetails) => {
    try {
      console.log('🔵 [Download] Downloading document:', doc.id);
      // TODO: Implement download functionality
      window.open(doc.file_url, '_blank');
    } catch (err) {
      console.error('❌ [Download] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  // Handle delete
  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      console.log('🔵 [Delete] Deleting document:', docId);
      await documentsAPI.deleteDocument(docId);
      loadDocuments();
    } catch (err) {
      console.error('❌ [Delete] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  // Handle view
  const handleView = (doc: DocumentWithDetails) => {
    setViewingDocument(doc);
    setViewDialogOpen(true);
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    const lower = type?.toLowerCase() || '';
    if (lower.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (lower.includes('doc')) return <FileText className="w-6 h-6 text-blue-500" />;
    if (lower.includes('xls') || lower.includes('sheet')) return <FileText className="w-6 h-6 text-green-500" />;
    if (lower.includes('zip') || lower.includes('archive')) return <Archive className="w-6 h-6 text-yellow-500" />;
    if (lower.includes('image') || lower.includes('jpg') || lower.includes('png')) return <Eye className="w-6 h-6 text-purple-500" />;
    return <File className="w-6 h-6 text-muted-foreground" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get categories
  const categories = ['all', ...Array.from(new Set(documents.map(d => d.type)))];
  
  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const stats = {
    total: documents.length,
    templates: documents.filter(d => d.type === 'form' || d.type === 'certificate').length,
    reports: documents.filter(d => d.type === 'report' || d.type === 'evaluation').length,
    shared: documents.filter(d => d.status === 'published' || d.status === 'approved').length
  };


  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdvisorSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdvisorHeader />
          
          <div className="flex-1 overflow-y-auto p-8 xl:p-12 bg-gray-50">
            <div className="space-y-8">
              {/* Header with real-time indicator */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Documents</h1>
                  <p className="text-gray-600 mt-2 text-lg">Manage, share, and track documents</p>
                </div>
                <div className="flex items-center gap-4">
                  {wsConnected && (
                    <div className="flex items-center gap-2 text-sm text-[#4CAF50]">
                      <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-pulse" />
                      <span>Connected</span>
                    </div>
                  )}
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#4CAF50] hover:bg-[#45a049] text-white">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Upload New Document</DialogTitle>
                        <DialogDescription>
                          Upload templates, reports, or other documents
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
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            dragActive ? 'border-[#4CAF50] bg-[#4CAF50]/5' : 'border-gray-300 hover:border-[#4CAF50]'
                          }`}
                        >
                          {uploadFile ? (
                            <div className="space-y-2">
                              <CheckCircle className="w-12 h-12 mx-auto text-[#4CAF50]" />
                              <p className="text-gray-900 font-medium">{uploadFile.name}</p>
                              <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUploadFile(null)}
                              >
                                Change File
                              </Button>
                            </div>
                          ) : (
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                              <p className="text-gray-600">Drag and drop your file here</p>
                              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                onChange={handleFileInputChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png"
                              />
                            </label>
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
                        </div>

                        {/* Type */}
                        <div>
                          <Label>Document Type</Label>
                          <Tabs value={uploadType} onValueChange={setUploadType} className="mt-2">
                            <TabsList className="grid grid-cols-3 w-full">
                              <TabsTrigger value="template">Template</TabsTrigger>
                              <TabsTrigger value="report">Report</TabsTrigger>
                              <TabsTrigger value="guideline">Guideline</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>

                        {/* Description */}
                        <div>
                          <Label>Description (Optional)</Label>
                          <Input
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            placeholder="Brief description"
                            className="mt-2"
                            disabled={uploading}
                          />
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
                            <p className="text-sm text-gray-600 text-center">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        )}

                        {/* Upload Button */}
                        <Button
                          onClick={handleUpload}
                          disabled={uploading || !uploadFile}
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
                </div>
              </div>

              {/* Real-time Update Alert */}
              {realtimeUpdate && (
                <Alert className="border-[#4CAF50] bg-[#4CAF50]/5">
                  <CheckCircle className="h-4 w-4 text-[#4CAF50]" />
                  <AlertDescription className="text-[#4CAF50]">{realtimeUpdate}</AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
                    <p className="text-muted-foreground">Total Documents</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-blue-600">{stats.templates}</CardTitle>
                    <p className="text-muted-foreground">Templates</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-purple-600">{stats.reports}</CardTitle>
                    <p className="text-muted-foreground">Reports</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-[#4CAF50]">{stats.shared}</CardTitle>
                    <p className="text-muted-foreground">Shared</p>
                  </CardHeader>
                </Card>
              </div>

              {/* Search and Filter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11"
                    />
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                      <TabsList className="w-full justify-start overflow-x-auto">
                        {categories.map((cat) => (
                          <TabsTrigger key={cat} value={cat} className="capitalize">
                            {cat}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>

              {/* Documents List */}
              {loading ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Loader2 className="w-12 h-12 mx-auto text-[#4CAF50] animate-spin mb-4" />
                    <p className="text-gray-600">Loading documents...</p>
                  </CardContent>
                </Card>
              ) : filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No documents found</p>
                    <p className="text-gray-500 mt-2">Upload your first document to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            {getFileIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900">{doc.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{doc.metadata?.size ? formatFileSize(doc.metadata.size) : 'N/A'}</span>
                              <span>•</span>
                              <span>Uploaded {formatDate(doc.created_at)}</span>
                              {doc.owner && (
                                <>
                                  <span>•</span>
                                  <span>{doc.owner.first_name} {doc.owner.last_name}</span>
                                </>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader title="Documents" subtitle="Manage and share documents" />
        
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="w-full bg-[#4CAF50] hover:bg-[#45a049]"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>

            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-12 h-12 mx-auto text-[#4CAF50] animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{doc.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNavigation type="advisor" />
      </div>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.title}</DialogTitle>
            <DialogDescription>
              {viewingDocument?.description || 'Document details'}
            </DialogDescription>
          </DialogHeader>
          {viewingDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {viewingDocument.type}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {viewingDocument.status}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(viewingDocument.created_at)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(viewingDocument.updated_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownload(viewingDocument)} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
