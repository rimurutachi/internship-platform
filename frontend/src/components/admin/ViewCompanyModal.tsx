'use client';

import { useState, useEffect } from 'react';
import { adminCompaniesAPI, CompanyWithSupervisors } from '@/lib/api/admin-companies';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Users, 
  Loader2,
  CheckCircle,
  FileCheck,
  Code
} from 'lucide-react';

interface ViewCompanyModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
}

export function ViewCompanyModal({
  open,
  onClose,
  companyId,
}: ViewCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyWithSupervisors | null>(null);

  useEffect(() => {
    if (open && companyId) {
      fetchCompanyDetails();
    }
  }, [open, companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      const response = await adminCompaniesAPI.getCompany(companyId);
      setCompany(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch company details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Loading Company Details</DialogTitle>
            <DialogDescription>Please wait while we fetch the company information...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {company.name}
          </DialogTitle>
          <DialogDescription>
            Company details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex gap-2 flex-wrap">
            {company.is_verified && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {company.is_moa_standardized && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileCheck className="h-3 w-3" />
                MOA Standardized
              </Badge>
            )}
            {!company.is_verified && !company.is_moa_standardized && (
              <Badge variant="outline">Pending Verification</Badge>
            )}
          </div>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Industry</div>
                  <div className="font-medium">{company.industry || 'Not specified'}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Company Code
                  </div>
                  <div className="font-medium font-mono">{company.code || 'N/A'}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Supervisors
                  </div>
                  <div className="font-medium">{company.supervisor_count || 0}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Capacity</div>
                  <div className="font-medium">
                    {company.current_students || 0} / {company.capacity_limit || 10} students
                  </div>
                </div>
              </div>

              {company.address && (
                <div className="space-y-1 pt-2">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </div>
                  <div className="font-medium">{company.address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          {company.contact_info && Object.keys(company.contact_info).length > 0 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                
                <div className="space-y-3">
                  {company.contact_info.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <a href={`mailto:${company.contact_info.email}`} className="font-medium hover:underline">
                          {company.contact_info.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.contact_info.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Phone</div>
                        <a href={`tel:${company.contact_info.phone}`} className="font-medium hover:underline">
                          {company.contact_info.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.contact_info.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Website</div>
                        <a 
                          href={company.contact_info.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-medium hover:underline"
                        >
                          {company.contact_info.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervisors List */}
          {company.supervisors && company.supervisors.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Supervisors ({company.supervisors.length})
                </h3>
                
                <div className="space-y-2">
                  {company.supervisors.map((supervisor) => (
                    <div 
                      key={supervisor.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{supervisor.name}</div>
                        <div className="text-sm text-muted-foreground">{supervisor.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Statistics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-blue-600">{company.supervisor_count || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Supervisors</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600">{company.current_students || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Current Students</div>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-orange-600">{company.active_internships || 0}</div>
                  <div className="text-sm text-muted-foreground mt-1">Active Internships</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
