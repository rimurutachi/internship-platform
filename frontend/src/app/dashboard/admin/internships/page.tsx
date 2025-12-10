'use client';

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import type {
  InternshipWithRelations,
  InternshipFilters,
  InternshipStats,
} from '@/lib/api/admin-internships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  Edit,
  Archive,
  Eye,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { CreateInternshipModal } from '@/components/admin/CreateInternshipModal';
import { EditInternshipModal } from '@/components/admin/EditInternshipModal';
import { ViewInternshipModal } from '@/components/admin/ViewInternshipModal';
import { ArchiveInternshipDialog } from '@/components/admin/ArchiveInternshipDialog';
import { UnarchiveInternshipDialog } from '@/components/admin/UnarchiveInternshipDialog';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { useUserContext } from '@/components/providers/UserProvider';

export default function AdminInternshipsPage() {
  const { toast } = useToast();
  const { user } = useUserContext();
  const [internships, setInternships] = useState<InternshipWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InternshipStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<InternshipFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<InternshipWithRelations | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fetch internships
  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await adminInternshipsAPI.getInternships(filters);
      setInternships(response.data.internships);
      setPagination(response.data.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch internships',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await adminInternshipsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (key: keyof InternshipFilters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  // Handle status badge color
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      pending: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Handle view internship
  const handleView = (internship: InternshipWithRelations) => {
    setSelectedInternship(internship);
    setViewModalOpen(true);
  };

  // Handle edit internship
  const handleEdit = (internship: InternshipWithRelations) => {
    setSelectedInternship(internship);
    setEditModalOpen(true);
  };

  // Handle archive internship
  const handleArchive = (internship: InternshipWithRelations) => {
    setSelectedInternship(internship);
    setArchiveDialogOpen(true);
  };

  // Handle unarchive internship
  const handleUnarchive = (internship: InternshipWithRelations) => {
    setSelectedInternship(internship);
    setUnarchiveDialogOpen(true);
  };

  // Handle successful create/update/archive
  const handleSuccess = () => {
    fetchInternships();
    fetchStats();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setArchiveDialogOpen(false);
    setUnarchiveDialogOpen(false);
    setSelectedInternship(null);
  };

  // Handle bulk actions
  const handleSelectAll = () => {
    if (selectedIds.length === internships.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(internships.map(i => i.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkActionComplete = () => {
    setSelectedIds([]);
    fetchInternships();
    fetchStats();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = () => {
    if (!user?.first_name || !user?.last_name) return 'AD';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const initials = getInitials();

  const InternshipsContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Internships Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student internship assignments and relationships
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Internship
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Filter internships by status, university, or company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by student name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-sm"
                />
                <Button onClick={handleSearch} variant="secondary" size="sm" className="sm:size-default">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('status', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={() => {
                setFilters({ page: 1, limit: 20 });
                setSearchTerm('');
                fetchInternships();
              }}
              variant="outline"
              size="sm"
              className="sm:size-default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Internships Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Internships List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {pagination.total} total internship{pagination.total !== 1 ? 's' : ''}
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="mb-4">
              <BulkActionsToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                onActionComplete={handleBulkActionComplete}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : internships.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No internships found. Create one to get started.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === internships.length && internships.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Advisor</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {internships.map((internship) => (
                      <TableRow key={internship.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(internship.id)}
                            onCheckedChange={() => handleSelectOne(internship.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div>{internship.student?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">
                              {internship.student?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{internship.company?.name || 'N/A'}</TableCell>
                        <TableCell>{internship.position}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {internship.department || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{internship.advisor?.name || 'N/A'}</TableCell>
                        <TableCell>{internship.supervisor?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {internship.is_archived && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                <Archive className="h-3 w-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                            {getStatusBadge(internship.status)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(internship.start_date)}</TableCell>
                        <TableCell>{formatDate(internship.end_date)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(internship)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(internship)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {internship.is_archived ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnarchive(internship)}
                                title="Unarchive internship"
                              >
                                <Archive className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(internship)}
                                title="Archive internship"
                              >
                                <Archive className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {internships.map((internship) => (
                  <Card key={internship.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{internship.student?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{internship.student?.email}</div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {internship.is_archived && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                <Archive className="h-3 w-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                            {getStatusBadge(internship.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Company:</span>
                            <div className="font-medium">{internship.company?.name || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Position:</span>
                            <div className="font-medium">{internship.position}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Advisor:</span>
                            <div className="font-medium">{internship.advisor?.name || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Supervisor:</span>
                            <div className="font-medium">{internship.supervisor?.name || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Start:</span>
                            <div className="font-medium">{formatDate(internship.start_date)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End:</span>
                            <div className="font-medium">{formatDate(internship.end_date)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleView(internship)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(internship)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {internship.is_archived ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnarchive(internship)}
                              title="Unarchive"
                            >
                              <Archive className="h-3 w-3 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(internship)}
                              title="Archive"
                            >
                              <Archive className="h-3 w-3 text-orange-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateInternshipModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {selectedInternship && (
        <>
          <EditInternshipModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedInternship(null);
            }}
            internship={selectedInternship}
            onSuccess={handleSuccess}
          />

          <ViewInternshipModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedInternship(null);
            }}
            internshipId={selectedInternship.id}
          />

          <ArchiveInternshipDialog
            open={archiveDialogOpen}
            onClose={() => {
              setArchiveDialogOpen(false);
              setSelectedInternship(null);
            }}
            internship={selectedInternship}
            onSuccess={handleSuccess}
          />

          <UnarchiveInternshipDialog
            open={unarchiveDialogOpen}
            onClose={() => {
              setUnarchiveDialogOpen(false);
              setSelectedInternship(null);
            }}
            internship={selectedInternship}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Desktop View */}
      <div className="hidden lg:flex h-full">
        {/* Left Sidebar */}
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <AdminHeader />
          
          {/* Page Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <InternshipsContent />
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden h-screen flex flex-col overflow-hidden">
        {/* Mobile Header - Fixed */}
        <div className="flex-shrink-0">
          <MobileHeader 
            title="Internships"
            subtitle="Management"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{initials}</span>
              </div>
            }
          />
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <InternshipsContent />
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>
    </div>
  );
}
