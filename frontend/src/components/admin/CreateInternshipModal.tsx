'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useState, useEffect, useMemo } from 'react';
import {
  adminInternshipsAPI,
  WORK_SCHEDULE_OPTIONS,
  SHIFT_OPTIONS,
  calculateScheduleProjections,
} from '@/lib/api/admin-internships';
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
import {
  Loader2,
  Clock,
  Calendar,
  Info,
  Briefcase,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';
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

  // Schedule configuration states
  const [workSchedule, setWorkSchedule] = useState<'mon-fri' | 'mon-sat'>('mon-fri');
  const [shiftTime, setShiftTime] = useState<string>('8:00 AM - 5:00 PM');

  const [formData, setFormData] = useState<
    InternshipCreateInput & { required_hours?: number; program_code?: string }
  >({
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

  // Dynamic schedule projections
  const projections = useMemo(() => {
    return calculateScheduleProjections(
      formData.start_date,
      formData.required_hours || 0,
      workSchedule,
      shiftTime
    );
  }, [formData.start_date, formData.required_hours, workSchedule, shiftTime]);

  // Sync projected end date into formData
  useEffect(() => {
    if (projections?.projectedEndDate) {
      setFormData((prev) => ({
        ...prev,
        end_date: projections.projectedEndDate,
      }));
    }
  }, [projections?.projectedEndDate]);

  // Helper function to fetch CVSU-BC advisors
  const fetchCVSUAdvisors = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: university, error } = await supabase
        .from('universities')
        .select('id')
        .eq('code', 'CVSU-BC')
        .single();

      if (error) throw error;

      if (university) {
        try {
          const response = await adminInternshipsAPI.getAdvisorsByUniversity(university.id);
          setAdvisors(response.data.advisors || []);
          if (response.data.advisors.length === 0) {
            toast({
              title: 'No Advisors Found',
              description: 'There are no advisors registered for CVSU-BC yet.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error fetching advisors:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching CVSU university:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
      fetchCompanies();
      fetchPrograms();
      fetchCVSUAdvisors();
    }
  }, [open]);

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
      const comps = await adminInternshipsEnhancedAPI.getCapacityOverview();
      const company = Array.isArray(comps) ? comps.find((c) => c.id === companyId) : null;
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
      setAvailableStudents(response.data.students || []);
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
      const response = await adminInternshipsAPI.getSupervisorsByCompany(companyId);
      setSupervisors(response.data.supervisors || []);
      if (response.data.supervisors.length === 0) {
        toast({
          title: 'No Supervisors Found',
          description: 'There are no supervisors registered for this company yet.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = availableStudents.find((s) => s.id === studentId);
    setSelectedStudent(student || null);

    const assignedAdvisorId = student?.profile_data?.assigned_advisor_id;
    const assignedAdvisorName = student?.profile_data?.assigned_advisor_name;

    if (assignedAdvisorId) {
      setFormData((prev) => ({
        ...prev,
        student_id: studentId,
        advisor_id: assignedAdvisorId,
      }));
      toast({
        title: '✅ Advisor Auto-Selected',
        description: `${assignedAdvisorName || 'Assigned advisor'} has been automatically selected based on student program.`,
      });
    } else {
      setFormData((prev) => ({ ...prev, student_id: studentId, advisor_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const internshipPayload = {
        student_id: formData.student_id,
        company_id: formData.company_id,
        position: formData.position,
        department: formData.department,
        advisor_id: formData.advisor_id,
        supervisor_id: formData.supervisor_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status || 'pending',
        required_hours: formData.required_hours,
        program_code: formData.program_code || '',
        metadata: {
          schedule: projections || undefined,
        },
      };

      await adminInternshipsAPI.createInternship(internshipPayload);

      toast({
        title: 'Success',
        description: 'Internship created successfully in Pending status',
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
    setWorkSchedule('mon-fri');
    setShiftTime('8:00 AM - 5:00 PM');
    setAdvisors([]);
    setSupervisors([]);
    onClose();
  };

  const handleProgramChange = (programCode: string) => {
    if (programCode === 'custom') {
      setUseCustomHours(true);
      setSelectedProgram(null);
      setFormData((prev) => ({
        ...prev,
        program_code: '',
        required_hours: prev.required_hours || 240,
      }));
    } else {
      const program = programs.find((p) => p.program_code === programCode);
      setUseCustomHours(false);
      setSelectedProgram(program || null);
      setFormData((prev) => ({
        ...prev,
        program_code: programCode,
        required_hours: program?.required_hours || 240,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="h-5 w-5 text-primary" />
            Create New Internship
          </DialogTitle>
          <DialogDescription>
            Assign a student to a partner company, configure their work schedule, and set up automated timeline projections.
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
            <p className="text-xs text-muted-foreground">
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

          {/* Position & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., IT, Engineering, Marketing"
                disabled={loading}
              />
            </div>
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
                <SelectValue
                  placeholder={
                    !selectedStudent
                      ? 'Select a student first'
                      : advisors.length === 0
                      ? 'Loading advisors...'
                      : 'Select an advisor'
                  }
                />
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
              <p className="text-xs text-muted-foreground">
                Select a student first to see available advisors
              </p>
            ) : selectedStudent.profile_data?.assigned_advisor_id &&
              formData.advisor_id === selectedStudent.profile_data.assigned_advisor_id ? (
              <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                ✅ Auto-selected: {selectedStudent.profile_data.assigned_advisor_name || 'Assigned advisor'} (based on program)
              </p>
            ) : null}
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
                <SelectValue
                  placeholder={
                    !formData.company_id
                      ? 'Select a company first'
                      : supervisors.length === 0
                      ? 'No supervisors available'
                      : 'Select a supervisor'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.company_id ? (
              <p className="text-xs text-muted-foreground">
                Select a company first to see available supervisors
              </p>
            ) : supervisors.length === 0 ? (
              <p className="text-xs text-yellow-600">
                ⚠️ No supervisors registered for this company yet.
              </p>
            ) : null}
          </div>

          {/* Schedule Configuration Section */}
          <div className="pt-2 border-t space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">
                Internship Schedule &amp; Working Hours
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Work Days Schedule */}
              <div className="space-y-2">
                <Label htmlFor="work-schedule">Work Days Schedule *</Label>
                <Select
                  value={workSchedule}
                  onValueChange={(val: any) => setWorkSchedule(val)}
                  disabled={loading}
                >
                  <SelectTrigger id="work-schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_SCHEDULE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Daily Shift */}
              <div className="space-y-2">
                <Label htmlFor="shift-time">Daily Working Shift *</Label>
                <Select
                  value={shiftTime}
                  onValueChange={(val) => setShiftTime(val)}
                  disabled={loading}
                >
                  <SelectTrigger id="shift-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Program Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="program">Program / Required Hours *</Label>
                <Select
                  value={useCustomHours ? 'custom' : formData.program_code}
                  onValueChange={handleProgramChange}
                  disabled={loading}
                >
                  <SelectTrigger id="program">
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

            {/* Custom Hours Input */}
            {useCustomHours && (
              <div className="space-y-2 pl-3 border-l-2 border-primary/50 bg-muted/20 p-2.5 rounded-r-md">
                <Label htmlFor="required_hours" className="text-xs font-semibold">
                  Custom Required Hours *
                </Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="required_hours"
                    type="number"
                    min={40}
                    max={2000}
                    value={formData.required_hours || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        required_hours: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 240, 486, 500"
                    disabled={loading}
                    required
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
            )}

            {/* Dynamic Schedule & Projected Timeline Summary Card */}
            {projections && (
              <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Schedule &amp; Timeline Projections
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-medium">
                    {projections.hoursPerWeek} hrs/week
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-md bg-muted/40">
                    <span className="text-muted-foreground block mb-0.5">Shift Hours</span>
                    <span className="font-semibold text-foreground">{shiftTime}</span>
                  </div>

                  <div className="p-2.5 rounded-md bg-muted/40">
                    <span className="text-muted-foreground block mb-0.5">Weekly Days</span>
                    <span className="font-semibold text-foreground">
                      {workSchedule === 'mon-sat' ? 'Mon - Sat (6 days)' : 'Mon - Fri (5 days)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-md bg-muted/40">
                    <span className="text-muted-foreground block mb-0.5">Required Hours</span>
                    <span className="font-semibold text-primary">{formData.required_hours} hrs</span>
                  </div>

                  <div className="p-2.5 rounded-md bg-muted/40">
                    <span className="text-muted-foreground block mb-0.5">Total Working Days</span>
                    <span className="font-semibold text-foreground">{projections.totalWorkingDays} days</span>
                  </div>

                  <div className="p-2.5 rounded-md bg-muted/40">
                    <span className="text-muted-foreground block mb-0.5">Estimated Duration</span>
                    <span className="font-semibold text-foreground">~{projections.projectedWeeks} weeks</span>
                  </div>

                  <div className="p-2.5 rounded-md bg-primary/10 border border-primary/20">
                    <span className="text-muted-foreground block mb-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      Projected End
                    </span>
                    <span className="font-bold text-primary">
                      {new Date(projections.projectedEndDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Section with Document Prerequisites Note */}
          <div className="pt-2 border-t space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="font-semibold">
                Initial Internship Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending (Recommended - Awaits Documents)</SelectItem>
                  <SelectItem value="active">Active (Immediate Start)</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'pending' && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">
                    Automated Document-Gated Activation
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Internship starts as <strong>Pending</strong>. It will automatically switch to <strong>Active</strong> once the student submits and their Advisor approves all 3 mandatory pre-internship documents:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-medium text-foreground">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border text-[11px]">
                      <FileText className="h-3 w-3 text-primary" />
                      MOA (Memorandum of Agreement)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border text-[11px]">
                      <FileText className="h-3 w-3 text-primary" />
                      Endorsement Letter
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border text-[11px]">
                      <FileText className="h-3 w-3 text-primary" />
                      Approved Job Description
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
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
