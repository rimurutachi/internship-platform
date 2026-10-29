'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import {
  adminCompaniesAPI,
  CompanyUpdateInput,
  CompanyWithSupervisors,
  PHILIPPINE_INDUSTRIES,
} from '@/lib/api/admin-companies';
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
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Building,
} from 'lucide-react';

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

  // Industry selection states
  const [selectedIndustryCategory, setSelectedIndustryCategory] = useState<string>('');
  const [customIndustryText, setCustomIndustryText] = useState<string>('');

  // Real-time company name validation state
  const [nameValidation, setNameValidation] = useState<{
    checking: boolean;
    isExactMatch: boolean;
    exactMatch: string | null;
    similarCompanies: string[];
    isAvailable: boolean | null;
  }>({
    checking: false,
    isExactMatch: false,
    exactMatch: null,
    similarCompanies: [],
    isAvailable: null,
  });

  // Real-time website verification state
  const [websiteValidation, setWebsiteValidation] = useState<{
    checking: boolean;
    verified: boolean | null;
    message: string;
  }>({
    checking: false,
    verified: company.is_verified || null,
    message: '',
  });

  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const websiteTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      // Match existing industry
      const matched = (PHILIPPINE_INDUSTRIES as readonly string[]).find(
        (ind) => ind !== 'Others / Specific Industry' && ind.toLowerCase() === (company.industry || '').toLowerCase()
      );

      if (matched) {
        setSelectedIndustryCategory(matched);
        setCustomIndustryText('');
      } else if (company.industry) {
        setSelectedIndustryCategory('Others / Specific Industry');
        setCustomIndustryText(company.industry);
      } else {
        setSelectedIndustryCategory('');
        setCustomIndustryText('');
      }

      setWebsiteValidation({
        checking: false,
        verified: company.is_verified || null,
        message: company.is_verified ? 'Company website is verified.' : '',
      });

      setSelectedSupervisorId('');
      fetchSupervisors();
    }
  }, [open, company]);

  // Debounced Name Check (excluding current company id)
  useEffect(() => {
    if (!open) return;

    const trimmed = (formData.name || '').trim();
    if (!trimmed || trimmed.toLowerCase() === company.name.toLowerCase()) {
      setNameValidation({
        checking: false,
        isExactMatch: false,
        exactMatch: null,
        similarCompanies: [],
        isAvailable: true,
      });
      return;
    }

    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);

    setNameValidation((prev) => ({ ...prev, checking: true }));

    nameTimerRef.current = setTimeout(async () => {
      try {
        const response = await adminCompaniesAPI.checkCompanyName(trimmed, company.id);
        if (response.success) {
          setNameValidation({
            checking: false,
            isExactMatch: response.data.isExactMatch,
            exactMatch: response.data.exactMatch,
            similarCompanies: response.data.similarCompanies || [],
            isAvailable: response.data.isAvailable,
          });
        }
      } catch (err) {
        console.error('Failed to validate company name on edit:', err);
        setNameValidation((prev) => ({ ...prev, checking: false }));
      }
    }, 350);

    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    };
  }, [formData.name, open, company.id, company.name]);

  // Debounced Website Real-time Check
  useEffect(() => {
    if (!open) return;

    const rawUrl = formData.contact_info?.website?.trim() || '';
    if (!rawUrl) {
      setWebsiteValidation({
        checking: false,
        verified: null,
        message: 'Website is optional. Company is Unverified.',
      });
      setFormData((prev) => ({ ...prev, is_verified: false }));
      return;
    }

    // If website matches the original verified website and haven't modified it yet
    if (
      company.is_verified &&
      company.contact_info?.website?.trim() === rawUrl &&
      websiteValidation.verified === true
    ) {
      return;
    }

    if (websiteTimerRef.current) clearTimeout(websiteTimerRef.current);

    setWebsiteValidation({
      checking: true,
      verified: null,
      message: 'Checking website...',
    });

    websiteTimerRef.current = setTimeout(async () => {
      try {
        const response = await adminCompaniesAPI.verifyWebsite(rawUrl);
        if (response.success && response.data.verified) {
          setWebsiteValidation({
            checking: false,
            verified: true,
            message: 'Website verified and active. Company will be marked as Verified.',
          });
          setFormData((prev) => ({
            ...prev,
            is_verified: true,
            contact_info: {
              ...prev.contact_info,
              website: response.data.normalizedUrl || rawUrl,
            },
          }));
        } else {
          setWebsiteValidation({
            checking: false,
            verified: false,
            message:
              response.data.message ||
              'Website could not be reached or is invalid. Company will remain Unverified.',
          });
          setFormData((prev) => ({ ...prev, is_verified: false }));
        }
      } catch (err: any) {
        setWebsiteValidation({
          checking: false,
          verified: false,
          message: 'Website verification failed.',
        });
        setFormData((prev) => ({ ...prev, is_verified: false }));
      }
    }, 600);

    return () => {
      if (websiteTimerRef.current) clearTimeout(websiteTimerRef.current);
    };
  }, [formData.contact_info?.website, open]);

  const handleIndustrySelect = (category: string) => {
    setSelectedIndustryCategory(category);
    if (category === 'Others / Specific Industry') {
      setFormData((prev) => ({
        ...prev,
        industry: customIndustryText || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        industry: category,
      }));
    }
  };

  const handleCustomIndustryChange = (text: string) => {
    setCustomIndustryText(text);
    setFormData((prev) => ({
      ...prev,
      industry: text,
    }));
  };

  const fetchSupervisors = async () => {
    try {
      setSupervisorLoading(true);
      const assignedResponse = await adminCompaniesAPI.getSupervisors(company.id);
      if (assignedResponse.success) {
        setAssignedSupervisors(assignedResponse.data.supervisors || []);
      }

      const availableResponse = await adminCompaniesAPI.getAllSupervisors(true);
      if (availableResponse.success) {
        setAvailableSupervisors(availableResponse.data.supervisors || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch supervisors:', error);
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
      const response = await adminCompaniesAPI.assignSupervisor(
        company.id,
        selectedSupervisorId
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        setSelectedSupervisorId('');
        await fetchSupervisors();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign supervisor',
        variant: 'destructive',
      });
    } finally {
      setSupervisorLoading(false);
    }
  };

  const handleRemoveSupervisor = async (
    supervisorId: string,
    supervisorName: string
  ) => {
    try {
      setSupervisorLoading(true);
      const response = await adminCompaniesAPI.removeSupervisor(
        company.id,
        supervisorId
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
        await fetchSupervisors();
      }
    } catch (error: any) {
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

    if (!formData.name?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    if (nameValidation.isExactMatch) {
      toast({
        title: 'Company Name Conflict',
        description: `A company named "${nameValidation.exactMatch}" is already registered. Please choose a unique name.`,
        variant: 'destructive',
      });
      return;
    }

    if (
      selectedIndustryCategory === 'Others / Specific Industry' &&
      !customIndustryText.trim()
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please specify the custom industry name',
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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5 text-primary" />
            Edit Company
          </DialogTitle>
          <DialogDescription>
            Update company details, industry classification, website, and supervisors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-name" className="font-semibold">
                Company Name <span className="text-destructive">*</span>
              </Label>
              {nameValidation.checking && (
                <span className="flex items-center text-xs text-muted-foreground gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </span>
              )}
            </div>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Tech Corp"
              disabled={loading}
              required
              className={
                nameValidation.isExactMatch
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />

            {nameValidation.isExactMatch && (
              <div className="flex items-start gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Company name conflict!</span>
                  <p className="mt-0.5">
                    Another company named <strong>&quot;{nameValidation.exactMatch}&quot;</strong> is already registered.
                  </p>
                </div>
              </div>
            )}

            {!nameValidation.isExactMatch && nameValidation.similarCompanies.length > 0 && (
              <div className="flex items-start gap-1.5 p-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Similar existing companies:</span>
                  <p className="mt-0.5">{nameValidation.similarCompanies.join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Industry Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-industry-select" className="font-semibold">
              Industry Category
            </Label>
            <Select
              value={selectedIndustryCategory}
              onValueChange={handleIndustrySelect}
              disabled={loading}
            >
              <SelectTrigger id="edit-industry-select">
                <SelectValue placeholder="Select Philippine industry..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {PHILIPPINE_INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Industry Input if 'Others' is selected */}
          {selectedIndustryCategory === 'Others / Specific Industry' && (
            <div className="space-y-1.5 pl-3 border-l-2 border-primary/50 bg-muted/20 p-2.5 rounded-r-md">
              <Label htmlFor="edit-custom-industry" className="text-xs font-semibold">
                Specify Custom Industry <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-custom-industry"
                value={customIndustryText}
                onChange={(e) => handleCustomIndustryChange(e.target.value)}
                placeholder="e.g., Agriculture & Agribusiness"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Company Code */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-code">Company Code</Label>
            <Input
              id="edit-code"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., TECH001"
              disabled={loading}
              className="font-mono"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Business St., Manila"
              disabled={loading}
            />
          </div>

          {/* Capacity Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-capacity">Student Capacity Limit</Label>
            <Input
              id="edit-capacity"
              type="number"
              min="1"
              value={formData.capacity_limit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacity_limit: parseInt(e.target.value) || 10,
                })
              }
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Current enrolled students: {company.current_students || 0}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold">Contact Information</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.contact_info?.email || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_info: {
                        ...formData.contact_info,
                        email: e.target.value,
                      },
                    })
                  }
                  placeholder="contact@company.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.contact_info?.phone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_info: {
                        ...formData.contact_info,
                        phone: e.target.value,
                      },
                    })
                  }
                  placeholder="+63 123 456 7890"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Website with Auto-Verification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-website" className="text-xs flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Official Company Website
                </Label>
                {websiteValidation.checking && (
                  <span className="flex items-center text-[11px] text-muted-foreground gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Auto-verifying website...
                  </span>
                )}
              </div>
              <Input
                id="edit-website"
                type="text"
                value={formData.contact_info?.website || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact_info: {
                      ...formData.contact_info,
                      website: e.target.value,
                    },
                  })
                }
                placeholder="https://company.com"
                disabled={loading}
                className={
                  websiteValidation.verified === true
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : websiteValidation.verified === false
                    ? 'border-destructive focus-visible:ring-destructive'
                    : ''
                }
              />

              {websiteValidation.verified === true && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 bg-green-500/10 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Checked &amp; Verified:</strong> Live website reached. Company is tagged as <strong>Verified</strong>.
                  </span>
                </div>
              )}

              {websiteValidation.verified === false && (
                <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Not Verified:</strong> {websiteValidation.message} Company will be saved as <strong>Unverified</strong>.
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Supervisors Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Assigned Supervisors</Label>
              {supervisorLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {assignedSupervisors.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No supervisors assigned to this company yet.
              </p>
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
                      onClick={() =>
                        handleRemoveSupervisor(supervisor.id, supervisor.name)
                      }
                      disabled={supervisorLoading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Assign Supervisor Dropdown */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium">Assign New Supervisor</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedSupervisorId}
                  onValueChange={setSelectedSupervisorId}
                  disabled={supervisorLoading || availableSupervisors.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        availableSupervisors.length === 0
                          ? 'No available supervisors'
                          : 'Select a supervisor to assign...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSupervisors.map((supervisor) => (
                      <SelectItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.email})
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
            </div>
          </div>

          <Separator />

          {/* MOA Standardized Checkbox */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Checkbox
                id="edit-moa"
                checked={formData.is_moa_standardized}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    is_moa_standardized: checked as boolean,
                  })
                }
                disabled={loading}
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor="edit-moa" className="text-sm font-medium cursor-pointer">
                  Memorandum of Agreement (MOA) Standardized
                </Label>
                <p className="text-xs text-muted-foreground">
                  Active institutional MOA partnership with CvSU Bacoor.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || nameValidation.isExactMatch}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
