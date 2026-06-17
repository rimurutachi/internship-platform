'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { adminCompaniesAPI } from '@/lib/api/admin-companies';
import type {
  CompanyWithSupervisors,
  CompanyFilters,
  CompanyStats,
} from '@/lib/api/admin-companies';
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
  RefreshCw,
  Building2,
  Users,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { useUserContext } from '@/components/providers/UserProvider';
import { CreateCompanyModal } from '@/components/admin/CreateCompanyModal';
import { EditCompanyModal } from '@/components/admin/EditCompanyModal';
import { ViewCompanyModal } from '@/components/admin/ViewCompanyModal';
import { ArchiveCompanyDialog } from '@/components/admin/ArchiveCompanyDialog';
import { UnarchiveCompanyDialog } from '@/components/admin/UnarchiveCompanyDialog';

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { user } = useUserContext();
  const [companies, setCompanies] = useState<CompanyWithSupervisors[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<CompanyFilters>({
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
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyWithSupervisors | null>(null);

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await adminCompaniesAPI.getCompanies(filters);
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await adminCompaniesAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  // Handle filter change
  const handleFilterChange = (key: keyof CompanyFilters, value: string | boolean) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  // Handle view company
  const handleView = (company: CompanyWithSupervisors) => {
    setSelectedCompany(company);
    setViewModalOpen(true);
  };

  // Handle edit company
  const handleEdit = (company: CompanyWithSupervisors) => {
    setSelectedCompany(company);
    setEditModalOpen(true);
  };

  // Handle archive company
  const handleArchive = (company: CompanyWithSupervisors) => {
    setSelectedCompany(company);
    setArchiveDialogOpen(true);
  };

  // Handle unarchive company
  const handleUnarchive = (company: CompanyWithSupervisors) => {
    setSelectedCompany(company);
    setUnarchiveDialogOpen(true);
  };

  // Handle successful create/update/archive
  const handleSuccess = () => {
    fetchCompanies();
    fetchStats();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setArchiveDialogOpen(false);
    setUnarchiveDialogOpen(false);
    setSelectedCompany(null);
  };

  const getInitials = () => {
    if (!user?.first_name || !user?.last_name) return 'AD';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const initials = getInitials();

  const CompaniesContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Companies Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage partner companies and their supervisors
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Verified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                With MOA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.with_moa}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Supervisors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.total_supervisors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.total_capacity}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-cyan-600">{stats.active_partnerships}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Filter companies by name or industry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by company name..."
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

            {/* Verified Filter */}
            <div className="w-full md:w-48">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.is_verified === undefined ? 'all' : filters.is_verified.toString()}
                onValueChange={(value) =>
                  handleFilterChange('is_verified', value === 'all' ? true : value === 'true')
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="true">Verified Only</SelectItem>
                  <SelectItem value="false">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button
              onClick={() => {
                setFilters({ page: 1, limit: 20 });
                setSearchTerm('');
                fetchCompanies();
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

      {/* Companies Table/List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Companies List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {pagination.total} total compan{pagination.total !== 1 ? 'ies' : 'y'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No companies found. Add one to get started.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Supervisors</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {company.industry || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{company.code || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{company.supervisor_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>{company.capacity_limit || 10}</TableCell>
                        <TableCell>
                          <span className={(company.current_students || 0) >= (company.capacity_limit || 10) ? 'text-red-600 font-semibold' : ''}>
                            {company.current_students || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {company.is_archived && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                <Archive className="h-3 w-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                            {company.is_verified && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {company.is_moa_standardized && (
                              <Badge variant="secondary" className="text-xs">
                                <FileCheck className="h-3 w-3 mr-1" />
                                MOA
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(company)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {company.is_archived ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnarchive(company)}
                                title="Unarchive company"
                              >
                                <Archive className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(company)}
                                title="Archive company"
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
                {companies.map((company) => (
                  <Card key={company.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{company.name}</div>
                            <div className="text-xs text-muted-foreground">{company.industry || 'No industry'}</div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {company.is_archived && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600 dark:border-gray-600 dark:text-gray-400">
                                <Archive className="h-3 w-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                            {company.is_verified && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            {company.is_moa_standardized && (
                              <Badge variant="secondary" className="text-xs">
                                MOA
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Code:</span>
                            <div className="font-medium font-mono">{company.code || 'N/A'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Supervisors:</span>
                            <div className="font-medium">{company.supervisor_count || 0}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Capacity:</span>
                            <div className="font-medium">{company.capacity_limit || 10}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Students:</span>
                            <div className={`font-medium ${(company.current_students || 0) >= (company.capacity_limit || 10) ? 'text-red-600' : ''}`}>
                              {company.current_students || 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleView(company)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {company.is_archived ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnarchive(company)}
                              title="Unarchive"
                            >
                              <Archive className="h-3 w-3 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(company)}
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
      <CreateCompanyModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {selectedCompany && (
        <>
          <EditCompanyModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
            onSuccess={handleSuccess}
          />

          <ViewCompanyModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedCompany(null);
            }}
            companyId={selectedCompany.id}
          />

          <ArchiveCompanyDialog
            open={archiveDialogOpen}
            onClose={() => {
              setArchiveDialogOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
            onSuccess={handleSuccess}
          />

          <UnarchiveCompanyDialog
            open={unarchiveDialogOpen}
            onClose={() => {
              setUnarchiveDialogOpen(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );

  return <CompaniesContent />;
}
