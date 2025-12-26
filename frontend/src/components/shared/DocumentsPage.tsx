'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Upload, Download, Share2, Trash2, Eye, File, FileText, Archive, History, Edit, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [uploadType, setUploadType] = useState<string>(defaultUploadType);
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

  // Edit document state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentWithDetails | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editing, setEditing] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<DocumentWithDetails | null>(null);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const socket = connectForUpdates();

    socket.on('connect', () => {
      setWsConnected(true);
    });

    socket.on('disconnect', () => {
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

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Please select a file and provide a title');
      return;
    }

    try {
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

      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadType(defaultUploadType);
        setUploadDescription('');
        setUploadProgress(0);
        setUploading(false);
        loadDocuments();
      }, 500);

    } catch (err) {
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
      setUploadType(defaultUploadType);
      setUploadDescription('');
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
    setEditType(doc.type);
    setEditDescription(doc.metadata?.description || '');
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
        type: editType as any,
        metadata: {
          ...editingDocument.metadata,
          description: editDescription.trim() || undefined
        }
      });

      setEditDialogOpen(false);
      setEditingDocument(null);
      loadDocuments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setEditing(false);
    }
  };

  // Handle share document
  const handleShareDocument = (doc: DocumentWithDetails) => {
    setSharingDocument(doc);
    setShareDialogOpen(true);
  };

  // Handle download document
  const handleDownloadDocument = (doc: DocumentWithDetails) => {
    alert('Download functionality will be available once file storage is integrated (Phase 3).\n\nFor now, documents are stored as metadata only.');
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
                        </div>

                        {/* Type Selection with Tabs (Advisor style) */}
                        <div>
                          <Label>Document Type *</Label>
                          <Tabs value={uploadType} onValueChange={setUploadType} className="mt-2">
                            <TabsList className="grid grid-cols-3 w-full">
                              <TabsTrigger value={userType === 'advisor' ? 'template' : 'report'}>
                                {userType === 'advisor' ? 'Template' : 'Report'}
                              </TabsTrigger>
                              <TabsTrigger value={userType === 'advisor' ? 'guideline' : 'evaluation'}>
                                {userType === 'advisor' ? 'Guideline' : 'Evaluation'}
                              </TabsTrigger>
                              <TabsTrigger value={userType === 'advisor' ? 'form' : 'certificate'}>
                                {userType === 'advisor' ? 'Form' : 'Certificate'}
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>

                        {/* Description */}
                        <div>
                          <Label>Description (Optional)</Label>
                          <Input
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            placeholder="Brief description of the document"
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(doc.id)}>
                                    <History className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Version History - {doc.title}</DialogTitle>
                                    <DialogDescription>View and manage document versions</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {doc.versions && doc.versions.length > 0 ? (
                                      doc.versions.map((version) => (
                                        <Card key={version.id} className={version.version === doc.version ? 'border-blue-600' : ''}>
                                          <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <Badge variant={version.version === doc.version ? 'default' : 'outline'}>
                                                  Version {version.version}
                                                  {version.version === doc.version && ' (Current)'}
                                                </Badge>
                                                <div className="mt-2 space-y-1">
                                                  {version.created_by_user && (
                                                    <div className="text-sm text-foreground">
                                                      <span className="font-medium">Updated by:</span> {version.created_by_user.first_name} {version.created_by_user.last_name}
                                                    </div>
                                                  )}
                                                  <div className="text-sm text-muted-foreground">
                                                    <span className="font-medium">Date:</span> {new Date(version.created_at).toLocaleString()}
                                                  </div>
                                                  {version.change_summary && (
                                                    <div className="text-sm text-muted-foreground">
                                                      <span className="font-medium">Changes:</span> {version.change_summary}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))
                                    ) : (
                                      <div className="py-8 text-center text-muted-foreground">No version history available</div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {doc.file_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={doc.file_url} download>
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              
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
            <DialogDescription>Update document information</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Document title" />
            </div>
            <div>
              <Label>Type *</Label>
              <select className="w-full p-2 border rounded-md" value={editType} onChange={(e) => setEditType(e.target.value)}>
                <option value="report">Report</option>
                <option value="template">Template</option>
                <option value="evaluation">Evaluation</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <textarea 
                className="w-full p-2 border rounded-md" 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
                placeholder="Optional description"
                rows={4}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)} disabled={editing}>Cancel</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSubmitEdit} disabled={editing || !editTitle.trim()}>
                {editing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Document
            </DialogTitle>
            <DialogDescription>{sharingDocument?.title}</DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming Soon!</strong><br />
              Document sharing functionality will be available in the next phase.
            </AlertDescription>
          </Alert>

          <Button className="w-full" onClick={() => setShareDialogOpen(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
