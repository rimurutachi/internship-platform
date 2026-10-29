'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import {
  adminInternshipsAPI,
  WORK_SCHEDULE_OPTIONS,
  SHIFT_OPTIONS,
  calculateScheduleProjections,
  type WorkScheduleType,
  type ShiftTimeType,
} from '@/lib/api/admin-internships';
import { hoursApi } from '@/lib/api/hours';
import type {
  InternshipWithRelations,
  InternshipUpdateInput,
  User,
} from '@/lib/api/admin-internships';
import type { ProgramHours, InternshipHoursSummary } from '@/types/hours';
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
import { Loader2, Clock, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  
  // Hours tracking state
  const [programs, setPrograms] = useState<ProgramHours[]>([]);
  const [hoursSummary, setHoursSummary] = useState<InternshipHoursSummary | null>(null);
  const [useCustomHours, setUseCustomHours] = useState(false);

  // Schedule state
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleType>('mon-fri');
  const [shiftTime, setShiftTime] = useState<ShiftTimeType>('8:00 AM - 5:00 PM');

  const [formData, setFormData] = useState<InternshipUpdateInput & { required_hours?: number; program_code?: string }>({
    position: internship.position,
    department: internship.department,
    advisor_id: internship.advisor_id || undefined,
    supervisor_id: internship.supervisor_id || undefined,
    start_date: internship.start_date.split('T')[0],
    end_date: internship.end_date.split('T')[0],
    status: internship.status,
    required_hours: (internship as any).required_hours || 240,
    program_code: (internship as any).program_code || '',
  });

  // Reset form data when internship changes
  useEffect(() => {
    if (open) {
      const existingRequiredHours = (internship as any).required_hours || 240;
      const existingProgramCode = (internship as any).program_code || '';
      const existingSchedule = (internship as any).metadata?.schedule;
      
      setFormData({
        position: internship.position,
        department: internship.department,
        advisor_id: internship.advisor_id || undefined,
        supervisor_id: internship.supervisor_id || undefined,
        start_date: internship.start_date.split('T')[0],
        end_date: internship.end_date.split('T')[0],
        status: internship.status,
        required_hours: existingRequiredHours,
        program_code: existingProgramCode,
      });

      if (existingSchedule?.work_days) {
        setWorkSchedule(existingSchedule.work_days as WorkScheduleType);
      } else {
        setWorkSchedule('mon-fri');
      }

      if (existingSchedule?.shift_time) {
        setShiftTime(existingSchedule.shift_time as ShiftTimeType);
      } else {
        setShiftTime('8:00 AM - 5:00 PM');
      }
      
      // Check if using custom hours (no program code or program not in list)
      setUseCustomHours(!existingProgramCode);
      
      // Fetch hours summary
      fetchHoursSummary();
      fetchPrograms();
    }
  }, [open, internship]);

  const fetchHoursSummary = async () => {
    try {
      const result = await hoursApi.getInternshipHoursSummary(internship.id);
      if (result.success && result.data) {
        setHoursSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch hours summary:', error);
    }
  };

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

  // Calculate schedule projections
  const projections =
    formData.start_date && formData.required_hours && formData.required_hours > 0
      ? calculateScheduleProjections(
          formData.start_date,
          formData.required_hours,
          workSchedule,
          shiftTime
        )
      : null;

  // Sync projected end date with formData
  useEffect(() => {
    if (projections?.projectedEndDate) {
      setFormData((prev) => {
        if (prev.end_date !== projections.projectedEndDate) {
          return { ...prev, end_date: projections.projectedEndDate };
        }
        return prev;
      });
    }
  }, [projections?.projectedEndDate]);

  const handleProgramChange = (programCode: string) => {
    if (programCode === 'custom') {
      setUseCustomHours(true);
      setFormData(prev => ({ ...prev, program_code: '' }));
    } else {
      const program = programs.find(p => p.program_code === programCode);
      setUseCustomHours(false);
      setFormData(prev => ({ 
        ...prev, 
        program_code: programCode,
        required_hours: program?.required_hours || prev.required_hours 
      }));
    }
  };

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
    if (!formData.required_hours || formData.required_hours < 40) {
      toast({
        title: 'Validation Error',
        description: 'Required hours must be at least 40',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        ...formData,
        metadata: {
          ...((internship as any).metadata || {}),
          schedule: projections
            ? {
                work_days: workSchedule,
                shift_time: shiftTime,
                hours_per_day: projections.hoursPerDay,
                hours_per_week: projections.hoursPerWeek,
                total_working_days: projections.totalWorkingDays,
                projected_weeks: projections.projectedWeeks,
                projected_end_date: projections.projectedEndDate,
              }
            : (internship as any).metadata?.schedule,
        },
      };

      await adminInternshipsAPI.updateInternship(internship.id, payload);
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

          {/* Work Days Schedule and Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_schedule">Work Days Schedule *</Label>
              <Select
                value={workSchedule}
                onValueChange={(val: any) => setWorkSchedule(val)}
                disabled={loading}
              >
                <SelectTrigger id="work_schedule">
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

            <div className="space-y-2">
              <Label htmlFor="shift_time">Daily Working Shift *</Label>
              <Select
                value={shiftTime}
                onValueChange={(val: any) => setShiftTime(val)}
                disabled={loading}
              >
                <SelectTrigger id="shift_time">
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

          {/* Date Range and Program Selection */}
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
                value={useCustomHours ? 'custom' : (formData.program_code || 'custom')}
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

          {/* Custom Hours Input */}
          {useCustomHours && (
            <div className="space-y-2">
              <Label htmlFor="required_hours">Required Hours *</Label>
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

          {/* Current Progress Card */}
          {hoursSummary && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Current Progress
                </div>
                <span className="text-sm font-semibold">
                  {hoursSummary.progress_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={hoursSummary.progress_percentage} className="h-2" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Hours Worked:</span>
                  <span className="ml-2 font-medium">{hoursSummary.total_hours_worked}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Required:</span>
                  <span className="ml-2 font-medium">{hoursSummary.required_hours}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining:</span>
                  <span className="ml-2 font-medium">{hoursSummary.remaining_hours}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weeks:</span>
                  <span className="ml-2 font-medium">
                    {(hoursSummary as any).weeks_completed ?? (hoursSummary as any).weeks_reported ?? 0}
                  </span>
                </div>
              </div>
              {hoursSummary.projected_end_date && (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Projected End:</span>
                  <span className="ml-1 font-medium">
                    {new Date(hoursSummary.projected_end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
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
