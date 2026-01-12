import { Router } from "express";
import * as templateController from "../controllers/templateController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Create new template
router.post("/", authenticateToken, templateController.createTemplate);

// List templates with filters
router.get("/", authenticateToken, templateController.listTemplates);

// Get specific template
router.get("/:templateId", authenticateToken, templateController.getTemplate);

// Update template
router.patch("/:templateId", authenticateToken, templateController.updateTemplate);

// Delete template (soft delete)
router.delete("/:templateId", authenticateToken, templateController.deleteTemplate);

// Create document from template
router.post("/:templateId/create-document", authenticateToken, templateController.createDocumentFromTemplate);

// Get templates by category
router.get("/category/:category", authenticateToken, templateController.getTemplatesByCategory);

// Search templates by tags
router.post("/search/tags", authenticateToken, templateController.searchTemplatesByTags);

// Get public templates (marketplace)
router.get("/public/list", templateController.getPublicTemplates);

export default router;
