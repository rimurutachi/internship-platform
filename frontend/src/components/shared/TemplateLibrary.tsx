"use client";

/**
 * TemplateLibrary
 *
 * Displays the Official Document Templates Library as part of the
 * Structured Template Hub & Student Requirements Queue workflow.
 *
 * For Students: Shows available templates with a "Use Template" button
 *   that auto-creates a personal working copy via the backend.
 * For Advisors/Admins: Shows templates with an "Upload Template" action.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Copy,
  Loader2,
  AlertCircle,
  RefreshCw,
  Upload,
  Calendar,
  Tag,
  User,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimateIn } from "@/components/ui/AnimateIn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupabaseClient } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateField {
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "email" | "phone";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: any;
  help_text?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  fields: TemplateField[];
  category: string;
  tags: string[];
  is_public: boolean;
  requires_approval: boolean;
  created_by: string;
  created_at: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface TemplateLibraryProps {
  userType: "student" | "advisor" | "supervisor";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOCUMENT_SERVICE_URL =
  process.env.NEXT_PUBLIC_DOCUMENT_SERVICE_URL || "http://localhost:6001";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthHeaders() {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TemplateLibrary({ userType }: TemplateLibraryProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // "Use Template" dialog state
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [documentName, setDocumentName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Upload master template state
  const [uploadTemplateOpen, setUploadTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("agreement");
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [uploadTemplateError, setUploadTemplateError] = useState<string | null>(null);

  // Template management state
  const [editTemplateOpen, setEditTemplateOpen] = useState(false);
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);
  const [selectedTemplateToManage, setSelectedTemplateToManage] = useState<Template | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateDesc, setEditTemplateDesc] = useState("");
  const [isManagingTemplate, setIsManagingTemplate] = useState(false);

  // ── Create/Upload Master Template handler ──────────────────────────────────
  const handleCreateMasterTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      setUploadingTemplate(true);
      setUploadTemplateError(null);

      const headers = await getAuthHeaders();
      await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/templates/`,
        {
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim(),
          category: newTemplateCategory,
          content: `<h1>${newTemplateName}</h1><p>Official template document content.</p>`,
          fields: [
            { name: "company_name", label: "Company Name", type: "text", required: true },
            { name: "company_address", label: "Company Address", type: "textarea", required: true },
            { name: "student_name", label: "Student Full Name", type: "text", required: true },
            { name: "start_date", label: "Internship Start Date", type: "date", required: true },
          ],
          is_public: true,
        },
        { headers }
      );

      setUploadTemplateOpen(false);
      setNewTemplateName("");
      setNewTemplateDesc("");
      loadTemplates();
    } catch (err) {
      console.error("❌ [TemplateLibrary] Create master template error:", err);
      setUploadTemplateError(
        err instanceof Error ? err.message : "Failed to create master template"
      );
    } finally {
      setUploadingTemplate(false);
    }
  };

  // ── Fetch templates ────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${DOCUMENT_SERVICE_URL}/api/templates/`,
        { headers }
      );

      const data = response.data.success
        ? response.data.data
        : response.data;
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ [TemplateLibrary] Load error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load templates"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ── Manage Templates ───────────────────────────────────────────────────────
  const handleUpdateTemplate = async () => {
    if (!selectedTemplateToManage || !editTemplateName.trim()) return;

    try {
      setIsManagingTemplate(true);
      const headers = await getAuthHeaders();
      await axios.patch(
        `${DOCUMENT_SERVICE_URL}/api/templates/${selectedTemplateToManage.id}`,
        {
          name: editTemplateName,
          description: editTemplateDesc,
        },
        { headers }
      );
      setEditTemplateOpen(false);
      loadTemplates();
    } catch (err) {
      console.error("❌ [TemplateLibrary] Update template error:", err);
      alert(err instanceof Error ? err.message : "Failed to update template");
    } finally {
      setIsManagingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateToManage) return;

    try {
      setIsManagingTemplate(true);
      const headers = await getAuthHeaders();
      await axios.delete(
        `${DOCUMENT_SERVICE_URL}/api/templates/${selectedTemplateToManage.id}`,
        { headers }
      );
      setDeleteTemplateOpen(false);
      loadTemplates();
    } catch (err) {
      console.error("❌ [TemplateLibrary] Delete template error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setIsManagingTemplate(false);
    }
  };

  // ── Filter templates ───────────────────────────────────────────────────────
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Open "Use Template" dialog ─────────────────────────────────────────────
  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setDocumentName(`${template.name} - My Copy`);
    setCreateError(null);

    // Initialize field values with defaults
    const defaults: Record<string, string> = {};
    template.fields?.forEach((field) => {
      defaults[field.name] = field.default_value || "";
    });
    setFieldValues(defaults);

    setUseTemplateDialogOpen(true);
  };

  // ── Create student working copy ────────────────────────────────────────────
  const handleCreateCopy = async () => {
    if (!selectedTemplate) return;

    try {
      setCreating(true);
      setCreateError(null);

      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${DOCUMENT_SERVICE_URL}/api/templates/${selectedTemplate.id}/create-document`,
        {
          field_values: fieldValues,
          document_name: documentName.trim() || selectedTemplate.name,
        },
        { headers }
      );

      const result = response.data.success
        ? response.data.data
        : response.data;

      setUseTemplateDialogOpen(false);

      // Navigate to the new document in Dual-Mode
      if (result?.documentId) {
        router.push(
          `/dashboard/${userType}/documents/${result.documentId}`
        );
      }
    } catch (err) {
      console.error("❌ [TemplateLibrary] Create copy error:", err);
      if (axios.isAxiosError(err)) {
        setCreateError(err.response?.data?.error || err.message);
      } else {
        setCreateError(
          err instanceof Error ? err.message : "Failed to create copy"
        );
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3 animate-in fade-in">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading templates...
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
              onClick={loadTemplates}
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
      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search templates by name, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-base h-11 border-border flex-1"
        />

        {(userType === "advisor" || userType === "supervisor") && (
          <Button
            onClick={() => setUploadTemplateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-5 gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload Master Template
          </Button>
        )}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="bg-card border border-border">
          <CardContent className="py-16 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? "No templates match your search"
                : "No official templates available yet"}
            </p>
            {userType === "advisor" && !searchQuery && (
              <div className="mt-4">
                <Button
                  onClick={() => setUploadTemplateOpen(true)}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Master Template Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <AnimateIn
              key={template.id}
              staggerIndex={Math.min((index % 12) + 1, 12)}
            >
              <Card className="bg-card border border-border hover:shadow-md transition-shadow h-full flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {template.category || "General"}
                      </Badge>
                      
                      {userType !== "student" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTemplateToManage(template);
                                setEditTemplateName(template.name);
                                setEditTemplateDesc(template.description || "");
                                setEditTemplateOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Template Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setSelectedTemplateToManage(template);
                                setDeleteTemplateOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Template
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Name & Description */}
                  <h3 className="font-semibold text-foreground text-base mb-1.5 line-clamp-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                    {template.description || "No description provided."}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    {template.creator && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {template.creator.first_name}{" "}
                        {template.creator.last_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  {template.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          <Tag className="w-2.5 h-2.5 mr-0.5" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Fields count */}
                  {template.fields?.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-4">
                      {template.fields.length} field
                      {template.fields.length > 1 ? "s" : ""} to fill
                    </p>
                  )}

                  {/* Action Button */}
                  {userType === "student" ? (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 gap-1.5"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                      Use Template / Fill My Copy
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-1.5"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Copy className="w-4 h-4" />
                      Create Copy from Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
      )}

      {/* ── "Use Template" Dialog ────────────────────────────────────────── */}
      <Dialog
        open={useTemplateDialogOpen}
        onOpenChange={setUseTemplateDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Create Your Document Copy
            </DialogTitle>
            <DialogDescription>
              Fill in the required fields below to generate your personalized
              copy of{" "}
              <span className="font-medium text-foreground">
                {selectedTemplate?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Document Name */}
            <div>
              <Label>Document Name *</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter a name for your copy..."
                className="mt-1.5"
                disabled={creating}
              />
            </div>

            {/* Dynamic Template Fields */}
            {selectedTemplate?.fields?.map((field) => (
              <div key={field.name}>
                <Label>
                  {field.label}
                  {field.required && " *"}
                </Label>
                {field.help_text && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {field.help_text}
                  </p>
                )}
                {field.type === "textarea" ? (
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5 min-h-[80px]"
                    value={fieldValues[field.name] || ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    disabled={creating}
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
                    value={fieldValues[field.name] || ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    disabled={creating}
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "date"
                        ? "date"
                        : field.type === "email"
                        ? "email"
                        : "text"
                    }
                    value={fieldValues[field.name] || ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="mt-1.5"
                    disabled={creating}
                  />
                )}
              </div>
            ))}

            {/* Error */}
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            {/* Create Button */}
            <Button
              onClick={handleCreateCopy}
              disabled={creating || !documentName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating your copy...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Create My Copy & Open
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── "Upload Master Template" Dialog ────────────────────────────── */}
      <Dialog
        open={uploadTemplateOpen}
        onOpenChange={setUploadTemplateOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Upload Official Master Template
            </DialogTitle>
            <DialogDescription>
              Create an official document template that all assigned OJT students can access and use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g. CvSU Official MOA Template 2026"
                className="mt-1.5"
                disabled={uploadingTemplate}
              />
            </div>

            <div>
              <Label>Category</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5"
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                disabled={uploadingTemplate}
              >
                <option value="agreement">Agreement / MOA</option>
                <option value="form">Waiver / Form</option>
                <option value="certificate">Endorsement / Certificate</option>
                <option value="evaluation">Evaluation</option>
                <option value="report">Report</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5 min-h-[80px]"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                placeholder="Briefly describe what this official template is for..."
                disabled={uploadingTemplate}
              />
            </div>

            {uploadTemplateError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadTemplateError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCreateMasterTemplate}
              disabled={uploadingTemplate || !newTemplateName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {uploadingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing Template...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Publish Official Template
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── "Edit Template" Dialog ────────────────────────────── */}
      <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Template Details</DialogTitle>
            <DialogDescription>
              Update the name and description of this official template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
                placeholder="e.g. CvSU Official MOA Template"
                className="mt-1.5"
                disabled={isManagingTemplate}
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1.5 min-h-[80px]"
                value={editTemplateDesc}
                onChange={(e) => setEditTemplateDesc(e.target.value)}
                placeholder="Briefly describe what this official template is for..."
                disabled={isManagingTemplate}
              />
            </div>

            <Button
              onClick={handleUpdateTemplate}
              disabled={isManagingTemplate || !editTemplateName.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isManagingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>Save Changes</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── "Delete Template" Dialog ────────────────────────────── */}
      <Dialog open={deleteTemplateOpen} onOpenChange={setDeleteTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Delete Official Template?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedTemplateToManage?.name}</strong>? 
              This will remove it from the template library for all students.
              Existing documents that were already generated from this template will not be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTemplateOpen(false)}
              disabled={isManagingTemplate}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
              disabled={isManagingTemplate}
            >
              {isManagingTemplate ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateLibrary;
