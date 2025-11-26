'use client';

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import type {
  InternshipCreateInput,
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
import { createSupabaseClient } from '@/lib/supabase';

interface CreateInternshipModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateInternshipModal({
  open,
  onClose,
  onSuccess,
}: CreateInternshipModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const [formData, setFormData] = useState<InternshipCreateInput>({
    student_id: '',
    company_id: '',
    position: '',
    department: '',
    advisor_id: '',
    supervisor_id: '',
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  // Fetch available students
  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
      fetchCompanies();
    }
  }, [open]);

  // Fetch advisors when student is selected
  useEffect(() => {
    if (selectedStudent?.university_id) {
      fetchAdvisors(selectedStudent.university_id);
    }
  }, [selectedStudent]);

  // Fetch supervisors when company is selected
  useEffect(() => {
    if (formData.company_id) {
      fetchSupervisors(formData.company_id);
    }
  }, [formData.company_id]);

  const fetchAvailableStudents = async () => {
    try {
      const response = await adminInternshipsAPI.getAvailableStudents();
      setAvailableStudents(response.data.students);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch available students',
        variant: 'destructive',
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from('companies').select('id, name, industry');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive',
      });
    }
  };

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

  const handleStudentChange = (studentId: string) => {
    const student = availableStudents.find((s) => s.id === studentId);
    setSelectedStudent(student || null);
    setFormData({ ...formData, student_id: studentId, advisor_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.student_id ||
      !formData.company_id ||
      !formData.position ||
      !formData.advisor_id ||
      !formData.supervisor_id ||
      !formData.start_date ||
      !formData.end_date
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await adminInternshipsAPI.createInternship(formData);
      toast({
        title: 'Success',
        description: 'Internship created successfully',
      });
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create internship',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      student_id: '',
      company_id: '',
      position: '',
      department: '',
      advisor_id: '',
      supervisor_id: '',
      start_date: '',
      end_date: '',
      status: 'pending',
    });
    setSelectedStudent(null);
    setAdvisors([]);
    setSupervisors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Internship</DialogTitle>
          <DialogDescription>
            Assign a student to an internship with advisor and supervisor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Student *</Label>
            <Select
              value={formData.student_id}
              onValueChange={handleStudentChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Only students without active internships are shown
            </p>
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) =>
                setFormData({ ...formData, company_id: value, supervisor_id: '' })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} {company.industry && `(${company.industry})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Engineering, Marketing"
              disabled={loading}
            />
          </div>

          {/* Advisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="advisor">Advisor *</Label>
            <Select
              value={formData.advisor_id}
              onValueChange={(value) => setFormData({ ...formData, advisor_id: value })}
              disabled={loading || !selectedStudent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an advisor" />
              </SelectTrigger>
              <SelectContent>
                {advisors.map((advisor) => (
                  <SelectItem key={advisor.id} value={advisor.id}>
                    {advisor.name} ({advisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedStudent && (
              <p className="text-sm text-muted-foreground">
                Select a student first to see available advisors
              </p>
            )}
          </div>

          {/* Supervisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="supervisor">Supervisor *</Label>
            <Select
              value={formData.supervisor_id}
              onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
              disabled={loading || !formData.company_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor" />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.company_id && (
              <p className="text-sm text-muted-foreground">
                Select a company first to see available supervisors
              </p>
            )}
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Internship
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
