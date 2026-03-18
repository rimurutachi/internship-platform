'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useState, useEffect } from 'react';
import { adminInternshipsAPI } from '@/lib/api/admin-internships';
import { hoursApi } from '@/lib/api/hours';
import type {
  InternshipCreateInput,
  User,
} from '@/lib/api/admin-internships';
import type { ProgramHours } from '@/types/hours';
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
import { Loader2, Clock, Calendar, Info } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase';
import CompanyStatusCard from './CompanyStatusCard';
import adminInternshipsEnhancedAPI from '@/lib/api/admin-internships-enhanced';
import type { CompanyCapacityInfo } from '@/types/internships-enhanced';

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
  const [companyCapacity, setCompanyCapacity] = useState<CompanyCapacityInfo | null>(null);
  const [loadingCapacity, setLoadingCapacity] = useState(false);
  
  // Program hours state
  const [programs, setPrograms] = useState<ProgramHours[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramHours | null>(null);
  const [useCustomHours, setUseCustomHours] = useState(false);

  const [formData, setFormData] = useState<InternshipCreateInput & { required_hours?: number; program_code?: string }>({
    student_id: '',
    company_id: '',
    position: '',
    department: '',
    advisor_id: '',
    supervisor_id: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    required_hours: 0,
    program_code: '',
  });

  // Helper function to fetch CVSU-BC advisors
  const fetchCVSUAdvisors = async () => {
    try {
      // Fetch CVSU-BC university
      const supabase = createSupabaseClient();
      const { data: university, error } = await supabase
        .from('universities')
        .select('id')
        .eq('code', 'CVSU-BC')
        .single();
      
      if (error) throw error;
      
      if (university) {
        // Fetch advisors for CVSU-BC
        try {
          console.log('Fetching advisors for CVSU-BC university:', university.id);
          const response = await adminInternshipsAPI.getAdvisorsByUniversity(university.id);
          console.log('CVSU-BC Advisors fetched:', response.data.advisors);
          setAdvisors(response.data.advisors);
          
          if (response.data.advisors.length === 0) {
            toast({
              title: 'No Advisors Found',
              description: 'There are no advisors registered for CVSU-BC yet.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error fetching advisors:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch advisors',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching CVSU university:', error);
    }
  };

  // Fetch available students + companies + programs + advisors when modal opens
  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
      fetchCompanies();
      fetchPrograms();
      // Auto-fetch CVSU-BC advisors since all advisors belong to this university
      fetchCVSUAdvisors();
    }
  }, [open]);

  // Fetch programs for hours selection
  const fetchPrograms = async () => {
    try {
      const result = await hoursApi.getAllPrograms();
      if (result.success && result.data) {
        setPrograms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  // Calculate projected end date when start_date or required_hours changes
  useEffect(() => {
    if (formData.start_date && formData.required_hours && formData.required_hours > 0) {
      const projectedEndDate = calculateProjectedEndDate(formData.start_date, formData.required_hours);
      setFormData(prev => ({ ...prev, end_date: projectedEndDate }));
    }
  }, [formData.start_date, formData.required_hours]);

  // Helper function to calculate projected end date
  const calculateProjectedEndDate = (startDate: string, requiredHours: number): string => {
    const HOURS_PER_DAY = 8;
    const requiredDays = Math.ceil(requiredHours / HOURS_PER_DAY);
    
    const start = new Date(startDate);
    let businessDaysAdded = 0;
    const current = new Date(start);
    
    while (businessDaysAdded < requiredDays) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
        businessDaysAdded++;
      }
    }
    
    return current.toISOString().split('T')[0];
  };

  // NOTE: Advisor fetching is done once on modal open (fetchCVSUAdvisors in the open useEffect).
  // We do NOT re-fetch advisors when selectedStudent changes because:
  // 1. All advisors belong to CVSU-BC (already fetched)
  // 2. Re-fetching on selectedStudent change caused an infinite re-render loop

  // Fetch supervisors when company is selected
  useEffect(() => {
    if (formData.company_id) {
      fetchSupervisors(formData.company_id);
      loadCompanyCapacity(formData.company_id);
    } else {
      setCompanyCapacity(null);
    }
  }, [formData.company_id]);

  const loadCompanyCapacity = async (companyId: string) => {
    try {
      setLoadingCapacity(true);
      const companies = await adminInternshipsEnhancedAPI.getCapacityOverview();
      const company = Array.isArray(companies) ? companies.find(c => c.id === companyId) : null;
      setCompanyCapacity(company || null);
    } catch (error) {
      console.error('Failed to load company capacity:', error);
    } finally {
      setLoadingCapacity(false);
    }
  };

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


  const fetchSupervisors = async (companyId: string) => {
    try {
      console.log('Fetching supervisors for company:', companyId);
      const response = await adminInternshipsAPI.getSupervisorsByCompany(companyId);
      console.log('Supervisors fetched:', response.data.supervisors);
      setSupervisors(response.data.supervisors);
      
      if (response.data.supervisors.length === 0) {
        toast({
          title: 'No Supervisors Found',
          description: 'There are no supervisors registered for this company yet.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
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

    // Check if student has a pre-assigned advisor
    const assignedAdvisorId = student?.profile_data?.assigned_advisor_id;
    const assignedAdvisorName = student?.profile_data?.assigned_advisor_name;

    if (assignedAdvisorId) {
      // Auto-select the pre-assigned advisor — use functional updater to avoid stale closure
      setFormData(prev => ({ ...prev, student_id: studentId, advisor_id: assignedAdvisorId }));
      toast({
        title: '✅ Advisor Auto-Selected',
        description: `${assignedAdvisorName || 'Assigned advisor'} has been automatically selected based on the student's program assignment.`,
      });
    } else {
      // No pre-assigned advisor – clear the advisor field and let admin pick
      setFormData(prev => ({ ...prev, student_id: studentId, advisor_id: '' }));
    }
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
      !formData.required_hours ||
      formData.required_hours < 40
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields. Required hours must be at least 40.',
        variant: 'destructive',
      });
      return;
    }

    // Check company capacity
    if (companyCapacity?.is_at_capacity) {
      toast({
        title: 'Capacity Error',
        description: 'This company is at full capacity and cannot accept more students',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create internship — include required_hours so the backend saves the correct value
      const internshipData = {
        student_id: formData.student_id,
        company_id: formData.company_id,
        position: formData.position,
        department: formData.department,
        advisor_id: formData.advisor_id,
        supervisor_id: formData.supervisor_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
        required_hours: formData.required_hours,   // ← was missing before!
        program_code: formData.program_code || '',  // ← was missing before!
      };
      
      await adminInternshipsAPI.createInternship(internshipData);
      
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
      required_hours: 0,
      program_code: '',
    });
    setSelectedStudent(null);
    setSelectedProgram(null);
    setUseCustomHours(false);
    setAdvisors([]);
    setSupervisors([]);
    onClose();
  };

  // Handle program selection
  const handleProgramChange = (programCode: string) => {
    if (programCode === 'custom') {
      setUseCustomHours(true);
      setSelectedProgram(null);
      setFormData(prev => ({ ...prev, program_code: '', required_hours: prev.required_hours || 240 }));
    } else {
      const program = programs.find(p => p.program_code === programCode);
      setUseCustomHours(false);
      setSelectedProgram(program || null);
      setFormData(prev => ({ 
        ...prev, 
        program_code: programCode,
        required_hours: program?.required_hours || 240 
      }));
    }
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

          {/* Company Capacity Card */}
          {companyCapacity && !loadingCapacity && (
            <CompanyStatusCard company={companyCapacity} compact />
          )}

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
                <SelectValue placeholder={
                  !selectedStudent 
                    ? "Select a student first" 
                    : advisors.length === 0 
                    ? "Loading advisors..."
                    : "Select an advisor"
                } />
              </SelectTrigger>
              <SelectContent>
                {advisors.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No advisors found for this university
                  </div>
                ) : (
                  advisors.map((advisor) => (
                    <SelectItem key={advisor.id} value={advisor.id}>
                      {advisor.name} ({advisor.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!selectedStudent ? (
              <p className="text-sm text-muted-foreground">
                Select a student first to see available advisors
              </p>
            ) : selectedStudent.profile_data?.assigned_advisor_id && formData.advisor_id === selectedStudent.profile_data.assigned_advisor_id ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                ✅ Auto-selected: {selectedStudent.profile_data.assigned_advisor_name || 'Assigned advisor'} (based on student&apos;s program)
              </p>
            ) : advisors.length === 0 ? (
              <p className="text-sm text-yellow-600">
                ⚠️ No advisors registered for this university. Please add advisors first.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {advisors.length} advisor{advisors.length !== 1 ? 's' : ''} available from student&apos;s university
              </p>
            )}
          </div>


          {/* Supervisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="supervisor">Supervisor *</Label>
            <Select
              value={formData.supervisor_id}
              onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
              disabled={loading || !formData.company_id || supervisors.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !formData.company_id 
                    ? "Select a company first" 
                    : supervisors.length === 0 
                    ? "No supervisors available"
                    : "Select a supervisor"
                } />
              </SelectTrigger>
              <SelectContent>
                {supervisors.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No supervisors found for this company
                  </div>
                ) : (
                  supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} ({supervisor.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!formData.company_id ? (
              <p className="text-sm text-muted-foreground">
                Select a company first to see available supervisors
              </p>
            ) : supervisors.length === 0 ? (
              <p className="text-sm text-yellow-600">
                ⚠️ No supervisors registered for this company. Please add supervisors first.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {supervisors.length} supervisor{supervisors.length !== 1 ? 's' : ''} available from selected company
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
            
            {/* Program / Required Hours Selection */}
            <div className="space-y-2">
              <Label htmlFor="program">Program / Required Hours *</Label>
              <Select
                value={useCustomHours ? 'custom' : formData.program_code}
                onValueChange={handleProgramChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.program_code} value={program.program_code}>
                      {program.program_code} - {program.required_hours} hours
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom hours...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Hours Input (when custom is selected) */}
          {useCustomHours && (
            <div className="space-y-2">
              <Label htmlFor="required_hours">Custom Required Hours *</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="required_hours"
                  type="number"
                  min={40}
                  max={2000}
                  value={formData.required_hours || ''}
                  onChange={(e) => setFormData({ ...formData, required_hours: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 240, 486, 500"
                  disabled={loading}
                  required
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter total required internship hours (40-2000)
              </p>
            </div>
          )}

          {/* Hours Summary Card */}
          {formData.required_hours && formData.required_hours > 0 && formData.start_date && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-primary" />
                Hours Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Required Hours:</span>
                  <span className="ml-2 font-medium">{formData.required_hours} hours</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Working Days:</span>
                  <span className="ml-2 font-medium">{Math.ceil(formData.required_hours / 8)} days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Approx. Weeks:</span>
                  <span className="ml-2 font-medium">{Math.ceil(formData.required_hours / 40)} weeks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Projected End:</span>
                  <span className="ml-1 font-medium">
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

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
