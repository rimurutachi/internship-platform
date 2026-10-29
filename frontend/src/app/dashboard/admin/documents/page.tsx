'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Eye, 
  Archive,
  Download,
  Loader2,
  RefreshCw,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useToast } from '@/hooks/use-toast';
import { adminDocumentsAPI } from '@/lib/api/admin-documents';
import { documentsAPI } from '@/lib/api/documents';
import {
  DocumentWithDetails,
  DocumentType,
  DocumentStatus,
  StatsResponse
} from '@/types/documents';
import {
  DocumentDetailDialog,
  getDocumentCategory,
  getDocumentStatusInfo
} from '@/components/admin/documents/DocumentDetailDialog';
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
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
        status?: DocumentStatus;
        search?: string;
      } = {};
      
      if (filterType !== 'all') filters.type = filterType as DocumentType;
      if (filterStatus !== 'all') filters.status = filterStatus as DocumentStatus;
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
  }, [currentPage, filterType, filterStatus, searchQuery, toast]);

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
  }, [currentPage, filterType, filterStatus, fetchDocuments, fetchStats]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchDocuments();
      } else {
        setCurrentPage(1);
      }
    }, 400);

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

  // Direct download file from table
  const handleDirectDownload = async (doc: DocumentWithDetails) => {
    try {
      const { url, fileName } = await documentsAPI.getDownloadUrl(doc.id);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName || doc.title || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download document copy',
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor, audit, and manage institutional internship documents, compliance verifications, and version archives
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <DocumentStatsCards stats={stats} />
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search documents by title or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category / Type Filter */}
            <div className="lg:col-span-2">
              <Select
                value={filterType}
                onValueChange={(val) => {
                  setFilterType(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="moa">MOA (Memorandum of Agreement)</SelectItem>
                  <SelectItem value="waiver">Waivers & Liability Consents</SelectItem>
                  <SelectItem value="endorsement">Endorsement Letters</SelectItem>
                  <SelectItem value="placement">OJT Placement Forms</SelectItem>
                  <SelectItem value="evaluation">Evaluation Forms</SelectItem>
                  <SelectItem value="template">Official Templates</SelectItem>
                  <SelectItem value="pdf">PDF Documents</SelectItem>
                  <SelectItem value="docx">Word Documents (DOCX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={filterStatus}
                onValueChange={(val) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved / Pre-Approved</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Showing {documents.length} of {totalDocuments} institutional records
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
              <p className="text-muted-foreground font-medium">No documents found</p>
              <p className="text-xs text-muted-foreground mt-1">Try clearing or adjusting your search and filter criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title & Organization</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const category = getDocumentCategory(doc.title, doc.type);
                      const statusInfo = getDocumentStatusInfo(doc.status);
                      const StatusIcon = statusInfo.Icon;

                      return (
                        <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                          {/* Title & Organization Subtitle */}
                          <TableCell className="max-w-[280px]">
                            <div className="font-semibold text-foreground truncate" title={doc.title}>
                              {doc.title}
                            </div>
                            {doc.internship_details?.company_name && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{doc.internship_details.company_name}</span>
                                {doc.internship_details.program_code && (
                                  <span className="font-mono text-[10px] bg-muted px-1 rounded shrink-0">
                                    {doc.internship_details.program_code}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          {/* Category Badge */}
                          <TableCell>
                            <Badge variant="outline" className={`font-medium ${category.color}`}>
                              {category.label}
                            </Badge>
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            <Badge variant="outline" className={`font-medium flex items-center gap-1 w-fit ${statusInfo.badgeClass}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>

                          {/* Version */}
                          <TableCell>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                              v{doc.version}
                            </span>
                          </TableCell>

                          {/* Uploaded By + Role Badge */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-foreground">
                                {doc.owner?.first_name} {doc.owner?.last_name}
                              </span>
                              {doc.owner?.role && (
                                <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0">
                                  {doc.owner.role === 'student' ? 'Student' : doc.owner.role}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {doc.owner?.email}
                            </div>
                          </TableCell>

                          {/* Upload Date */}
                          <TableCell>
                            <div className="text-sm text-foreground">
                              {formatDate(doc.created_at)}
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="View Details"
                                onClick={() => handleViewDocument(doc)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Download File"
                                onClick={() => handleDirectDownload(doc)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title={doc.status === 'archived' ? 'Archived' : 'Archive Document'}
                                onClick={() => handleArchive(doc.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
