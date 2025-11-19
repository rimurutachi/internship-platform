'use client';

import { useState } from 'react';
import { Search, UserPlus, Edit, Trash2, Lock, Unlock, Shield } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'advisor' | 'supervisor' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  verified: boolean;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    role: 'student',
    status: 'active',
    lastLogin: '2025-11-18 09:30 AM',
    createdAt: '2025-09-01',
    verified: true
  },
  {
    id: '2',
    name: 'Dr. Jane Smith',
    email: 'jane.smith@university.edu',
    role: 'advisor',
    status: 'active',
    lastLogin: '2025-11-18 08:15 AM',
    createdAt: '2025-08-15',
    verified: true
  },
  {
    id: '3',
    name: 'John Doe',
    email: 'john.doe@techcorp.com',
    role: 'supervisor',
    status: 'active',
    lastLogin: '2025-11-17 02:45 PM',
    createdAt: '2025-08-20',
    verified: true
  },
  {
    id: '4',
    name: 'Bob Martinez',
    email: 'bob.m@university.edu',
    role: 'student',
    status: 'inactive',
    lastLogin: '2025-11-10 11:20 AM',
    createdAt: '2025-09-05',
    verified: false
  },
  {
    id: '5',
    name: 'Sarah Williams',
    email: 'sarah.w@university.edu',
    role: 'student',
    status: 'active',
    lastLogin: '2025-11-18 10:15 AM',
    createdAt: '2025-09-03',
    verified: true
  },
  {
    id: '6',
    name: 'Prof. Michael Chen',
    email: 'michael.chen@university.edu',
    role: 'advisor',
    status: 'active',
    lastLogin: '2025-11-18 07:45 AM',
    createdAt: '2025-08-10',
    verified: true
  }
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: mockUsers.length,
    students: mockUsers.filter(u => u.role === 'student').length,
    advisors: mockUsers.filter(u => u.role === 'advisor').length,
    supervisors: mockUsers.filter(u => u.role === 'supervisor').length,
    active: mockUsers.filter(u => u.status === 'active').length
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
                <Dialog>
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
                        <Label>Full Name</Label>
                        <Input placeholder="John Doe" className="mt-2" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" placeholder="john@example.com" className="mt-2" />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select>
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
                      <Button className="w-full bg-primary hover:bg-primary/90">Create User</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.students}</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.advisors}</div>
                    <div className="text-sm text-muted-foreground">Advisors</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.supervisors}</div>
                    <div className="text-sm text-muted-foreground">Supervisors</div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-card transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-success">{stats.active}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
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
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {user.name.split(' ').map(n => n[0]).join('')}
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
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                            <TableCell>
                              {user.verified ? (
                                <Shield className="w-4 h-4 text-success" />
                              ) : (
                                <Shield className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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
            <Dialog>
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
                    <Label>Full Name</Label>
                    <Input placeholder="John Doe" className="mt-2" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="john@example.com" className="mt-2" />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select>
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
                  <Button className="w-full bg-primary hover:bg-primary/90">Create User</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Mobile Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xl font-bold text-foreground">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.students}</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.advisors}</div>
                  <div className="text-xs text-muted-foreground">Advisors</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="text-xl font-bold text-success">{stats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
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
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Last login: {user.lastLogin}
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
