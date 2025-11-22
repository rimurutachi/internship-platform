'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Lock, Unlock, Shield, Loader2 } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'student',
    password: '',
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest>({
    firstName: '',
    lastName: '',
    email: '',
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
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchQuery) filters.search = searchQuery;
      
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

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, filterRole, filterStatus, searchQuery]);

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

    try {
      setSubmitting(true);
      await adminAPI.createUser(createForm);
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
      setCreateDialogOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', role: 'student', password: '' });
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

  // Update user handler
  const handleUpdateUser = async () => {
    if (!selectedUser || (!editForm.firstName && !editForm.lastName && !editForm.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please provide at least one field to update',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await adminAPI.updateUser(selectedUser.id, editForm);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      setEditDialogOpen(false);
      setSelectedUser(null);
      setEditForm({ firstName: '', lastName: '', email: '' });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update user status handler (inline)
  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      toast({
        title: 'Success',
        description: 'User status updated successfully',
      });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  // Delete user handler
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await adminAPI.deleteUser(selectedUser.id);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    // Split name into first and last name for editing
    const nameParts = (user.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    setEditForm({ firstName, lastName, email: user.email });
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
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
      case 'active': return 'bg-success/10 text-success dark:bg-success/20';
      case 'inactive': return 'bg-warning/10 text-warning dark:bg-warning/20';
      case 'suspended': return 'bg-error/10 text-error dark:bg-error/20';
      default: return 'bg-muted text-muted-foreground';
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
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                          onValueChange={(value: any) => setCreateForm({ ...createForm, role: value })}
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
                  <div className="flex flex-col md:flex-row gap-4">
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
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="advisor">Advisors</SelectItem>
                        <SelectItem value="supervisor">Supervisors</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
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
                              <TableHead>Verified</TableHead>
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
                                  <Select 
                                    value={user.status}
                                    onValueChange={(value: any) => handleUpdateStatus(user.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <Badge className={getStatusColor(user.status)}>
                                        {user.status}
                                      </Badge>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                                </TableCell>
                                <TableCell>
                                  {user.verified ? (
                                    <Shield className="w-4 h-4 text-success" />
                                  ) : (
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openEditDialog(user)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-error hover:text-error/80"
                                      onClick={() => openDeleteDialog(user)}
                                    >
                                      <Trash2 className="w-4 h-4" />
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
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary hover:bg-primary/90">
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
                      onValueChange={(value: any) => setCreateForm({ ...createForm, role: value })}
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
              <div className="flex gap-2">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="advisor">Advisors</SelectItem>
                    <SelectItem value="supervisor">Supervisors</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                        <div className="flex gap-2">
                          <Badge className={getRoleColor(user.role)} style={{ fontSize: '0.7rem' }}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.status)} style={{ fontSize: '0.7rem' }}>
                            {user.status}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-error"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>First Name</Label>
              <Input 
                placeholder="John" 
                className="mt-2"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input 
                placeholder="Doe" 
                className="mt-2"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="john@example.com" 
                className="mt-2"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
