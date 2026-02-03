import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import templateService from "../services/templateService";
import auditService from "../services/auditService";

export async function createTemplate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { name, description, content, fields, category, tags, is_public, requires_approval } = req.body;

    if (!name || !content || !fields) {
      return res.status(400).json({
        success: false,
        error: "name, content, and fields are required.",
      });
    }

    console.log("📝 [Template Controller] Creating template", { name });

    const result = await templateService.createTemplate(
      req.user.id,
      { name, description, content, fields, category, tags, is_public, requires_approval },
      req.user.role === "admin"
    );

    if (!result) {
      return res.status(500).json({ success: false, error: "Failed to create template." });
    }

    await auditService.logAction({
      documentId: result.id,
      userId: req.user.id,
      action: "template_created",
      metadata: { template_name: name, field_count: fields.length },
    });

    console.log("✅ [Template Controller] Template created");

    return res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    console.error("❌ [Template Controller] Create error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
}

export async function getTemplate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { templateId } = req.params;

    const template = await templateService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found." });
    }

    return res.json({ success: true, data: template });
  } catch (error) {
    console.error("❌ [Template Controller] Get error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function listTemplates(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { category, is_public, created_by, limit = 50, offset = 0 } = req.query;

    const templates = await templateService.listTemplates({
      category: category as string | undefined,
      is_public: is_public === "true",
      created_by: created_by as string | undefined,
      limit: Math.min(parseInt(String(limit)), 100),
      offset: parseInt(String(offset)),
    });

    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ [Template Controller] List error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function updateTemplate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { templateId } = req.params;
    const { name, description, content, fields, category, tags, is_public, requires_approval } = req.body;

    console.log("✏️ [Template Controller] Updating template", { templateId: templateId.substring(0, 8) });

    const success = await templateService.updateTemplate(
      templateId,
      req.user.id,
      { name, description, content, fields, category, tags, is_public, requires_approval },
      req.user.role === "admin"
    );

    if (!success) {
      return res.status(400).json({ success: false, error: "Failed to update template." });
    }

    const updated = await templateService.getTemplate(templateId);

    await auditService.logAction({
      documentId: templateId,
      userId: req.user.id,
      action: "template_updated",
      metadata: { template_name: name },
    });

    console.log("✅ [Template Controller] Template updated");

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ [Template Controller] Update error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { templateId } = req.params;

    console.log("🗑️ [Template Controller] Deleting template", {
      templateId: templateId.substring(0, 8),
    });

    const success = await templateService.deleteTemplate(templateId, req.user.id, req.user.role === "admin");

    if (!success) {
      return res.status(400).json({ success: false, error: "Failed to delete template." });
    }

    await auditService.logAction({
      documentId: templateId,
      userId: req.user.id,
      action: "template_deleted",
      metadata: { template_id: templateId },
    });

    console.log("✅ [Template Controller] Template deleted");

    return res.json({ success: true, message: "Template deleted successfully." });
  } catch (error) {
    console.error("❌ [Template Controller] Delete error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function createDocumentFromTemplate(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { templateId } = req.params;
    const { field_values, document_name } = req.body;

    if (!field_values) {
      return res.status(400).json({ success: false, error: "field_values is required." });
    }

    console.log("📄 [Template Controller] Creating document from template", {
      templateId: templateId.substring(0, 8),
    });

    const result = await templateService.createDocumentFromTemplate(
      templateId,
      req.user.id,
      field_values,
      document_name
    );

    if (!result) {
      return res.status(500).json({ success: false, error: "Failed to create document from template." });
    }

    await auditService.logAction({
      documentId: result.documentId,
      userId: req.user.id,
      action: "document_created_from_template",
      metadata: { template_id: templateId },
    });

    console.log("✅ [Template Controller] Document created from template");

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ [Template Controller] Create document error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ success: false, error: message });
  }
}

export async function getTemplatesByCategory(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { category } = req.params;
    const { limit = 50 } = req.query;

    const templates = await templateService.getTemplatesByCategory(
      category,
      Math.min(parseInt(String(limit)), 100)
    );

    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ [Template Controller] Get by category error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function searchTemplatesByTags(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const { tags } = req.body;
    const { limit = 50 } = req.query;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ success: false, error: "tags array is required." });
    }

    const templates = await templateService.searchByTags(tags, Math.min(parseInt(String(limit)), 100));

    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ [Template Controller] Search by tags error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getPublicTemplates(req: AuthRequest, res: Response) {
  try {
    const { limit = 100 } = req.query;

    const templates = await templateService.getPublicTemplates(Math.min(parseInt(String(limit)), 500));

    return res.json({ success: true, data: templates });
  } catch (error) {
    console.error("❌ [Template Controller] Get public templates error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
