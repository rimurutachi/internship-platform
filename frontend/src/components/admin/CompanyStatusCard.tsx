'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, FileText, Building2 } from 'lucide-react';
import { CompanyCapacityInfo } from '@/types/internships-enhanced';

interface CompanyStatusCardProps {
  company: CompanyCapacityInfo;
  compact?: boolean;
}

export default function CompanyStatusCard({ company, compact = false }: CompanyStatusCardProps) {
  const getCapacityColor = () => {
    if (company.is_at_capacity) return 'text-red-600';
    if (company.is_near_capacity) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityProgressColor = () => {
    if (company.is_at_capacity) return 'bg-red-600';
    if (company.is_near_capacity) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{company.name}</span>
            {company.is_verified && (
              <div title="Verified Partner">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              </div>
            )}
            {!company.is_verified && (
              <div title="New Company">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              </div>
            )}
            {company.is_moa_standardized && (
              <div title="MOA on File">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={`font-medium ${getCapacityColor()}`}>
              {company.current_students}/{company.capacity_limit} slots
            </span>
            <Progress 
              value={company.capacity_usage_percent} 
              className="h-2 flex-1"
              indicatorClassName={getCapacityProgressColor()}
            />
            <span className="text-muted-foreground">{company.capacity_usage_percent}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Company Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {company.is_verified ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Partner
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      New Company
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MOA Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">MOA Status</span>
            </div>
            {company.is_moa_standardized ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                On File
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>

          {/* Capacity Information */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacity Usage</span>
              <span className={`text-sm font-semibold ${getCapacityColor()}`}>
                {company.current_students} / {company.capacity_limit} students
              </span>
            </div>
            <Progress 
              value={company.capacity_usage_percent} 
              className="h-3"
              indicatorClassName={getCapacityProgressColor()}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {company.capacity_usage_percent}% utilized
              </span>
              {company.is_at_capacity && (
                <Badge variant="destructive" className="text-xs">
                  At Capacity
                </Badge>
              )}
              {company.is_near_capacity && !company.is_at_capacity && (
                <Badge variant="outline" className="text-xs">
                  Nearing Capacity
                </Badge>
              )}
            </div>
          </div>

          {/* Warnings */}
          {company.is_at_capacity && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Company at capacity</p>
                  <p className="text-muted-foreground mt-1">
                    This company cannot accept new interns. Please select another company or wait for slots to become available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {company.is_near_capacity && !company.is_at_capacity && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Nearing capacity</p>
                  <p className="text-yellow-700 mt-1">
                    This company is approaching its capacity limit. Consider alternative placements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {company.is_verified && company.is_moa_standardized && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Quick Approval Available</p>
                  <p className="text-green-700 mt-1">
                    This is a verified partner with MOA on file. Placement can be processed quickly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!company.is_verified && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">New Company - MOA Required</p>
                  <p className="text-blue-700 mt-1">
                    This is a new company. A new MOA must be prepared and approved before placement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {company.upcoming_expirations !== undefined && company.upcoming_expirations > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{company.upcoming_expirations}</span> internship(s) ending within 30 days
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
