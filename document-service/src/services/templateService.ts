import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

interface TemplateField {
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "email" | "phone";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: any;
  validation_pattern?: string;
  help_text?: string;
}

interface DocumentTemplate {
  name: string;
  description: string;
  content: string;
  fields: TemplateField[];
  category?: string;
  tags?: string[];
  is_public?: boolean;
  requires_approval?: boolean;
}

export const templateService = {
  /**
   * Create a new document template
   */
  async createTemplate(
    userId: string,
    template: DocumentTemplate,
    isAdmin: boolean = false
  ): Promise<{ id: string; data: any } | null> {
    console.log("📝 [Template] Creating template", {
      name: template.name,
      fields: template.fields.length,
    });

    try {
      // Validate template structure
      const validation = this.validateTemplate(template);
      if (!validation.valid) {
        console.warn("⚠️ [Template] Validation errors", validation.errors);
        throw new Error(`Template validation failed: ${validation.errors.join(", ")}`);
      }

      const { data, error } = await supabase
        .from("document_templates")
        .insert({
          name: template.name,
          description: template.description,
          content: template.content,
          fields: template.fields,
          category: template.category || "general",
          tags: template.tags || [],
          is_public: template.is_public || false,
          requires_approval: template.requires_approval || false,
          created_by: userId,
          created_at: new Date().toISOString(),
          metadata: {
            field_count: template.fields.length,
            is_admin_created: isAdmin,
          },
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [Template] Create error", error);
        throw error;
      }

      console.log("✅ [Template] Created", { templateId: data.id.substring(0, 8) });

      return { id: data.id, data };
    } catch (error) {
      console.error("❌ [Template Service] Create error", error);
      return null;
    }
  },

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<any> {
    console.log("🔍 [Template] Fetching template", {
      templateId: templateId.substring(0, 8),
    });

    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*, creator:users!created_by(id, first_name, last_name)")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("❌ [Template] Get error", error);
        return null;
      }

      console.log("✅ [Template] Fetched");

      return data;
    } catch (error) {
      console.error("❌ [Template Service] Get error", error);
      return null;
    }
  },

  /**
   * List templates with filters
   */
  async listTemplates(
    filters?: {
      category?: string;
      is_public?: boolean;
      created_by?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    console.log("📋 [Template] Listing templates", filters);

    try {
      let query = supabase
        .from("document_templates")
        .select("*, creator:users!created_by(id, first_name, last_name)");

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }

      if (filters?.is_public !== undefined) {
        query = query.eq("is_public", filters.is_public);
      }

      if (filters?.created_by) {
        query = query.eq("created_by", filters.created_by);
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error("❌ [Template] List error", error);
        return [];
      }

      console.log("✅ [Template] Listed", { count: data?.length || 0 });

      return data || [];
    } catch (error) {
      console.error("❌ [Template Service] List error", error);
      return [];
    }
  },

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    updates: Partial<DocumentTemplate>,
    isAdmin: boolean = false
  ): Promise<boolean> {
    console.log("✏️ [Template] Updating template", {
      templateId: templateId.substring(0, 8),
    });

    try {
      // Check ownership
      const { data: template, error: fetchError } = await supabase
        .from("document_templates")
        .select("created_by")
        .eq("id", templateId)
        .single();

      if (fetchError || !template) {
        console.error("❌ [Template] Template not found");
        return false;
      }

      if (template.created_by !== userId && !isAdmin) {
        console.warn("⚠️ [Template] No permission to update");
        return false;
      }

      // Validate if fields are updated
      if (updates.fields) {
        const validation = this.validateTemplate(updates as DocumentTemplate);
        if (!validation.valid) {
          console.warn("⚠️ [Template] Validation errors", validation.errors);
          throw new Error(`Template validation failed: ${validation.errors.join(", ")}`);
        }
      }

      const { error } = await supabase
        .from("document_templates")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          metadata: {
            field_count: updates.fields?.length || 0,
            last_updated_by: userId,
          },
        })
        .eq("id", templateId);

      if (error) {
        console.error("❌ [Template] Update error", error);
        throw error;
      }

      console.log("✅ [Template] Updated");

      return true;
    } catch (error) {
      console.error("❌ [Template Service] Update error", error);
      return false;
    }
  },

  /**
   * Delete template (soft delete)
   */
  async deleteTemplate(templateId: string, userId: string, isAdmin: boolean = false): Promise<boolean> {
    console.log("🗑️ [Template] Deleting template", {
      templateId: templateId.substring(0, 8),
    });

    try {
      // Check ownership
      const { data: template, error: fetchError } = await supabase
        .from("document_templates")
        .select("created_by")
        .eq("id", templateId)
        .single();

      if (fetchError || !template) {
        console.error("❌ [Template] Template not found");
        return false;
      }

      if (template.created_by !== userId && !isAdmin) {
        console.warn("⚠️ [Template] No permission to delete");
        return false;
      }

      const { error } = await supabase
        .from("document_templates")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", templateId);

      if (error) {
        console.error("❌ [Template] Delete error", error);
        throw error;
      }

      console.log("✅ [Template] Deleted");

      return true;
    } catch (error) {
      console.error("❌ [Template Service] Delete error", error);
      return false;
    }
  },

  /**
   * Create document from template (fill fields with values)
   */
  async createDocumentFromTemplate(
    templateId: string,
    userId: string,
    fieldValues: { [fieldName: string]: any },
    documentName: string
  ): Promise<{ documentId: string; content: string } | null> {
    console.log("📄 [Template] Creating document from template", {
      templateId: templateId.substring(0, 8),
    });

    try {
      const template = await this.getTemplate(templateId);

      if (!template) {
        console.error("❌ [Template] Template not found");
        return null;
      }

      // Validate field values
      const validation = this.validateFieldValues(template.fields, fieldValues);
      if (!validation.valid) {
        console.warn("⚠️ [Template] Field validation failed", validation.errors);
        throw new Error(`Field validation failed: ${validation.errors.join(", ")}`);
      }

      // Substitute fields in content
      let content = template.content;

      for (const field of template.fields) {
        const value = fieldValues[field.name] || field.default_value || "";
        const placeholder = `{{${field.name}}}`;
        content = content.replace(new RegExp(placeholder, "g"), value);
      }

      // Create document in documents table
      const { data: doc, error } = await supabase
        .from("documents")
        .insert({
          name: documentName || template.name,
          owner_id: userId,
          content,
          is_template_generated: true,
          template_id: templateId,
          created_at: new Date().toISOString(),
          metadata: {
            field_values: fieldValues,
            generated_from_template: true,
          },
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [Template] Create document error", error);
        throw error;
      }

      console.log("✅ [Template] Document created from template", {
        documentId: doc.id.substring(0, 8),
      });

      return { documentId: doc.id, content };
    } catch (error) {
      console.error("❌ [Template Service] Create document error", error);
      return null;
    }
  },

  /**
   * Validate template structure
   */
  validateTemplate(template: DocumentTemplate): { valid: boolean; errors: string[] } {
    console.log("✔️ [Template] Validating structure");

    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push("Template name is required");
    }

    if (!template.content || template.content.trim().length === 0) {
      errors.push("Template content is required");
    }

    if (!Array.isArray(template.fields)) {
      errors.push("Template fields must be an array");
      return { valid: false, errors };
    }

    for (let i = 0; i < template.fields.length; i++) {
      const field = template.fields[i];

      if (!field.name || field.name.trim().length === 0) {
        errors.push(`Field ${i}: name is required`);
      }

      if (!field.label || field.label.trim().length === 0) {
        errors.push(`Field ${i}: label is required`);
      }

      const validTypes = ["text", "number", "date", "select", "textarea", "email", "phone"];
      if (!validTypes.includes(field.type)) {
        errors.push(`Field ${i}: invalid type "${field.type}"`);
      }

      if (field.type === "select" && (!field.options || field.options.length === 0)) {
        errors.push(`Field ${i}: select type requires options array`);
      }
    }

    if (errors.length === 0) {
      console.log("✅ [Template] Validation passed");
    } else {
      console.warn("⚠️ [Template] Validation errors", errors);
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate field values against template
   */
  validateFieldValues(
    fields: TemplateField[],
    values: { [fieldName: string]: any }
  ): { valid: boolean; errors: string[] } {
    console.log("✔️ [Template] Validating field values");

    const errors: string[] = [];

    for (const field of fields) {
      const value = values[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === "")) {
        errors.push(`Field "${field.label}" is required`);
        continue;
      }

      if (value === undefined || value === null || value === "") {
        continue; // Optional field, skip validation
      }

      // Type validation
      if (field.type === "email" && !this.isValidEmail(value)) {
        errors.push(`Field "${field.label}" must be a valid email`);
      }

      if (field.type === "phone" && !this.isValidPhone(value)) {
        errors.push(`Field "${field.label}" must be a valid phone number`);
      }

      if (field.type === "number" && isNaN(Number(value))) {
        errors.push(`Field "${field.label}" must be a number`);
      }

      if (field.type === "date" && isNaN(new Date(value).getTime())) {
        errors.push(`Field "${field.label}" must be a valid date`);
      }

      if (field.type === "select" && field.options && !field.options.includes(value)) {
        errors.push(`Field "${field.label}" value must be one of: ${field.options.join(", ")}`);
      }

      // Pattern validation
      if (field.validation_pattern && value) {
        const regex = new RegExp(field.validation_pattern);
        if (!regex.test(String(value))) {
          errors.push(`Field "${field.label}" format is invalid`);
        }
      }
    }

    if (errors.length === 0) {
      console.log("✅ [Template] Field validation passed");
    } else {
      console.warn("⚠️ [Template] Field validation errors", errors);
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Email validation helper
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Phone validation helper
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Get template by category
   */
  async getTemplatesByCategory(category: string, limit: number = 50): Promise<any[]> {
    console.log("📂 [Template] Getting templates by category", { category });

    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*, creator:users!created_by(id, first_name, last_name)")
        .eq("category", category)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ [Template] Get by category error", error);
        return [];
      }

      console.log("✅ [Template] Templates by category fetched", {
        category,
        count: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      console.error("❌ [Template Service] Get by category error", error);
      return [];
    }
  },

  /**
   * Search templates by tags
   */
  async searchByTags(tags: string[], limit: number = 50): Promise<any[]> {
    console.log("🏷️ [Template] Searching by tags", { tags });

    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*, creator:users!created_by(id, first_name, last_name)")
        .contains("tags", tags)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ [Template] Search by tags error", error);
        return [];
      }

      console.log("✅ [Template] Tags search completed", {
        count: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      console.error("❌ [Template Service] Search by tags error", error);
      return [];
    }
  },

  /**
   * Get public templates (for marketplace)
   */
  async getPublicTemplates(limit: number = 100): Promise<any[]> {
    console.log("🌐 [Template] Getting public templates");

    try {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*, creator:users!created_by(id, first_name, last_name)")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ [Template] Get public templates error", error);
        return [];
      }

      console.log("✅ [Template] Public templates fetched", {
        count: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      console.error("❌ [Template Service] Get public templates error", error);
      return [];
    }
  },
};

export default templateService;
