'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useRef } from 'react';
import {
  adminCompaniesAPI,
  CompanyCreateInput,
  PHILIPPINE_INDUSTRIES,
  getPrefixForIndustry,
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Globe,
  Building,
} from 'lucide-react';

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

  // Industry selection states
  const [selectedIndustryCategory, setSelectedIndustryCategory] = useState<string>('');
  const [customIndustryText, setCustomIndustryText] = useState<string>('');
  const [generatingCode, setGeneratingCode] = useState<boolean>(false);

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
    verified: null,
    message: '',
  });

  const nameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const websiteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Company Name Validation
  useEffect(() => {
    if (!open) return;

    const trimmed = formData.name.trim();
    if (!trimmed) {
      setNameValidation({
        checking: false,
        isExactMatch: false,
        exactMatch: null,
        similarCompanies: [],
        isAvailable: null,
      });
      return;
    }

    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);

    setNameValidation((prev) => ({ ...prev, checking: true }));

    nameTimerRef.current = setTimeout(async () => {
      try {
        const response = await adminCompaniesAPI.checkCompanyName(trimmed);
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
        console.error('Failed to validate company name:', err);
        setNameValidation((prev) => ({ ...prev, checking: false }));
      }
    }, 350);

    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    };
  }, [formData.name, open]);

  // Debounced Website Real-Time Auto-Verification
  useEffect(() => {
    if (!open) return;

    const rawUrl = formData.contact_info?.website?.trim() || '';
    if (!rawUrl) {
      setWebsiteValidation({
        checking: false,
        verified: null,
        message: 'Website is optional. Company will be saved as Unverified.',
      });
      setFormData((prev) => ({ ...prev, is_verified: false }));
      return;
    }

    if (websiteTimerRef.current) clearTimeout(websiteTimerRef.current);

    setWebsiteValidation({
      checking: true,
      verified: null,
      message: 'Checking website accessibility...',
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
          message: 'Website verification failed. Company will remain Unverified.',
        });
        setFormData((prev) => ({ ...prev, is_verified: false }));
      }
    }, 600);

    return () => {
      if (websiteTimerRef.current) clearTimeout(websiteTimerRef.current);
    };
  }, [formData.contact_info?.website, open]);

  // Handle Industry Category selection & Auto Code generation
  const handleIndustrySelect = async (category: string) => {
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

    // Auto-generate company code based on prefix
    const prefix = getPrefixForIndustry(category);
    await generateCompanyCode(prefix);
  };

  const generateCompanyCode = async (prefix: string) => {
    try {
      setGeneratingCode(true);
      const codeRes = await adminCompaniesAPI.getNextCompanyCode(prefix);
      if (codeRes.success) {
        setFormData((prev) => ({
          ...prev,
          code: codeRes.data.nextCode,
        }));
      }
    } catch (err) {
      console.error('Failed to auto-generate company code:', err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCustomIndustryChange = (text: string) => {
    setCustomIndustryText(text);
    setFormData((prev) => ({
      ...prev,
      industry: text,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
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
        description: 'Please specify the industry name under Others',
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
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    if (websiteTimerRef.current) clearTimeout(websiteTimerRef.current);

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
    setSelectedIndustryCategory('');
    setCustomIndustryText('');
    setNameValidation({
      checking: false,
      isExactMatch: false,
      exactMatch: null,
      similarCompanies: [],
      isAvailable: null,
    });
    setWebsiteValidation({
      checking: false,
      verified: null,
      message: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building className="h-5 w-5 text-primary" />
            Add New Company
          </DialogTitle>
          <DialogDescription>
            Add a new partner company with standardized industry classification and automated verification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name with Real-Time Conflict Detection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="name" className="font-semibold">
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
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Movers Prime Corporation"
              disabled={loading}
              required
              className={
                nameValidation.isExactMatch
                  ? 'border-destructive focus-visible:ring-destructive'
                  : nameValidation.isAvailable && formData.name.trim().length > 1
                  ? 'border-green-500 focus-visible:ring-green-500'
                  : ''
              }
            />

            {/* Validation Feedback Messages */}
            {nameValidation.isExactMatch && (
              <div className="flex items-start gap-1.5 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
                <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Company name already registered!</span>
                  <p className="mt-0.5">
                    A company named <strong>&quot;{nameValidation.exactMatch}&quot;</strong> already exists in the platform. Duplicate names are not permitted.
                  </p>
                </div>
              </div>
            )}

            {!nameValidation.isExactMatch && nameValidation.similarCompanies.length > 0 && (
              <div className="flex items-start gap-1.5 p-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Similar existing companies detected:</span>
                  <p className="mt-0.5">
                    {nameValidation.similarCompanies.join(', ')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ensure this is a distinct registered business entity before continuing.
                  </p>
                </div>
              </div>
            )}

            {!nameValidation.isExactMatch &&
              nameValidation.isAvailable &&
              formData.name.trim().length > 1 &&
              nameValidation.similarCompanies.length === 0 && (
                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Company name is unique and available.</span>
                </div>
              )}
          </div>

          {/* Industry Selection Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="industry-select" className="font-semibold">
              Industry Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedIndustryCategory}
              onValueChange={handleIndustrySelect}
              disabled={loading}
            >
              <SelectTrigger id="industry-select">
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

          {/* Specific Custom Industry if 'Others' is selected */}
          {selectedIndustryCategory === 'Others / Specific Industry' && (
            <div className="space-y-1.5 pl-3 border-l-2 border-primary/50 bg-muted/20 p-2.5 rounded-r-md">
              <Label htmlFor="custom-industry" className="text-xs font-semibold">
                Specify Custom Industry <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom-industry"
                value={customIndustryText}
                onChange={(e) => handleCustomIndustryChange(e.target.value)}
                placeholder="e.g., Agriculture & Agribusiness, Aviation Services"
                disabled={loading}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Company code will default to standard prefix <strong>OTH-###</strong> to prevent category conflicts.
              </p>
            </div>
          )}

          {/* Company Code with Auto-generation info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="code" className="font-semibold">
                Company Code
              </Label>
              {selectedIndustryCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    generateCompanyCode(getPrefixForIndustry(selectedIndustryCategory))
                  }
                  disabled={loading || generatingCode}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${generatingCode ? 'animate-spin' : ''}`}
                  />
                  Regenerate
                </Button>
              )}
            </div>
            <div className="relative">
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., IT-001, BPO-001, OTH-001"
                disabled={loading || generatingCode}
                className="font-mono"
              />
              {generatingCode && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary shrink-0" />
              <span>
                Auto-incremented prefix code (e.g. <code>IT-001</code>, <code>OTH-001</code>). You can customize if needed.
              </span>
            </p>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Business Park, Bacoor City, Cavite"
              disabled={loading}
            />
          </div>

          {/* Capacity Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Student Capacity Limit</Label>
            <Input
              id="capacity"
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
              Maximum number of interns the company can accommodate
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold">Contact Information</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
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
                <Label htmlFor="phone" className="text-xs">
                  Phone
                </Label>
                <Input
                  id="phone"
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
                  placeholder="+63 912 345 6789"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Website with Real-Time Auto-Verification */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="website" className="text-xs flex items-center gap-1.5">
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
                id="website"
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

              {/* Website Status Feedback Notes */}
              {websiteValidation.verified === true && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 bg-green-500/10 p-2 rounded-md">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Checked &amp; Verified:</strong> Live website reached successfully. Company will be tagged as <strong>Verified</strong>.
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

              {websiteValidation.verified === null && !websiteValidation.checking && (
                <p className="text-[11px] text-muted-foreground">
                  Leave blank if company has no official website (will be saved as Unverified, editable anytime).
                </p>
              )}
            </div>
          </div>

          {/* MOA Standardized Checkbox (Manual Verified Checkbox Removed) */}
          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Checkbox
                id="moa"
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
                <Label
                  htmlFor="moa"
                  className="text-sm font-medium cursor-pointer"
                >
                  Memorandum of Agreement (MOA) Standardized
                </Label>
                <p className="text-xs text-muted-foreground">
                  Indicates whether an active standardized institutional MOA with CvSU is established.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || nameValidation.isExactMatch}
              className="font-medium"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
