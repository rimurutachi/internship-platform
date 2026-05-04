'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  FileX,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DocumentTrackerItem } from '@/lib/api/advisor-students';

interface DocumentTrackerProps {
  documents: DocumentTrackerItem[];
}

export function DocumentTracker({ documents }: DocumentTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (documents.length === 0) return null;

  // Calculate stats
  const totalDocs = documents.length;
  const approvedCount = documents.filter(
    (d) => d.submission?.status === 'approved'
  ).length;
  const pendingCount = documents.filter(
    (d) => d.submission?.status === 'pending'
  ).length;
  const revisionCount = documents.filter(
    (d) => d.submission?.status === 'revision_requested'
  ).length;
  const rejectedCount = documents.filter(
    (d) => d.submission?.status === 'rejected'
  ).length;
  const notSubmittedCount = documents.filter(
    (d) => !d.submission
  ).length;
  const progressPercentage = totalDocs > 0 ? (approvedCount / totalDocs) * 100 : 0;

  const getStatusConfig = (doc: DocumentTrackerItem) => {
    if (!doc.submission) {
      return {
        icon: FileX,
        label: 'Not Submitted',
        color: 'text-slate-400 dark:text-slate-500',
        bgColor: 'bg-slate-50 dark:bg-slate-800/30',
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      };
    }

    switch (doc.submission.status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          label: 'Approved',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50/50 dark:bg-green-950/20',
          badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending Review',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50/50 dark:bg-yellow-950/20',
          badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        };
      case 'revision_requested':
        return {
          icon: RotateCcw,
          label: 'Revision Needed',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
          badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50/50 dark:bg-red-950/20',
          badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        };
      default:
        return {
          icon: FileX,
          label: 'Unknown',
          color: 'text-slate-400',
          bgColor: 'bg-slate-50 dark:bg-slate-800/30',
          badgeClass: 'bg-slate-100 text-slate-600',
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Sort: approved first, then pending, then revision, then rejected, then not submitted
  const sortedDocs = [...documents].sort((a, b) => {
    const order: Record<string, number> = {
      approved: 0,
      pending: 1,
      revision_requested: 2,
      rejected: 3,
    };
    const aOrder = a.submission ? (order[a.submission.status] ?? 4) : 5;
    const bOrder = b.submission ? (order[b.submission.status] ?? 4) : 5;
    return aOrder - bOrder;
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-lg">Document Tracker</h3>
          <Badge
            variant="secondary"
            className={cn(
              'ml-1',
              approvedCount === totalDocs
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
            )}
          >
            {approvedCount}/{totalDocs}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Progress</span>
              <span className={cn(
                'font-semibold',
                progressPercentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'
              )}>
                {progressPercentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap gap-2 text-xs">
            {approvedCount > 0 && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" /> {approvedCount} Approved
              </span>
            )}
            {pendingCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <Clock className="h-3 w-3" /> {pendingCount} Pending
              </span>
            )}
            {revisionCount > 0 && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <RotateCcw className="h-3 w-3" /> {revisionCount} Revision
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" /> {rejectedCount} Rejected
              </span>
            )}
            {notSubmittedCount > 0 && (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <FileX className="h-3 w-3" /> {notSubmittedCount} Not Submitted
              </span>
            )}
          </div>

          {/* Document List */}
          <div className="space-y-2 mt-3">
            {sortedDocs.map((doc) => {
              const config = getStatusConfig(doc);
              const StatusIcon = config.icon;
              const isOverdue =
                doc.due_date &&
                !doc.submission &&
                new Date(doc.due_date) < new Date();

              return (
                <div
                  key={doc.requirement_id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors',
                    config.bgColor
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon className={cn('h-4 w-4 flex-shrink-0', config.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {doc.title}
                        </span>
                        {doc.is_mandatory && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 flex-shrink-0">
                            Required
                          </Badge>
                        )}
                        {isOverdue && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400 flex-shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                      {doc.submission && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.submission.status === 'approved' && doc.submission.reviewed_at
                            ? `Approved ${formatDate(doc.submission.reviewed_at)}`
                            : doc.submission.status === 'pending'
                            ? `Submitted ${formatDate(doc.submission.submitted_at)}`
                            : doc.submission.status === 'revision_requested'
                            ? 'Revision requested'
                            : doc.submission.status === 'rejected'
                            ? 'Submission rejected'
                            : formatDate(doc.submission.submitted_at)}
                          {doc.submission.version > 1 && ` · v${doc.submission.version}`}
                        </p>
                      )}
                      {!doc.submission && doc.due_date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due {formatDate(doc.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn('text-xs flex-shrink-0 ml-2', config.badgeClass)}>
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Completion Message */}
          {approvedCount === totalDocs && totalDocs > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center">
              <p className="font-medium text-sm">✅ All documents have been approved!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
