'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect } from 'react';
import { adminCompaniesAPI, CompanyUpdateInput, CompanyWithSupervisors } from '@/lib/api/admin-companies';
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
import { Checkbox } from '@/components/ui/checkbox';

import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, X, Users } from 'lucide-react';

interface Supervisor {
  id: string;
  name: string;
  email: string;
  company_id?: string | null;
  status?: string;
}

interface EditCompanyModalProps {
  open: boolean;
  onClose: () => void;
  company: CompanyWithSupervisors;
  onSuccess: () => void;
}

export function EditCompanyModal({
  open,
  onClose,
  company,
  onSuccess,
}: EditCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [supervisorLoading, setSupervisorLoading] = useState(false);
  
  // Supervisors state
  const [assignedSupervisors, setAssignedSupervisors] = useState<Supervisor[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('');

  const [formData, setFormData] = useState<CompanyUpdateInput>({
    name: company.name,
    industry: company.industry,
    address: company.address,
    code: company.code,
    capacity_limit: company.capacity_limit,
    is_verified: company.is_verified,
    is_moa_standardized: company.is_moa_standardized,
    contact_info: company.contact_info || {},
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: company.name,
        industry: company.industry,
        address: company.address,
        code: company.code,
        capacity_limit: company.capacity_limit,
        is_verified: company.is_verified,
        is_moa_standardized: company.is_moa_standardized,
        contact_info: company.contact_info || {},
      });
      // Reset supervisor selection
      setSelectedSupervisorId('');
      // Fetch supervisors when modal opens
      fetchSupervisors();
    }
  }, [open, company]);

  const fetchSupervisors = async () => {
    try {
      setSupervisorLoading(true);
      
      console.log('🔵 Fetching supervisors for company:', company.id, company.name);
      
      // Fetch assigned supervisors for this company
      const assignedResponse = await adminCompaniesAPI.getSupervisors(company.id);
      console.log('📋 Assigned supervisors response:', assignedResponse);
      
      if (assignedResponse.success) {
        const assigned = assignedResponse.data.supervisors || [];
        console.log(`✅ Found ${assigned.length} assigned supervisors:`, assigned);
        setAssignedSupervisors(assigned);
      }
      
      // Fetch all unassigned supervisors
      const availableResponse = await adminCompaniesAPI.getAllSupervisors(true);
      console.log('📋 Available supervisors response:', availableResponse);
      
      if (availableResponse.success) {
        const available = availableResponse.data.supervisors || [];
        console.log(`✅ Found ${available.length} unassigned supervisors:`, available);
        setAvailableSupervisors(available);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch supervisors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load supervisors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisorId) return;

    try {
      setSupervisorLoading(true);
      console.log('🔵 Assigning supervisor:', selectedSupervisorId, 'to company:', company.id);
      
      const response = await adminCompaniesAPI.assignSupervisor(company.id, selectedSupervisorId);
      console.log('✅ Assign response:', response);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        setSelectedSupervisorId('');
        await fetchSupervisors(); // Refresh lists
      }
    } catch (error: any) {
      console.error('❌ Assign supervisor error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign supervisor',
        variant: 'destructive',
      });
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleRemoveSupervisor = async (supervisorId: string, supervisorName: string) => {
    try {
      setSupervisorLoading(true);
      console.log('🔵 Removing supervisor:', supervisorId, supervisorName);
      
      const response = await adminCompaniesAPI.removeSupervisor(company.id, supervisorId);
      console.log('✅ Remove response:', response);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        await fetchSupervisors(); // Refresh lists
      }
    } catch (error: any) {
      console.error('❌ Remove supervisor error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove supervisor',
        variant: 'destructive',
      });
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await adminCompaniesAPI.updateCompany(company.id, formData);
      toast({
        title: 'Success',
        description: 'Company updated successfully',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company',
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
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update company information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tech Corp"
              disabled={loading}
              required
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry || ''}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Technology, Finance"
              disabled={loading}
            />
          </div>

          {/* Company Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Company Code</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., TECH001"
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Business St., Manila"
              disabled={loading}
            />
          </div>

          {/* Capacity Limit */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Student Capacity Limit</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity_limit}
              onChange={(e) => setFormData({ ...formData, capacity_limit: parseInt(e.target.value) })}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Current students: {company.current_students || 0}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <Label className="text-base">Contact Information</Label>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact_info?.email || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact_info: { ...formData.contact_info, email: e.target.value }
                })}
                placeholder="contact@company.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                value={formData.contact_info?.phone || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact_info: { ...formData.contact_info, phone: e.target.value }
                })}
                placeholder="+63 123 456 7890"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.contact_info?.website || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact_info: { ...formData.contact_info, website: e.target.value }
                })}
                placeholder="https://company.com"
                disabled={loading}
              />
            </div>
          </div>

          <Separator />

          {/* Supervisors Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Assigned Supervisors</Label>
              {supervisorLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            
            {/* List of assigned supervisors */}
            {assignedSupervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No supervisors assigned to this company yet.</p>
            ) : (
              <div className="space-y-2">
                {assignedSupervisors.map((supervisor) => (
                  <div
                    key={supervisor.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{supervisor.name}</p>
                      <p className="text-xs text-muted-foreground">{supervisor.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSupervisor(supervisor.id, supervisor.name)}
                      disabled={supervisorLoading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add supervisor section */}
            <div className="space-y-2">
              <Label className="text-sm">Add Supervisor</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedSupervisorId}
                  onValueChange={setSelectedSupervisorId}
                  disabled={supervisorLoading || availableSupervisors.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={
                      availableSupervisors.length === 0 
                        ? "No available supervisors" 
                        : "Select a supervisor to add"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSupervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        <div className="flex flex-col">
                          <span>{supervisor.name}</span>
                          <span className="text-xs text-muted-foreground">{supervisor.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAssignSupervisor}
                  disabled={!selectedSupervisorId || supervisorLoading}
                  size="icon"
                >
                  {supervisorLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only unassigned supervisors are shown. Supervisors can be reassigned from other companies via the Users page.
              </p>
            </div>
          </div>

          <Separator />

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_verified: checked as boolean })
                }
                disabled={loading}
              />
              <Label
                htmlFor="verified"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Verified Company
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="moa"
                checked={formData.is_moa_standardized}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_moa_standardized: checked as boolean })
                }
                disabled={loading}
              />
              <Label
                htmlFor="moa"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Memorandum of Agreement (MOA) Standardized
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
