import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

export async function getDocuments(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const {
      type,
      status,
      owner_id,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    let query = supabase
      .from("documents")
      .select("*, owner:users!owner_id(id, first_name, last_name, email)", { count: 'exact' });

    // Filter by owner (students can only see their own documents)
    if (req.user.role === 'student') {
      query = query.eq('owner_id', req.user.id);
    } else if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    // Apply filters
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sort_order === 'asc';
    query = query.order(sort_by as string, { ascending });

    // Apply pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data: {
        documents: data || [],
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const { title, type, content, description, metadata } = req.body || {};
    const owner_id = req.user.id;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        error: "Title and type are required.",
      });
    }

    console.log('📝 [Documents] Creating document:', { 
      title, 
      type, 
      owner_id,
      hasContent: !!content,
      hasDescription: !!description
    });

    // Store description in metadata since there's no description column
    const metadataWithDesc = {
      ...(metadata || {}),
      ...(description ? { description } : {})
    };

    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        content: content || {}, // JSONB column
        metadata: metadataWithDesc,
        owner_id,
        version: "1.0.0",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Documents] Supabase error:', error);
      throw error;
    }

    console.log('✅ [Documents] Created:', data.id, data.title);

    return res.status(201).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ [Documents] Create error:', message);
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

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    // First check if document exists and user owns it (or is admin)
    const { data: existingDoc, error: fetchError } = await supabase
      .from("documents")
      .select("id, owner_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    // Check ownership (allow owner or admin)
    const isOwner = existingDoc.owner_id === userId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this document",
      });
    }

    // Delete the document
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    console.log('🗑️ [Documents] Deleted:', id);

    return res.json({ 
      success: true, 
      message: "Document deleted successfully" 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ [Documents] Delete error:', message);
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
