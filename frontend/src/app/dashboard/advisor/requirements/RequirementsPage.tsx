'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { AdvisorSidebar } from '@/components/advisor/AdvisorSidebar';
import { AdvisorHeader } from '@/components/advisor/AdvisorHeader';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DocumentRequirement,
  getAdvisorDocumentRequirements,
  createDocumentRequirement,
  updateDocumentRequirement,
  deleteDocumentRequirement,
  CreateRequirementDTO,
} from '@/lib/api/document-requirements';

export default function DocumentRequirementsPage() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<DocumentRequirement | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateRequirementDTO>({
    title: '',
    description: '',
    due_date: '',
    is_mandatory: true,
    target_audience: 'all_students',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdvisorDocumentRequirements({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      
      if (response.success) {
        setRequirements(response.data);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch document requirements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Filter requirements
  const filteredRequirements = requirements.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Create requirement
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await createDocumentRequirement(formData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Document requirement created successfully',
        });
        setShowCreateDialog(false);
        resetForm();
        fetchRequirements();
      }
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document requirement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update requirement
  const handleUpdate = async () => {
    if (!selectedRequirement) return;

    try {
      setSubmitting(true);
      const response = await updateDocumentRequirement(selectedRequirement.id, formData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Document requirement updated successfully',
        });
        setShowEditDialog(false);
        setSelectedRequirement(null);
        resetForm();
        fetchRequirements();
      }
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document requirement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete (archive) requirement
  const handleDelete = async () => {
    if (!selectedRequirement) return;

    try {
      setSubmitting(true);
      const response = await deleteDocumentRequirement(selectedRequirement.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Document requirement archived successfully',
        });
        setShowDeleteDialog(false);
        setSelectedRequirement(null);
        fetchRequirements();
      }
    } catch (error) {
      console.error('Error archiving requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive document requirement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      is_mandatory: true,
      target_audience: 'all_students',
    });
  };

  // Open edit dialog
  const openEditDialog = (requirement: DocumentRequirement) => {
    setSelectedRequirement(requirement);
    setFormData({
      title: requirement.title,
      description: requirement.description || '',
      due_date: requirement.due_date || '',
      is_mandatory: requirement.is_mandatory,
      target_audience: requirement.target_audience,
      metadata: requirement.metadata,
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (requirement: DocumentRequirement) => {
    setSelectedRequirement(requirement);
    setShowDeleteDialog(true);
  };

  // Get status badge
  const getStatusBadge = (requirement: DocumentRequirement) => {
    const stats = requirement.submission_stats;
    if (!stats || stats.total_submissions === 0) {
      return <Badge variant="outline">No submissions</Badge>;
    }
    
    if (stats.pending > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {stats.pending} pending
        </Badge>
      );
    }
    
    if (stats.approved === stats.total_submissions) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          All approved
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        {stats.approved}/{stats.total_submissions} approved
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: requirements.length,
    active: requirements.filter((r) => r.status === 'active').length,
    withPending: requirements.filter((r) => (r.submission_stats?.pending || 0) > 0).length,
    overdue: requirements.filter((r) => r.due_date && new Date(r.due_date) < new Date()).length,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <AdvisorSidebar />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {isMobile ? (
          <MobileHeader title="Document Requirements" />
        ) : (
          <AdvisorHeader />
        )}

        {/* Content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-4 lg:p-6",
          isMobile && "pb-20"
        )}>
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Requirements</h1>
              <p className="text-gray-600 mt-1">
                Create and manage document requirements for your students
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="w-full lg:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Requirement
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-semibold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-xl font-semibold">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Review</p>
                    <p className="text-xl font-semibold">{stats.withPending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Past Due</p>
                    <p className="text-xl font-semibold">{stats.overdue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'active' | 'archived') => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full lg:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requirements List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredRequirements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No document requirements
                </h3>
                <p className="text-gray-500 text-center mb-4">
                  Create your first document requirement to start collecting submissions from students.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Requirement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequirements.map((requirement) => (
                <Card key={requirement.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {requirement.title}
                          </h3>
                          {requirement.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {requirement.status === 'archived' && (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                        </div>
                        
                        {requirement.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {requirement.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {requirement.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Due: {new Date(requirement.due_date).toLocaleDateString()}
                              </span>
                              {new Date(requirement.due_date) < new Date() && (
                                <Badge variant="destructive" className="ml-1 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {requirement.target_audience === 'all_students'
                                ? 'All students'
                                : requirement.target_audience === 'specific_internship'
                                ? 'Specific internships'
                                : 'Specific students'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {getStatusBadge(requirement)}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/advisor/requirements/${requirement.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(requirement)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(requirement)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Mobile Navigation */}
        {isMobile && <BottomNavigation type="advisor" />}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Document Requirement</DialogTitle>
            <DialogDescription>
              Create a new document requirement for your students.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Internship Agreement Form"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this document should contain..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value: 'all_students' | 'specific_internship' | 'specific_student') =>
                  setFormData({ ...formData, target_audience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">All Students</SelectItem>
                  <SelectItem value="specific_internship">Specific Internship</SelectItem>
                  <SelectItem value="specific_student">Specific Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_mandatory"
                checked={formData.is_mandatory}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_mandatory">This is a mandatory document</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Requirement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Document Requirement</DialogTitle>
            <DialogDescription>
              Update the document requirement details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date</Label>
              <Input
                id="edit-due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-target_audience">Target Audience</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value: 'all_students' | 'specific_internship' | 'specific_student') =>
                  setFormData({ ...formData, target_audience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">All Students</SelectItem>
                  <SelectItem value="specific_internship">Specific Internship</SelectItem>
                  <SelectItem value="specific_student">Specific Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is_mandatory"
                checked={formData.is_mandatory}
                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-is_mandatory">This is a mandatory document</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Document Requirement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the document requirement &quot;{selectedRequirement?.title}&quot;.
              Students will no longer be able to submit documents for this requirement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
