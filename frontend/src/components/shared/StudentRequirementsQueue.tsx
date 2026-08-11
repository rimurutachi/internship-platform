"use client";

/**
 * StudentRequirementsQueue
 *
 * Advisor-only view that displays student document submissions in an organized
 * queue. Eliminates document clutter on the Advisor's main Documents page by
 * routing student submissions to this dedicated review queue.
 *
 * Features:
 *   - View submissions grouped by student name
 *   - Status badges (Draft, Submitted, Pre-Approved, Approved)
 *   - One-click "Review" → opens in Dual-Mode Page View
 *   - One-click "Pre-Approve" directly from the queue
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  Clock,
  Search,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { documentsAPI } from "@/lib/api/documents";
import type { DocumentWithDetails } from "@/types/documents";
import { useUser } from "@/hooks/use-user";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentRequirementsQueueProps {
  userType: "advisor" | "supervisor";
}

interface GroupedSubmissions {
  studentName: string;
  studentEmail: string;
  studentId: string;
  documents: DocumentWithDetails[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps document status to badge variant and label */
const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  in_review: { label: "Submitted for Review", variant: "outline" },
  pre_approved: { label: "Pre-Approved", variant: "default" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  archived: { label: "Archived", variant: "secondary" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function StudentRequirementsQueue({
  userType,
}: StudentRequirementsQueueProps) {
  const router = useRouter();
  const { user } = useUser();
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [preApprovingId, setPreApprovingId] = useState<string | null>(null);

  // ── Fetch all documents shared with this advisor ───────────────────────────
  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await documentsAPI.getDocuments();
      const allDocs = response.documents || [];

      // Filter: Show only documents NOT owned by the current advisor
      // (these are documents shared with the advisor by students)
      const studentDocs = allDocs.filter(
        (doc) => doc.owner_id !== user?.id
      );

      setDocuments(studentDocs);
    } catch (err) {
      console.error("❌ [RequirementsQueue] Load error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load submissions"
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadSubmissions();
  }, [loadSubmissions, user?.id]);

  // ── Group documents by student (owner) ─────────────────────────────────────
  const groupedByStudent: GroupedSubmissions[] = (() => {
    const groups: Record<string, GroupedSubmissions> = {};

    documents.forEach((doc) => {
      const ownerId = doc.owner_id;
      if (!groups[ownerId]) {
        groups[ownerId] = {
          studentId: ownerId,
          studentName: doc.owner
            ? `${doc.owner.first_name} ${doc.owner.last_name}`
            : "Unknown Student",
          studentEmail: doc.owner?.email || "",
          documents: [],
        };
      }
      groups[ownerId].documents.push(doc);
    });

    return Object.values(groups).sort((a, b) =>
      a.studentName.localeCompare(b.studentName)
    );
  })();

  // ── Filter by search ───────────────────────────────────────────────────────
  const filteredGroups = groupedByStudent.filter(
    (group) =>
      group.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.documents.some((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalSubmissions = documents.length;
  const preApprovedCount = documents.filter(
    (d) => d.status === "pre_approved" || d.status === "approved"
  ).length;
  const pendingCount = documents.filter(
    (d) => d.status === "draft" || d.status === "in_review"
  ).length;

  // ── Pre-approve handler ────────────────────────────────────────────────────
  const handlePreApprove = async (documentId: string) => {
    try {
      setPreApprovingId(documentId);
      await documentsAPI.preApproveDocument(documentId);
      await loadSubmissions(); // Reload to reflect status change
    } catch (err) {
      console.error("❌ [RequirementsQueue] Pre-approve error:", err);
    } finally {
      setPreApprovingId(null);
    }
  };

  // ── Review in Dual-Mode ────────────────────────────────────────────────────
  const handleReview = (documentId: string) => {
    router.push(`/dashboard/${userType}/documents/${documentId}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 animate-in fade-in">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading student submissions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadSubmissions}
              className="ml-4"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimateIn staggerIndex={1}>
          <Card className="bg-card border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalSubmissions}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Submissions
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn staggerIndex={2}>
          <Card className="bg-card border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {pendingCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pending Review
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
        <AnimateIn staggerIndex={3}>
          <Card className="bg-card border border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {preApprovedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pre-Approved / Approved
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimateIn>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, email, or document title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-base h-11 border-border"
        />
      </div>

      {/* ── Grouped Student List ───────────────────────────────────────── */}
      {filteredGroups.length === 0 ? (
        <Card className="bg-card border border-border">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? "No student submissions match your search"
                : "No student submissions yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!searchQuery &&
                "When students create copies from official templates and share them with you, they will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group, groupIndex) => (
            <AnimateIn
              key={group.studentId}
              staggerIndex={Math.min((groupIndex % 8) + 1, 8)}
            >
              <Card className="bg-card border border-border hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  {/* Student Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base truncate">
                        {group.studentName}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.studentEmail}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {group.documents.length} document
                      {group.documents.length > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Document List */}
                  <div className="space-y-2">
                    {group.documents.map((doc) => {
                      const statusInfo =
                        STATUS_MAP[doc.status] || STATUS_MAP.draft;
                      const isLocked =
                        doc.status === "pre_approved" ||
                        doc.status === "approved";

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Updated{" "}
                              {new Date(doc.updated_at).toLocaleDateString()}
                            </p>
                          </div>

                          <Badge variant={statusInfo.variant} className="text-[10px] shrink-0">
                            {isLocked && (
                              <Lock className="w-2.5 h-2.5 mr-1" />
                            )}
                            {statusInfo.label}
                          </Badge>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Review Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleReview(doc.id)}
                            >
                              <Eye className="w-3 h-3" />
                              Review
                            </Button>

                            {/* Pre-Approve Button (only for draft / in_review) */}
                            {!isLocked && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handlePreApprove(doc.id)}
                                disabled={preApprovingId === doc.id}
                              >
                                {preApprovingId === doc.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-3 h-3" />
                                )}
                                Pre-Approve
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentRequirementsQueue;
