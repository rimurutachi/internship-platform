'use client';

import { useState } from 'react';
import { Upload, Download, Share2, Lock, Unlock, Trash2, Eye, FileText, Users, Search, Shield } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
  category: string;
  accessLevel: 'public' | 'restricted' | 'private';
  size: string;
  accessCount: number;
  sharedWith: number;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Platform_Terms_of_Service.pdf',
    uploadedBy: 'admin@platform.com',
    uploadedDate: '2025-09-01',
    category: 'Agreements',
    accessLevel: 'public',
    size: '2.4 MB',
    accessCount: 1245,
    sharedWith: 523
  },
  {
    id: '2',
    name: 'Data_Protection_Policy.pdf',
    uploadedBy: 'admin@platform.com',
    uploadedDate: '2025-09-01',
    category: 'Policies',
    accessLevel: 'restricted',
    size: '1.8 MB',
    accessCount: 342,
    sharedWith: 89
  },
  {
    id: '3',
    name: 'User_Training_Materials.zip',
    uploadedBy: 'admin@platform.com',
    uploadedDate: '2025-10-01',
    category: 'Training',
    accessLevel: 'restricted',
    size: '45.2 MB',
    accessCount: 567,
    sharedWith: 234
  },
  {
    id: '4',
    name: 'Company_Partnership_Guidelines.docx',
    uploadedBy: 'admin@platform.com',
    uploadedDate: '2025-08-15',
    category: 'Guidelines',
    accessLevel: 'private',
    size: '892 KB',
    accessCount: 78,
    sharedWith: 12
  },
  {
    id: '5',
    name: 'Internship_Evaluation_Template.xlsx',
    uploadedBy: 'admin@platform.com',
    uploadedDate: '2025-10-12',
    category: 'Templates',
    accessLevel: 'public',
    size: '156 KB',
    accessCount: 892,
    sharedWith: 412
  }
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccess, setFilterAccess] = useState<string>('all');

  const filteredDocs = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAccess = filterAccess === 'all' || doc.accessLevel === filterAccess;
    return matchesSearch && matchesAccess;
  });

  const getAccessColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-success/10 text-success dark:bg-success/20';
      case 'restricted': return 'bg-warning/10 text-warning dark:bg-warning/20';
      case 'private': return 'bg-error/10 text-error dark:bg-error/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getAccessIcon = (level: string) => {
    switch (level) {
      case 'private': return <Lock className="w-3 h-3" />;
      default: return <Unlock className="w-3 h-3" />;
    }
  };

  const stats = {
    total: mockDocuments.length,
    public: mockDocuments.filter(d => d.accessLevel === 'public').length,
    restricted: mockDocuments.filter(d => d.accessLevel === 'restricted').length,
    private: mockDocuments.filter(d => d.accessLevel === 'private').length
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Document Management</h1>
                  <p className="text-muted-foreground mt-1">Manage access control and document distribution</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Documents</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">{stats.public}</div>
                    <div className="text-sm text-muted-foreground">Public</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-warning">{stats.restricted}</div>
                    <div className="text-sm text-muted-foreground">Restricted</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-error">{stats.private}</div>
                    <div className="text-sm text-muted-foreground">Private</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filter */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterAccess} onValueChange={setFilterAccess}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by access" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Access Levels</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Table */}
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>Uploaded By</TableHead>
                          <TableHead>Access Level</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Shared With</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="max-w-xs truncate">{doc.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{doc.uploadedBy}</TableCell>
                            <TableCell>
                              <Badge className={getAccessColor(doc.accessLevel)}>
                                {doc.accessLevel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{doc.size}</TableCell>
                            <TableCell className="text-muted-foreground">{doc.accessCount}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>{doc.sharedWith}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  {doc.accessLevel === 'private' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-error hover:text-error/80">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Documents"
            subtitle="Document Management"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Upload Button - Mobile */}
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>

            {/* Stats - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-success">{stats.public}</div>
                  <div className="text-xs text-muted-foreground">Public</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-warning">{stats.restricted}</div>
                  <div className="text-xs text-muted-foreground">Restricted</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xl font-bold text-error">{stats.private}</div>
                  <div className="text-xs text-muted-foreground">Private</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter - Mobile */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterAccess} onValueChange={setFilterAccess}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Documents - Mobile Cards */}
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Document Header */}
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm break-words">{doc.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{doc.uploadedBy}</div>
                        </div>
                        <Badge className={getAccessColor(doc.accessLevel)} style={{ fontSize: '0.7rem' }}>
                          <div className="flex items-center gap-1">
                            {getAccessIcon(doc.accessLevel)}
                            {doc.accessLevel}
                          </div>
                        </Badge>
                      </div>

                      {/* Document Stats */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Size</div>
                          <div className="text-sm font-semibold text-foreground">{doc.size}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Views</div>
                          <div className="text-sm font-semibold text-foreground">{doc.accessCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Shared</div>
                          <div className="text-sm font-semibold text-foreground">{doc.sharedWith}</div>
                        </div>
                      </div>

                      {/* Document Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          {doc.accessLevel === 'private' ? (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1" />
                              Lock
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5 mr-1" />
                              Access
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" className="text-error hover:text-error/80">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
