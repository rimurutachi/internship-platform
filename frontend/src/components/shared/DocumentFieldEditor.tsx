"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentsAPI } from "@/lib/api/documents";

interface DocumentFieldEditorProps {
  documentId: string;
  userType: "student" | "advisor" | "supervisor";
  onSwitchToPreview: () => void;
}

export function DocumentFieldEditor({ documentId, userType, onSwitchToPreview }: DocumentFieldEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 1. Fetch document to get metadata and template id
        const doc = await documentsAPI.getDocument(documentId);
        setDocumentTitle(doc.title || "Untitled Document");
        const templateId = doc.metadata?.document_template_id;
        const existingValues = doc.metadata?.field_values || {};

        if (!templateId) {
          setError("This document is not associated with a template.");
          return;
        }

        // 2. Fetch template to get fallback fields (if any)
        // We use the new dynamic extraction API to pull fields directly from the .docx file!
        const dynamicFields = await documentsAPI.extractTemplateFields(documentId);
        setFields(dynamicFields || []);
        
        // Initialize values
        const initialValues: Record<string, string> = {};
        (dynamicFields || []).forEach((field: any) => {
          initialValues[field.name] = existingValues[field.name] || field.default_value || "";
        });
        setFieldValues(initialValues);

      } catch (err: any) {
        console.error("❌ [FieldEditor] Load error:", err);
        setError(err.message || "Failed to load document fields");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [documentId]);

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAndGenerate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Call generate API to create the personalized .docx file
      await documentsAPI.generateDocx(documentId, fieldValues);

      // Automatically switch back to Page View so they can see the result
      onSwitchToPreview();
    } catch (err: any) {
      console.error("❌ [FieldEditor] Generate error:", err);
      setError(err.message || "Failed to generate document");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-muted/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading template fields...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-muted/10">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={onSwitchToPreview}>Return to Preview</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Template Editor</h3>
            <p className="text-xs text-muted-foreground">{documentTitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSwitchToPreview} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveAndGenerate} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Generate Document
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-auto p-8 bg-muted/20">
        <div className="max-w-2xl mx-auto bg-white rounded-lg border shadow-sm p-8">
          <div className="mb-8 border-b pb-4">
            <h2 className="text-lg font-semibold text-foreground">Fill Document Fields</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Provide the required information below. This will be automatically formatted and injected into the official university template.
            </p>
          </div>

          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  value={fieldValues[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className="bg-muted/5 focus-visible:bg-white"
                />
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center p-8 border border-dashed rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">This template has no fillable fields.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
