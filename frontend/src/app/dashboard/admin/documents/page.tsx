'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Eye, 
  Archive,
  Loader2,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import {
  DocumentWithDetails,
  DocumentType,
  StatsResponse
} from '@/types/documents';
import { DocumentDetailDialog } from '@/components/admin/documents/DocumentDetailDialog';
import { DocumentStatsCards } from '@/components/admin/documents/DocumentStatsCards';

export default function DocumentsPage() {
  const { toast } = useToast();
  
  // State for documents data
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const limit = 10;
  
  // Dialog state
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithDetails | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('📂 [Admin] Fetching documents...');
      
      const filters: {
        type?: DocumentType;
        search?: string;
      } = {};
      if (filterType !== 'all') filters.type = filterType as DocumentType;
      if (searchQuery) filters.search = searchQuery;
      
      const response = await adminDocumentsAPI.getDocuments(
        filters,
        { page: currentPage, limit },
        { sort_by: 'created_at', sort_order: 'desc' }
      );
      
      console.log('✅ [Admin] Fetched', response.total, 'documents');
      
      setDocuments(response.documents);
      setTotalPages(response.total_pages);
      setTotalDocuments(response.total);
    } catch (error) {
      console.error('❌ [Admin] Fetch documents error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch documents';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, searchQuery, toast]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const statsData = await adminDocumentsAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [currentPage, filterType, fetchDocuments, fetchStats]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchDocuments();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, currentPage, fetchDocuments]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDocuments(), fetchStats()]);
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Documents list has been updated',
    });
  };

  // Handle document click
  const handleViewDocument = async (doc: DocumentWithDetails) => {
    try {
      const fullDoc = await adminDocumentsAPI.getDocument(doc.id);
      setSelectedDocument(fullDoc);
      setDetailDialogOpen(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load document details';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Handle archive/unarchive
  const handleArchive = async (documentId: string) => {
    try {
      await adminDocumentsAPI.archiveDocument(documentId);
      toast({
        title: 'Success',
        description: 'Document archived successfully',
      });
      fetchDocuments();
      fetchStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive document';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Get type badge color
  const getTypeColor = (type: DocumentType) => {
    const colors: Record<string, string> = {
      evaluation: 'bg-indigo-100 text-indigo-800',
      agreement: 'bg-cyan-100 text-cyan-800',
      report: 'bg-emerald-100 text-emerald-800',
      form: 'bg-amber-100 text-amber-800',
      certificate: 'bg-violet-100 text-violet-800',
      memorandum: 'bg-rose-100 text-rose-800',
      pdf: 'bg-red-100 text-red-800',
      docx: 'bg-blue-100 text-blue-800',
      xlsx: 'bg-green-100 text-green-800',
      image: 'bg-purple-100 text-purple-800',
      zip: 'bg-yellow-100 text-yellow-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                  <p className="text-muted-foreground mt-1">Manage all platform documents, versions, and access control</p>
                </div>
              </div>

              {/* Statistics Cards */}
              {!statsLoading && stats && (
                <DocumentStatsCards stats={stats} />
              )}

              {/* Filters and Search */}
              <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Type Filter */}
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="zip">Archive</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

              {/* Documents Table */}
              <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Showing {documents.length} of {totalDocuments} documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Uploaded By</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>
                                <div className="font-medium">{doc.title}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getTypeColor(doc.type)}>
                                  {doc.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono">
                                  v{doc.version}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {doc.owner?.first_name} {doc.owner?.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {doc.owner?.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(doc.created_at)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleArchive(doc.id)}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
            {/* Statistics Cards */}
            {!statsLoading && stats && (
              <DocumentStatsCards stats={stats} />
            )}

            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mobile Filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="memorandum">Memorandum</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Refresh Button */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Mobile Documents List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading documents...</p>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No documents found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Card key={doc.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">v{doc.version}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(doc.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className={getTypeColor(doc.type)}>
                          {doc.type}
                        </Badge>
                      </div>
                      {doc.owner && (
                        <p className="text-xs text-muted-foreground">
                          Owner: {doc.owner.first_name} {doc.owner.last_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(doc.updated_at)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Mobile Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <DocumentDetailDialog
          document={selectedDocument}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onUpdate={() => {
            fetchDocuments();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
