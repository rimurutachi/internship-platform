'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';
import { adminCompaniesAPI, CompanyCreateInput } from '@/lib/api/admin-companies';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCompanyModal({
  open,
  onClose,
  onSuccess,
}: CreateCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CompanyCreateInput>({
    name: '',
    industry: '',
    address: '',
    code: '',
    capacity_limit: 10,
    is_verified: false,
    is_moa_standardized: false,
    contact_info: {
      email: '',
      phone: '',
      website: '',
    },
  });

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
      await adminCompaniesAPI.createCompany(formData);
      toast({
        title: 'Success',
        description: 'Company created successfully',
      });
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      industry: '',
      address: '',
      code: '',
      capacity_limit: 10,
      is_verified: false,
      is_moa_standardized: false,
      contact_info: {
        email: '',
        phone: '',
        website: '',
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Add a new partner company to the platform
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
              value={formData.industry}
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
              value={formData.code}
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
              value={formData.address}
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
              Maximum number of interns the company can accommodate
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
                value={formData.contact_info?.email}
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
                value={formData.contact_info?.phone}
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
                value={formData.contact_info?.website}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact_info: { ...formData.contact_info, website: e.target.value }
                })}
                placeholder="https://company.com"
                disabled={loading}
              />
            </div>
          </div>

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
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
