'use client';

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import type {
  InternshipWithRelations,
  InternshipUpdateInput,
  User,
} from '@/lib/api/admin-internships';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditInternshipModalProps {
  open: boolean;
  onClose: () => void;
  internship: InternshipWithRelations;
  onSuccess: () => void;
}

export function EditInternshipModal({
  open,
  onClose,
  internship,
  onSuccess,
}: EditInternshipModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);

  const [formData, setFormData] = useState<InternshipUpdateInput>({
    position: internship.position,
    department: internship.department,
    advisor_id: internship.advisor_id || undefined,
    supervisor_id: internship.supervisor_id || undefined,
    start_date: internship.start_date.split('T')[0],
    end_date: internship.end_date.split('T')[0],
    status: internship.status,
  });

  // Reset form data when internship changes
  useEffect(() => {
    if (open) {
      setFormData({
        position: internship.position,
        department: internship.department,
        advisor_id: internship.advisor_id || undefined,
        supervisor_id: internship.supervisor_id || undefined,
        start_date: internship.start_date.split('T')[0],
        end_date: internship.end_date.split('T')[0],
        status: internship.status,
      });
    }
  }, [open, internship]);

  // Fetch advisors and supervisors
  useEffect(() => {
    if (open) {
      if (internship.student?.university_id) {
        fetchAdvisors(internship.student.university_id);
      }
      if (internship.company_id) {
        fetchSupervisors(internship.company_id);
      }
    }
  }, [open, internship]);

  const fetchAdvisors = async (universityId: string) => {
    try {
      const response = await adminInternshipsAPI.getAdvisorsByUniversity(universityId);
      setAdvisors(response.data.advisors);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch advisors',
        variant: 'destructive',
      });
    }
  };

  const fetchSupervisors = async (companyId: string) => {
    try {
      const response = await adminInternshipsAPI.getSupervisorsByCompany(companyId);
      setSupervisors(response.data.supervisors);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch supervisors',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (new Date(formData.start_date!) >= new Date(formData.end_date!)) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await adminInternshipsAPI.updateInternship(internship.id, formData);
      toast({
        title: 'Success',
        description: 'Internship updated successfully',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update internship',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Internship</DialogTitle>
          <DialogDescription>
            Update internship details (student and company cannot be changed)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only Student Info */}
          <div className="space-y-2">
            <Label>Student (Cannot be changed)</Label>
            <Input
              value={`${internship.student?.name || 'Unknown'} (${internship.student?.email || 'N/A'})`}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Read-only Company Info */}
          <div className="space-y-2">
            <Label>Company (Cannot be changed)</Label>
            <Input
              value={internship.company?.name || 'Unknown'}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., Software Engineering Intern"
              disabled={loading}
              required
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Engineering, Marketing"
              disabled={loading}
            />
          </div>

          {/* Advisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="advisor">Advisor *</Label>
            <Select
              value={formData.advisor_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, advisor_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an advisor">
                  {formData.advisor_id && internship.advisor?.name
                    ? `${internship.advisor.name} (${internship.advisor.email})`
                    : 'Select an advisor'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Show current advisor first if not in the list */}
                {internship.advisor && !advisors.find(a => a.id === internship.advisor_id) && (
                  <SelectItem key={internship.advisor_id} value={internship.advisor_id}>
                    {internship.advisor.name} ({internship.advisor.email}) - Current
                  </SelectItem>
                )}
                {advisors.map((advisor) => (
                  <SelectItem key={advisor.id} value={advisor.id}>
                    {advisor.name} ({advisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supervisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="supervisor">Supervisor *</Label>
            <Select
              value={formData.supervisor_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor">
                  {formData.supervisor_id && internship.supervisor?.name
                    ? `${internship.supervisor.name} (${internship.supervisor.email})`
                    : 'Select a supervisor'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Show current supervisor first if not in the list */}
                {internship.supervisor && !supervisors.find(s => s.id === internship.supervisor_id) && (
                  <SelectItem key={internship.supervisor_id} value={internship.supervisor_id}>
                    {internship.supervisor.name} ({internship.supervisor.email}) - Current
                  </SelectItem>
                )}
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Internship
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
