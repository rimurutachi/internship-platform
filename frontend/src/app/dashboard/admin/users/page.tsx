'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { Search, UserPlus, Archive, ArchiveRestore, Lock, Shield, Loader2, AlertTriangle, Eye, BookOpen, Hash, GraduationCap, Building2, Calendar, Mail, Pencil } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  adminAPI, 
  AdminUser, 
  UserStats, 
  CreateUserRequest,
  UpdateUserRequest 
} from '@/lib/api/services/admin';
import { adminCompaniesAPI, Company } from '@/lib/api/admin-companies';
import { createSupabaseClient } from '@/lib/supabase';

export default function UsersPage() {
  const { toast } = useToast();
  
  // State for users data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    students: 0,
    advisors: 0,
    supervisors: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterYearLevel, setFilterYearLevel] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<{ year_level: string; section: string }>({ year_level: '', section: '' });
  
  // Companies state for supervisor assignment
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Universities state for student/advisor assignment
  const [universities, setUniversities] = useState<Array<{id: string, name: string, code: string}>>([]);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page: currentPage,
        limit,
      };
      
      if (filterRole !== 'all') filters.role = filterRole;
      if (searchQuery) filters.search = searchQuery;
      if (filterProgram !== 'all') filters.program = filterProgram;
      if (filterYearLevel !== 'all') filters.year_level = filterYearLevel;
      if (filterSection.trim()) filters.section = filterSection.trim();
      
      const response = await adminAPI.getUsers(filters);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalUsers(response.pagination.total);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const statsData = await adminAPI.getUserStats();
      setStats(statsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch statistics',
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch companies for supervisor assignment
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await adminCompaniesAPI.getCompanies({ limit: 1000 });
      setCompanies(response.data.companies);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch companies',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Fetch universities for student/advisor assignment
  const fetchUniversities = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, code')
        .order('name');
      
      if (error) throw error;
      setUniversities(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch universities',
        variant: 'destructive',
      });
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchCompanies();
  }, [currentPage, filterRole, searchQuery, filterProgram, filterYearLevel, filterSection]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchQuery, filterProgram, filterYearLevel, filterSection]);

  // Helper to check if any advanced filter is active
  const hasActiveFilters = filterRole !== 'all' || filterProgram !== 'all' || filterYearLevel !== 'all' || filterSection.trim() !== '' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
    setFilterProgram('all');
    setFilterYearLevel('all');
    setFilterSection('');
    setCurrentPage(1);
  };

  // Create user handler
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate supervisor has company
    if (createForm.role === 'supervisor' && !createForm.company_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a company for the supervisor',
        variant: 'destructive',
      });
      return;
    }

    // Validate student/advisor has program
    if ((createForm.role === 'student' || createForm.role === 'advisor') && !createForm.program) {
      toast({
        title: 'Validation Error',
        description: 'Please select a program',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.createUser(createForm);
      toast({
        title: 'Success',
        description: createForm.role === 'student' 
          ? 'Student created and auto-assigned to matching advisor if available' 
          : 'User created successfully',
      });
      setCreateDialogOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', role: 'student', password: '', program: undefined, year_level: undefined, section: undefined });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Archive user handler (replaces delete)
  const handleArchiveUser = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await adminAPI.archiveUser(selectedUser.id);
      toast({
        title: 'User Archived',
        description: 'User data preserved for analytics. Login access disabled.',
      });
      setArchiveDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Unarchive user handler (NEW)
  const handleUnarchiveUser = async (userId: string) => {
    try {
      await adminAPI.unarchiveUser(userId);
      toast({
        title: 'User Restored',
        description: 'User has been unarchived and can login again',
      });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unarchive user',
        variant: 'destructive',
      });
    }
  };

  // Open archive dialog
  const openArchiveDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setArchiveDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      case 'advisor': return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'supervisor': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'admin': return 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
      case 'archived': return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
      default: return 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper to safely get user initials
  const getUserInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  // Helper to get program display name
  const getProgramDisplay = (user: AdminUser) => {
    const pd = user.profile_data;
    return pd?.program || pd?.course || pd?.department || null;
  };

  // Helper to get sections as display string
  const getSectionsDisplay = (user: AdminUser) => {
    const section = user.profile_data?.section;
    if (!section) return null;
    return section;
  };

  // Helper to get company display name
  const getCompanyDisplay = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : companyId;
  };

  // Handle view user details
  const handleViewUser = (user: AdminUser) => {
    setViewingUser(user);
    setViewDialogOpen(true);
  };

  // Handle open edit dialog
  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      year_level: user.year_level || '',
      section: user.profile_data?.section || '',
    });
    setEditDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const { updateUser: updateUserAPI } = await import('@/lib/api/services/admin');
      await updateUserAPI(editingUser.id, {
        year_level: editForm.year_level || undefined,
        section: editForm.section || undefined,
      } as any);
      setEditDialogOpen(false);
      setEditingUser(null);
      // Refresh user list
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
    } finally {
      setSubmitting(false);
    }
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
                  <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                  <p className="text-muted-foreground mt-1">Manage all platform users and permissions</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { fetchUsers(); fetchStats(); }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Refresh
                  </Button>
                  <Dialog open={createDialogOpen} onOpenChange={(open) => {
                    setCreateDialogOpen(open);
                    if (open) {
                      fetchCompanies(); // Fetch companies when dialog opens
                      fetchUniversities(); // Fetch universities for students/advisors
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the platform</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>First Name</Label>
                        <Input 
                          placeholder="John" 
                          className="mt-2"
                          value={createForm.firstName}
                          onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input 
                          placeholder="Doe" 
                          className="mt-2"
                          value={createForm.lastName}
                          onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          className="mt-2"
                          value={createForm.email}
                          onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input 
                          type="password" 
                          placeholder="Enter password" 
                          className="mt-2"
                          value={createForm.password}
                          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select 
                          value={createForm.role}
                          onValueChange={(value: any) => {
                            setCreateForm({ ...createForm, role: value, company_id: undefined });
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="advisor">Advisor</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Company dropdown - only show for supervisors */}
                      {createForm.role === 'supervisor' && (
                        <div>
                          <Label>Company <span className="text-destructive">*</span></Label>
                          {loadingCompanies ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : companies.length === 0 ? (
                            <div className="mt-2 text-sm text-muted-foreground">
                              No companies available. Please create a company first.
                            </div>
                          ) : (
                            <Select 
                              value={createForm.company_id}
                              onValueChange={(value: string) => setCreateForm({ ...createForm, company_id: value })}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent>
                                {companies.map((company) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name} {company.code ? `(${company.code})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                      
                      {/* Program & Section - for students and advisors (auto-assignment) */}
                      {(createForm.role === 'student' || createForm.role === 'advisor') && (
                        <>
                          <div>
                            <Label>Program <span className="text-destructive">*</span></Label>
                            <Select 
                              value={createForm.program}
                              onValueChange={(value: string) => setCreateForm({ ...createForm, program: value })}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BSPsych">Bachelor of Science in Psychology (BSPsych)</SelectItem>
                                <SelectItem value="BSCrim">Bachelor of Science in Criminology (BSCrim)</SelectItem>
                                <SelectItem value="BSIT">Bachelor of Science in Information Technology (BSIT)</SelectItem>
                                <SelectItem value="BSCS">Bachelor of Science in Computer Science (BSCS)</SelectItem>
                                <SelectItem value="BSEd-Math">Bachelor of Secondary Education major in Mathematics (BSEd-Math)</SelectItem>
                                <SelectItem value="BSEd-English">Bachelor of Secondary Education major in English (BSEd-English)</SelectItem>
                                <SelectItem value="BSEd-Filipino">Bachelor of Secondary Education major in Filipino (BSEd-Filipino)</SelectItem>
                                <SelectItem value="BSBA-HRM">BSBA major in Human Resource Management (BSBA-HRM)</SelectItem>
                                <SelectItem value="BSBA-MM">BSBA major in Marketing Management (BSBA-MM)</SelectItem>
                                <SelectItem value="BSHM">Bachelor of Science in Hospitality Management (BSHM)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Year Level <span className="text-destructive">*</span></Label>
                            {createForm.role === 'advisor' ? (
                              <>
                                <p className="text-xs text-muted-foreground mt-1 mb-2">
                                  Select one or more year levels this advisor handles
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yl) => {
                                    const selectedLevels = (createForm.year_level || '').split(',').map(s => s.trim()).filter(Boolean);
                                    const isSelected = selectedLevels.includes(yl);
                                    return (
                                      <button
                                        key={yl}
                                        type="button"
                                        onClick={() => {
                                          let newLevels: string[];
                                          if (isSelected) {
                                            newLevels = selectedLevels.filter(l => l !== yl);
                                          } else {
                                            newLevels = [...selectedLevels, yl];
                                          }
                                          setCreateForm({ ...createForm, year_level: newLevels.join(', ') });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                                          isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground'
                                        }`}
                                      >
                                        {yl}
                                      </button>
                                    );
                                  })}
                                </div>
                                {createForm.year_level && (
                                  <p className="text-xs text-muted-foreground mt-1.5">
                                    Selected: {createForm.year_level}
                                  </p>
                                )}
                              </>
                            ) : (
                              <Select 
                                value={createForm.year_level}
                                onValueChange={(value: string) => setCreateForm({ ...createForm, year_level: value })}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select year level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1st Year">1st Year</SelectItem>
                                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                                  <SelectItem value="4th Year">4th Year</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div>
                            <Label>Section</Label>
                            <Input 
                              placeholder="e.g., 4A, 4B, 3A" 
                              className="mt-2"
                              value={createForm.section || ''}
                              onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                            />
                            {createForm.role === 'student' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Students will be auto-assigned to their matching program &amp; year level advisor if available.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        onClick={handleCreateUser}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Create User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    {statsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Users</div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    {statsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.students}</div>
                        <div className="text-sm text-muted-foreground">Students</div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    {statsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.advisors}</div>
                        <div className="text-sm text-muted-foreground">Advisors</div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    {statsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.supervisors}</div>
                        <div className="text-sm text-muted-foreground">Supervisors</div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    {statsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-success">{stats.active}</div>
                        <div className="text-sm text-muted-foreground">Active</div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Row 1: Search + Role */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filterRole} onValueChange={setFilterRole}>
                        <SelectTrigger className="w-full md:w-44">
                          <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="student">Students</SelectItem>
                          <SelectItem value="advisor">Advisors</SelectItem>
                          <SelectItem value="supervisor">Supervisors</SelectItem>
                          <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Row 2: Program + Year Level + Section + Clear */}
                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                      <Select value={filterProgram} onValueChange={setFilterProgram}>
                        <SelectTrigger className="w-full md:w-56">
                          <SelectValue placeholder="All Programs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Programs</SelectItem>
                          <SelectItem value="BSPsych">BSPsych</SelectItem>
                          <SelectItem value="BSCrim">BSCrim</SelectItem>
                          <SelectItem value="BSIT">BSIT</SelectItem>
                          <SelectItem value="BSCS">BSCS</SelectItem>
                          <SelectItem value="BSEd-Math">BSEd-Math</SelectItem>
                          <SelectItem value="BSEd-English">BSEd-English</SelectItem>
                          <SelectItem value="BSEd-Filipino">BSEd-Filipino</SelectItem>
                          <SelectItem value="BSBA-HRM">BSBA-HRM</SelectItem>
                          <SelectItem value="BSBA-MM">BSBA-MM</SelectItem>
                          <SelectItem value="BSHM">BSHM</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterYearLevel} onValueChange={setFilterYearLevel}>
                        <SelectTrigger className="w-full md:w-44">
                          <SelectValue placeholder="All Year Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Year Levels</SelectItem>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="relative w-full md:w-36">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Section (e.g. 4A)"
                          value={filterSection}
                          onChange={(e) => setFilterSection(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Login</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {getUserInitials(user.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-semibold text-foreground">{user.name}</div>
                                      <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleColor(user.role)}>
                                    {user.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(user.is_archived || user.status === 'archived' ? 'archived' : 'active')}>
                                    {(user.is_archived || user.status === 'archived') ? 'Archived' : 'Active'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* View Details button */}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                      onClick={() => handleViewUser(user)}
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {/* Edit button — only for students and advisors (year level + section) */}
                                    {(user.role === 'student' || user.role === 'advisor') && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                        onClick={() => handleEditUser(user)}
                                        title="Edit Year Level & Section"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {/* Show Archive button for active users */}
                                    {!user.is_archived && user.status !== 'archived' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                        onClick={() => openArchiveDialog(user)}
                                        title="Archive User"
                                      >
                                        <Archive className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {/* Show Unarchive button for archived users */}
                                    {(user.is_archived || user.status === 'archived') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                        onClick={() => handleUnarchiveUser(user.id)}
                                        title="Restore User"
                                      >
                                        <ArchiveRestore className="w-4 h-4" />
                                      </Button>
                                    )}
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
                            Showing {users.length} of {totalUsers} users
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <span className="flex items-center px-3 text-sm">
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
            title="Users"
            subtitle="User Management"
            logo={
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="space-y-4">
            {/* Mobile Add Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                setCreateDialogOpen(true);
                fetchCompanies();
                fetchUniversities();
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>

            {/* Mobile Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  {statsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-xl font-bold text-foreground">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  {statsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.students}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  {statsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.advisors}</div>
                      <div className="text-xs text-muted-foreground">Advisors</div>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  {statsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-xl font-bold text-success">{stats.active}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mobile Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="advisor">Advisors</SelectItem>
                  <SelectItem value="supervisor">Supervisors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="BSPsych">BSPsych</SelectItem>
                  <SelectItem value="BSCrim">BSCrim</SelectItem>
                  <SelectItem value="BSIT">BSIT</SelectItem>
                  <SelectItem value="BSCS">BSCS</SelectItem>
                  <SelectItem value="BSEd-Math">BSEd-Math</SelectItem>
                  <SelectItem value="BSEd-English">BSEd-English</SelectItem>
                  <SelectItem value="BSEd-Filipino">BSEd-Filipino</SelectItem>
                  <SelectItem value="BSBA-HRM">BSBA-HRM</SelectItem>
                  <SelectItem value="BSBA-MM">BSBA-MM</SelectItem>
                  <SelectItem value="BSHM">BSHM</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYearLevel} onValueChange={setFilterYearLevel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Year Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Year Levels</SelectItem>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Section (e.g. 4A)"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full text-muted-foreground"
                >
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Mobile User Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                        {user.verified && <Shield className="w-4 h-4 text-success" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getRoleColor(user.role)} style={{ fontSize: '0.7rem' }}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.is_archived || user.status === 'archived' ? 'archived' : 'active')} style={{ fontSize: '0.7rem' }}>
                            {(user.is_archived || user.status === 'archived') ? 'Archived' : 'Active'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-primary"
                            onClick={() => handleViewUser(user)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {/* Edit button for students/advisors */}
                          {(user.role === 'student' || user.role === 'advisor') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600"
                              onClick={() => handleEditUser(user)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {!user.is_archived && user.status !== 'archived' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-amber-600"
                              onClick={() => openArchiveDialog(user)}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {(user.is_archived || user.status === 'archived') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-600"
                              onClick={() => handleUnarchiveUser(user.id)}
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Last login: {user.last_login ? formatDate(user.last_login) : 'Never'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <BottomNavigation type="admin" />
        </div>
      </div>

      {/* Archive User Dialog (replaces Delete Dialog) */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive User</DialogTitle>
            <DialogDescription>
              Archive <strong>{selectedUser?.name}</strong>? This will:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Preserve all data for analytics</p>
                <p className="text-muted-foreground text-xs">User records remain in database</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Disable login access</p>
                <p className="text-muted-foreground text-xs">User cannot log in to the platform</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArchiveRestore className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Can be restored later</p>
                <p className="text-muted-foreground text-xs">Use "Unarchive" button to restore access</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setArchiveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleArchiveUser}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
              Archive User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-5">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getUserInitials(viewingUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{viewingUser.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {viewingUser.email}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getRoleColor(viewingUser.role)}>
                      {viewingUser.role.charAt(0).toUpperCase() + viewingUser.role.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(viewingUser.is_archived || viewingUser.status === 'archived' ? 'archived' : 'active')}>
                      {(viewingUser.is_archived || viewingUser.status === 'archived') ? 'Archived' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Role-specific details */}
              <div className="border rounded-lg divide-y">
                {/* Program - for students and advisors */}
                {(viewingUser.role === 'student' || viewingUser.role === 'advisor') && getProgramDisplay(viewingUser) && (
                  <div className="flex items-center gap-3 p-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Program</p>
                      <p className="text-sm font-medium">{getProgramDisplay(viewingUser)}</p>
                    </div>
                  </div>
                )}

                {/* Year Level - for students and advisors */}
                {(viewingUser.role === 'student' || viewingUser.role === 'advisor') && viewingUser.year_level && (
                  <div className="flex items-center gap-3 p-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {viewingUser.role === 'advisor' ? 'Year Level(s) Handled' : 'Year Level'}
                      </p>
                      {viewingUser.role === 'advisor' && viewingUser.year_level.includes(',') ? (
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {viewingUser.year_level.split(',').map((yl: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {yl.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{viewingUser.year_level}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Section(s) - for students and advisors */}
                {(viewingUser.role === 'student' || viewingUser.role === 'advisor') && getSectionsDisplay(viewingUser) && (
                  <div className="flex items-center gap-3 p-3">
                    <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {viewingUser.role === 'advisor' ? 'Section(s) Handled' : 'Section'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {getSectionsDisplay(viewingUser)!.split(',').map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            Section {s.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Company - for supervisors */}
                {viewingUser.role === 'supervisor' && viewingUser.company_id && (
                  <div className="flex items-center gap-3 p-3">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Company</p>
                      <p className="text-sm font-medium">{getCompanyDisplay(viewingUser.company_id)}</p>
                    </div>
                  </div>
                )}

                {/* Assigned Advisor - for students */}
                {viewingUser.role === 'student' && viewingUser.profile_data?.assigned_advisor_name && (
                  <div className="flex items-center gap-3 p-3">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Advisor</p>
                      <p className="text-sm font-medium">{viewingUser.profile_data.assigned_advisor_name}</p>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="flex items-center gap-3 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Created</p>
                    <p className="text-sm font-medium">{formatDate(viewingUser.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium">{viewingUser.last_login ? formatDate(viewingUser.last_login) : 'Never'}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="w-full">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog — Year Level & Section only */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-indigo-600" />
              Edit User Details
            </DialogTitle>
            <DialogDescription>
              Editing <strong>{editingUser?.name}</strong>
              {' '}({editingUser?.role}) — only Year Level and Section can be changed here.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-5 py-2">
              {/* Year Level */}
              <div>
                <Label className="text-sm font-medium">Year Level</Label>
                {editingUser.role === 'advisor' ? (
                  <>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">
                      Select one or more year levels this advisor handles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yl) => {
                        const selectedLevels = (editForm.year_level || '').split(',').map(s => s.trim()).filter(Boolean);
                        const isSelected = selectedLevels.includes(yl);
                        return (
                          <button
                            key={yl}
                            type="button"
                            onClick={() => {
                              let newLevels: string[];
                              if (isSelected) {
                                newLevels = selectedLevels.filter(l => l !== yl);
                              } else {
                                newLevels = [...selectedLevels, yl];
                              }
                              setEditForm({ ...editForm, year_level: newLevels.join(', ') });
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            {yl}
                          </button>
                        );
                      })}
                    </div>
                    {editForm.year_level && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Selected: <span className="font-medium text-foreground">{editForm.year_level}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <Select
                    value={editForm.year_level}
                    onValueChange={(v) => setEditForm({ ...editForm, year_level: v })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Section */}
              <div>
                <Label className="text-sm font-medium">Section</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                  {editingUser.role === 'advisor'
                    ? 'Comma-separated list of sections handled (e.g., 4A, 4B)'
                    : 'The section of this student (e.g., 4A)'}
                </p>
                <Input
                  value={editForm.section}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  placeholder={editingUser.role === 'advisor' ? 'e.g., 4A, 4B' : 'e.g., 4A'}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
