'use client';

import { useState } from 'react';
import { Upload, Download, Share2, Trash2, Eye, File, FileText, Archive, History, Edit, Users } from 'lucide-react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DocumentVersion {
  version: number;
  updatedBy: string;
  updatedDate: string;
  changes: string;
  size: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  uploadedBy: string;
  category: string;
  shared: boolean;
  sharedWith: string[];
  currentVersion: number;
  versions: DocumentVersion[];
  lastModified: string;
  lastModifiedBy: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Internship_Agreement.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadedDate: '2025-09-01',
    uploadedBy: 'HR Department',
    category: 'Agreements',
    shared: true,
    sharedWith: ['You', 'Supervisor'],
    currentVersion: 2,
    versions: [
      { version: 2, updatedBy: 'HR Department', updatedDate: '2025-10-01', changes: 'Updated terms and conditions', size: '2.4 MB' },
      { version: 1, updatedBy: 'HR Department', updatedDate: '2025-09-01', changes: 'Initial version', size: '2.2 MB' }
    ],
    lastModified: '2025-10-01',
    lastModifiedBy: 'HR Department'
  },
  {
    id: '2',
    name: 'Project_Proposal.docx',
    type: 'docx',
    size: '1.8 MB',
    uploadedDate: '2025-10-15',
    uploadedBy: 'You',
    category: 'Projects',
    shared: true,
    sharedWith: ['Supervisor', 'Advisor'],
    currentVersion: 3,
    versions: [
      { version: 3, updatedBy: 'You', updatedDate: '2025-11-10', changes: 'Added implementation details', size: '1.8 MB' },
      { version: 2, updatedBy: 'You', updatedDate: '2025-10-20', changes: 'Updated project scope', size: '1.6 MB' },
      { version: 1, updatedBy: 'You', updatedDate: '2025-10-15', changes: 'Initial draft', size: '1.4 MB' }
    ],
    lastModified: '2025-11-10',
    lastModifiedBy: 'You'
  },
  {
    id: '3',
    name: 'Weekly_Report_Nov8.pdf',
    type: 'pdf',
    size: '892 KB',
    uploadedDate: '2025-11-08',
    uploadedBy: 'You',
    category: 'Reports',
    shared: false,
    sharedWith: [],
    currentVersion: 1,
    versions: [
      { version: 1, updatedBy: 'You', updatedDate: '2025-11-08', changes: 'Initial upload', size: '892 KB' }
    ],
    lastModified: '2025-11-08',
    lastModifiedBy: 'You'
  },
  {
    id: '4',
    name: 'Design_Mockups.zip',
    type: 'zip',
    size: '15.3 MB',
    uploadedDate: '2025-11-05',
    uploadedBy: 'You',
    category: 'Projects',
    shared: true,
    sharedWith: ['Supervisor', 'Design Team'],
    currentVersion: 2,
    versions: [
      { version: 2, updatedBy: 'You', updatedDate: '2025-11-12', changes: 'Updated UI/UX designs based on feedback', size: '15.3 MB' },
      { version: 1, updatedBy: 'You', updatedDate: '2025-11-05', changes: 'Initial mockups', size: '14.8 MB' }
    ],
    lastModified: '2025-11-12',
    lastModifiedBy: 'You'
  },
  {
    id: '5',
    name: 'Training_Materials.pdf',
    type: 'pdf',
    size: '5.2 MB',
    uploadedDate: '2025-09-05',
    uploadedBy: 'HR Department',
    category: 'Training',
    shared: true,
    sharedWith: ['All Interns'],
    currentVersion: 1,
    versions: [
      { version: 1, updatedBy: 'HR Department', updatedDate: '2025-09-05', changes: 'Initial upload', size: '5.2 MB' }
    ],
    lastModified: '2025-09-05',
    lastModifiedBy: 'HR Department'
  },
  {
    id: '6',
    name: 'Performance_Evaluation.pdf',
    type: 'pdf',
    size: '1.1 MB',
    uploadedDate: '2025-10-15',
    uploadedBy: 'John Doe',
    category: 'Evaluations',
    shared: false,
    sharedWith: [],
    currentVersion: 1,
    versions: [
      { version: 1, updatedBy: 'John Doe', updatedDate: '2025-10-15', changes: 'Initial evaluation', size: '1.1 MB' }
    ],
    lastModified: '2025-10-15',
    lastModifiedBy: 'John Doe'
  }
];

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />;
      case 'docx': return <FileText className="w-6 h-6 text-blue-500" />;
      case 'xlsx': return <FileText className="w-6 h-6 text-green-500" />;
      case 'zip': return <Archive className="w-6 h-6 text-yellow-500" />;
      default: return <File className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const categories = ['all', ...Array.from(new Set(mockDocuments.map(d => d.category)))];
  
  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: mockDocuments.length,
    shared: mockDocuments.filter(d => d.shared).length,
    categories: categories.length - 1,
    versions: mockDocuments.reduce((sum, doc) => sum + doc.versions.length, 0)
  };

  const currentDoc = selectedDocument ? mockDocuments.find(d => d.id === selectedDocument) : null;

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <StudentSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <StudentHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and share your internship documents</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document to your internship file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Drag and drop your file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.shared}</div>
            <div className="text-sm text-muted-foreground">Shared</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.categories}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </CardContent>
                </Card>
                <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.versions}</div>
            <div className="text-sm text-muted-foreground">Total Versions</div>
          </CardContent>
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
              <div className="space-y-3">
                {filteredDocuments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No documents found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{doc.name}</h3>
                      {doc.currentVersion > 1 && (
                        <Badge variant="outline" className="text-xs">
                          v{doc.currentVersion}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.uploadedDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{doc.uploadedBy}</span>
                      {doc.shared && (
                        <>
                          <span>•</span>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        </>
                      )}
                    </div>
                    {doc.lastModified !== doc.uploadedDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last modified: {new Date(doc.lastModified).toLocaleDateString()} by {doc.lastModifiedBy}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedDocument(doc.id)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Version History - {doc.name}</DialogTitle>
                          <DialogDescription>
                            View and manage document versions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {doc.versions.map((version, idx) => (
                            <Card key={idx} className={version.version === doc.currentVersion ? 'border-blue-600' : ''}>
                              <CardContent className="pt-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={version.version === doc.currentVersion ? 'default' : 'outline'}>
                                        Version {version.version}
                                        {version.version === doc.currentVersion && ' (Current)'}
                                      </Badge>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                      <div className="text-sm text-foreground">
                                        <span className="font-medium">Updated by:</span> {version.updatedBy}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Date:</span> {new Date(version.updatedDate).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Changes:</span> {version.changes}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Size:</span> {version.size}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      <Download className="w-3 h-3 mr-1" />
                                      Download
                                    </Button>
                                    {version.version === doc.currentVersion && (
                                      <Button variant="outline" size="sm">
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <MobileHeader 
          title="Documents"
          subtitle="Manage and share your documents"
        />
        <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
          {/* Upload Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to your internship file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Drag and drop your file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <Button className="w-full">Upload</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats */}
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
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-ai">{stats.categories}</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-success">{stats.versions}</div>
                  <div className="text-xs text-muted-foreground">Versions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full grid grid-cols-3 h-auto">
              {categories.slice(0, 3).map((cat) => (
                <TabsTrigger key={cat} value={cat} className="capitalize text-xs">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Documents List */}
          <div className="space-y-2">
            {filteredDocuments.length === 0 ? (
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
                      <div className="p-2 bg-muted rounded-lg">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm truncate">{doc.name}</h3>
                          {doc.currentVersion > 1 && (
                            <Badge variant="outline" className="text-xs">v{doc.currentVersion}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedDate).toLocaleDateString()}</span>
                        </div>
                        {doc.shared && (
                          <Badge variant="success" className="text-xs mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedDocument(doc.id)}
                            >
                              <History className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw]">
                            <DialogHeader>
                              <DialogTitle className="text-sm">Version History</DialogTitle>
                              <DialogDescription className="text-xs">
                                {doc.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                              {doc.versions.map((version, idx) => (
                                <Card key={idx} className={version.version === doc.currentVersion ? 'border-blue-600' : ''}>
                                  <CardContent className="pt-3">
                                    <div className="space-y-2">
                                      <Badge variant={version.version === doc.currentVersion ? 'default' : 'outline'} className="text-xs">
                                        v{version.version}
                                        {version.version === doc.currentVersion && ' (Current)'}
                                      </Badge>
                                      <div className="text-xs space-y-1">
                                        <div className="text-foreground">
                                          <span className="font-medium">Updated by:</span> {version.updatedBy}
                                        </div>
                                        <div className="text-muted-foreground">
                                          <span className="font-medium">Date:</span> {new Date(version.updatedDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-muted-foreground">
                                          <span className="font-medium">Changes:</span> {version.changes}
                                        </div>
                                        <div className="text-muted-foreground">
                                          <span className="font-medium">Size:</span> {version.size}
                                        </div>
                                      </div>
                                      <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="sm" className="text-xs h-7">
                                          <Download className="w-3 h-3 mr-1" />
                                          Download
                                        </Button>
                                        {version.version === doc.currentVersion && (
                                          <Button variant="outline" size="sm" className="text-xs h-7">
                                            <Edit className="w-3 h-3 mr-1" />
                                            Edit
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        <BottomNavigation type="student" />
      </div>
    </div>
  );
}

