import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const { title, type, content } = req.body || {};
    const owner_id = req.user.id;

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        content: content ?? "",
        owner_id,
        version: "1.0.0",
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data)
      return res
        .status(404)
        .json({ success: false, error: "Document not found" });
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function updateDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (!updates || Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No update fields provided" });
    }

    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data)
      return res
        .status(404)
        .json({ success: false, error: "Document not found" });
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Return deleted row to confirm existence
    const { data, error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;
    if (!data)
      return res
        .status(404)
        .json({ success: false, error: "Document not found" });
    return res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getVersions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function createVersion(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }
    const { id } = req.params;
    const { content, changes_summary, change_type } = req.body || {};

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required.",
      });
    }

    // Get current document (with ownership check)
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("version, owner_id, content")
      .eq("id", id)
      .single();

    if (docError) throw docError;
    if (!doc)
      return res
        .status(404)
        .json({ success: false, error: "Document not found" });

    // Authorization check
    if (doc.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Unauthorized." });
    }

    // Version bump logic
    const currentVersion = doc.version || "0.0.0";
    const [major, minor, patch] = currentVersion.split(".").map(Number);
    const bump = change_type || "patch";

    const newVersion =
      bump === "major"
        ? `${major + 1}.0.0`
        : bump === "minor"
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;

    // Create version record
    const { data, error } = await supabase
      .from("document_versions")
      .insert({
        document_id: id,
        version: newVersion,
        content,
        changes_summary,
        changed_by: req.user.id,
        change_type: bump,
      })
      .select()
      .single();

    if (error) throw error;

    // Update document version and content
    await supabase
      .from("documents")
      .update({
        version: newVersion,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}
