"use client";

/**
 * DocumentDualModeContainer (Now DocumentHighFidelityContainer)
 *
 * Wrapper component for the High-Fidelity Document Viewer.
 * Replaced the dual-mode collaborative/form editor with a simple
 * Download -> Local Edit -> Upload workflow.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Lock,
  Unlock,
  Loader2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { documentsAPI } from "@/lib/api/documents";
import { createSupabaseClient } from "@/lib/supabase";
import { DocumentHighFidelityViewer } from "./DocumentHighFidelityViewer";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentDualModeContainerProps {
  documentId: string;
  userType: "student" | "advisor" | "supervisor";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentDualModeContainer({
  documentId,
  userType,
}: DocumentDualModeContainerProps) {
  const router = useRouter();
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [documentStatus, setDocumentStatus] = useState<string>("draft");
  const [fileType, setFileType] = useState<string>("");
  const [isTemplateDocument, setIsTemplateDocument] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasFile, setHasFile] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerKey, setViewerKey] = useState(0); // To force re-render viewer

  // ── Fetch document metadata ────────────────────────────────────────────────
  const loadDocumentInfo = useCallback(async () => {
    try {
      setLoading(true);
      const doc = await documentsAPI.getDocument(documentId);
      setDocumentTitle(doc.title || "Untitled Document");
      setDocumentStatus(doc.status || "draft");
      setFileType(doc.file_url ? (doc.file_url.split(".").pop() || "") : "");
      setIsTemplateDocument(!!doc.metadata?.document_template_id);
      const fileAttached = !!doc.file_url;
      setHasFile(fileAttached);
    } catch (err) {
      console.error("❌ [DualMode] Failed to load document info:", err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocumentInfo();
  }, [loadDocumentInfo]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isLocked = documentStatus === "pre_approved" || documentStatus === "approved";
  const isEditable = !isLocked;
  const isDocxOrDoc = fileType === "docx" || fileType === "doc";

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleBack = () => {
    router.push(`/dashboard/${userType}/documents`);
  };

  const handleSubmitForReview = async () => {
    try {
      setLoading(true);

      // We no longer manually grant access here - the backend automatically 
      // grants access to the advisor when status is changed to 'in_review'
      
      // Update document status to in_review
      await documentsAPI.updateDocument(documentId, { status: "in_review" });
      setDocumentStatus("in_review");
    } catch (error) {
      console.error("❌ [DualMode] Failed to submit for review:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToDraft = async () => {
    if (!confirm('Are you sure you want to revert this document to draft? Your advisor will no longer be able to review it until you submit it again.')) return;
    
    try {
      setLoading(true);
      
      // Revert status to draft - backend will automatically revoke advisor access
      await documentsAPI.updateDocument(documentId, { status: "draft" });
      setDocumentStatus("draft");
    } catch (error) {
      console.error("❌ [DualMode] Failed to revert to draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEditedDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_primary', 'true');

      const DOCUMENT_SERVICE_URL = process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || 'http://localhost:6001';
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/documents/${documentId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      loadDocumentInfo();
      setViewerKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Error uploading document');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // ── Status badge color mapping ─────────────────────────────────────────────
  const getStatusBadge = () => {
    switch (documentStatus) {
      case 'draft': return <Badge variant="outline" className="capitalize text-[10px] h-5 border-slate-400 text-slate-600">Draft</Badge>;
      case 'pre_approved': return <Badge className="capitalize text-[10px] h-5 bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">🔒 Pre-Approved</Badge>;
      case 'approved': return <Badge className="capitalize text-[10px] h-5 bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">✅ Approved</Badge>;
      case 'in_review': return <Badge className="capitalize text-[10px] h-5 bg-blue-100 text-blue-800 border border-blue-400 font-medium shadow-sm dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600">⏳ In Review</Badge>;
      case 'rejected': return <Badge className="capitalize text-[10px] h-5" variant="destructive">Rejected</Badge>;
      default: return <Badge className="capitalize text-[10px] h-5" variant="outline">{documentStatus}</Badge>;
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3 animate-in fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-screen bg-background">
        {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shadow-sm">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate max-w-[400px]">
                {documentTitle}
              </h1>
            </div>

            {getStatusBadge()}

            {isLocked && (
              <Tooltip>
                <TooltipTrigger>
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Content is locked (Pre-Approved)
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Center: Removed Mode Toggle */}
          <div className="flex items-center">
            {/* The fill fields toggle is removed for a cleaner local edit workflow */}
          </div>

          {/* Right: Actions & User Type */}
          <div className="flex items-center gap-3 shrink-0">
            {userType === "student" && documentStatus === "draft" && (
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => document.getElementById('upload-edited-doc')?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Edited Document
                </Button>
                <input
                  type="file"
                  id="upload-edited-doc"
                  className="hidden"
                  accept=".doc,.docx,.pdf"
                  onChange={handleUploadEditedDocument}
                />
                {hasFile && (
                  <Button size="sm" onClick={handleSubmitForReview} className="bg-primary hover:bg-primary/90">
                    Submit for Pre-Approval
                  </Button>
                )}
              </div>
            )}
            {userType === "student" && documentStatus === "in_review" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRevertToDraft} 
                className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Unlock className="w-4 h-4 mr-1.5" />
                Revert to Draft
              </Button>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {userType}
            </Badge>
          </div>
        </div>

        {/* ── Content Area ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <DocumentHighFidelityViewer
            key={viewerKey}
            documentId={documentId}
            userType={userType}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default DocumentDualModeContainer;
