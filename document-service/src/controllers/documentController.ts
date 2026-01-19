import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { storageService } from "../services/storageService";

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

    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    console.log('📂 [Documents] Fetching documents for user:', userId, 'role:', req.user.role);

    // Admin can see all documents
    if (isAdmin) {
      let query = supabase
        .from("documents")
        .select("*, owner:users!owner_id(id, first_name, last_name, email)", { count: 'exact' });

      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (owner_id) query = query.eq('owner_id', owner_id);
      if (search) {
        query = query.or(`title.ilike.%${search}%`);
      }

      const ascending = sort_order === 'asc';
      query = query.order(sort_by as string, { ascending });

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      console.log('✅ [Documents] Admin fetched', count, 'documents');
      
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
    }

    // For non-admin users: Get documents they own OR have access to
    // Step 1: Get documents user owns
    const { data: ownedDocs, error: ownedError } = await supabase
      .from("documents")
      .select("id")
      .eq("owner_id", userId);

    if (ownedError) throw ownedError;

    // Step 2: Get documents shared with user via document_access_control
    const { data: sharedAccess, error: accessError } = await supabase
      .from("document_access_control")
      .select("document_id")
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (accessError) throw accessError;

    // Combine owned and shared document IDs
    const ownedIds = (ownedDocs || []).map(d => d.id);
    const sharedIds = (sharedAccess || []).map(a => a.document_id);
    const accessibleIds = [...new Set([...ownedIds, ...sharedIds])];

    console.log('📂 [Documents] User has access to', accessibleIds.length, 'documents (owned:', ownedIds.length, ', shared:', sharedIds.length, ')');

    if (accessibleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          documents: [],
          total: 0,
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total_pages: 0,
        },
      });
    }

    // Step 3: Fetch full document details for accessible documents
    let query = supabase
      .from("documents")
      .select("*, owner:users!owner_id(id, first_name, last_name, email)", { count: 'exact' })
      .in("id", accessibleIds);

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%`);
    }

    const ascending = sort_order === 'asc';
    query = query.order(sort_by as string, { ascending });

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    console.log('✅ [Documents] User fetched', count, 'accessible documents');

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
    console.error('❌ [Documents] Get documents error:', error);
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

    console.log('📝 [Documents] Creating/Updating document:', { 
      title, 
      type, 
      owner_id,
      hasContent: !!content,
      hasDescription: !!description
    });

    // Check if document with same title exists for this user
    const { data: existingDoc, error: checkError } = await supabase
      .from("documents")
      .select("id, title, version, content, metadata")
      .eq("owner_id", owner_id)
      .eq("title", title)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error('❌ [Documents] Error checking existing documents:', checkError);
    }

    // Store description in metadata since there's no description column
    const metadataWithDesc = {
      ...(metadata || {}),
      ...(description ? { description } : {})
    };

    // If document with same title exists, UPDATE it (Google Drive style)
    if (existingDoc) {
      const currentVersion = existingDoc.version || "1.0.0";
      
      // Parse version and increment (e.g., "1.0.0" -> "2.0.0")
      const versionParts = currentVersion.split('.').map(Number);
      versionParts[0] = (versionParts[0] || 1) + 1;
      const newVersion = versionParts.join('.');
      
      console.log(`📚 [Documents] Found existing document. Creating version history and updating: ${currentVersion} -> ${newVersion}`);

      // Step 1: Save current version to version_history BEFORE updating
      const { data: currentFiles } = await supabase
        .from("document_files")
        .select("id, storage_path, file_name, file_size, mime_type")
        .eq("document_id", existingDoc.id)
        .eq("is_primary", true)
        .limit(1)
        .maybeSingle();

      // Create version history record with the OLD version info
      const versionHistoryRecord = {
        document_id: existingDoc.id,
        version: currentVersion, // Save the OLD version number
        storage_path: currentFiles?.storage_path || null,
        file_name: currentFiles?.file_name || null,
        file_size: currentFiles?.file_size || null,
        mime_type: currentFiles?.mime_type || null,
        uploaded_by: owner_id,
        is_archived: true,
        replaced_by_version: newVersion,
        created_at: new Date().toISOString()
      };

      const { error: historyError } = await supabase
        .from("document_file_versions")
        .insert(versionHistoryRecord);

      if (historyError) {
        console.warn('⚠️ [Documents] Could not create version history:', historyError.message);
        // Continue anyway - don't fail the upload
      } else {
        console.log(`📚 [Documents] Version ${currentVersion} saved to history`);
      }

      // Step 2: Update the SAME document with new version
      const { data: updatedDoc, error: updateError } = await supabase
        .from("documents")
        .update({
          type,
          content: content || existingDoc.content,
          metadata: metadataWithDesc,
          version: newVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDoc.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [Documents] Update error:', updateError);
        throw updateError;
      }

      console.log(`✅ [Documents] Updated to version ${newVersion}:`, updatedDoc.id);
      
      return res.status(200).json({ 
        success: true, 
        data: updatedDoc,
        isUpdate: true,
        previousVersion: currentVersion
      });
    }

    // NEW document - create fresh
    const { data, error } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        content: content || {},
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

    console.log('✅ [Documents] Created new document:', data.id, data.title);

    return res.status(201).json({ success: true, data, isUpdate: false });
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

    console.log('🗑️ [Documents] Deleting document and related records:', id);

    // Step 1: Get all files associated with this document for storage cleanup
    const { data: files } = await supabase
      .from("document_files")
      .select("id, storage_path")
      .eq("document_id", id);

    // Step 2: Delete files from Supabase Storage
    if (files && files.length > 0) {
      console.log(`📁 [Documents] Deleting ${files.length} files from storage`);
      for (const file of files) {
        if (file.storage_path) {
          await storageService.removeFile(file.storage_path);
        }
      }
    }

    // Step 3: Delete document_files records (if not cascade)
    await supabase
      .from("document_files")
      .delete()
      .eq("document_id", id);

    // Step 4: Delete document_access_control records
    await supabase
      .from("document_access_control")
      .delete()
      .eq("document_id", id);

    // Step 5: Delete file version history records
    const { data: fileVersions } = await supabase
      .from("document_file_versions")
      .select("id, storage_path")
      .eq("document_id", id);

    // Delete version files from storage
    if (fileVersions && fileVersions.length > 0) {
      console.log(`📁 [Documents] Deleting ${fileVersions.length} version files from storage`);
      for (const version of fileVersions) {
        if (version.storage_path) {
          await storageService.removeFile(version.storage_path);
        }
      }
    }

    // Delete version history records
    await supabase
      .from("document_file_versions")
      .delete()
      .eq("document_id", id);

    // Step 6: Finally delete the document itself
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('❌ [Documents] Delete error:', error);
      throw error;
    }

    console.log('✅ [Documents] Deleted document and all related records:', id);

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

    console.log('📚 [Documents] Fetching version history for document:', id);

    // Get version history from document_file_versions table
    const { data: versions, error } = await supabase
      .from("document_file_versions")
      .select(`
        id,
        document_id,
        version,
        storage_path,
        file_name,
        file_size,
        mime_type,
        uploaded_by,
        is_archived,
        replaced_by_version,
        created_at,
        users:uploaded_by (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("document_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('❌ [Documents] Error fetching versions:', error);
      throw error;
    }

    // Also get current document info as the "latest" version
    const { data: currentDoc } = await supabase
      .from("documents")
      .select(`
        id,
        version,
        updated_at,
        owner_id,
        users:owner_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", id)
      .single();

    // Get current primary file
    const { data: currentFile } = await supabase
      .from("document_files")
      .select("id, storage_path, file_name, file_size")
      .eq("document_id", id)
      .eq("is_primary", true)
      .maybeSingle();

    // Build the full version list with current as first
    const versionList = [];

    // Add current version as the latest
    if (currentDoc) {
      versionList.push({
        id: `current-${currentDoc.id}`,
        document_id: id,
        version: currentDoc.version || "1.0.0",
        file_path: currentFile?.storage_path || null,
        file_name: currentFile?.file_name || null,
        file_size: currentFile?.file_size || null,
        change_summary: "Current version",
        changed_by: currentDoc.owner_id,
        created_at: currentDoc.updated_at,
        created_by_user: currentDoc.users,
        is_current: true
      });
    }

    // Add historical versions
    if (versions && versions.length > 0) {
      versions.forEach(v => {
        versionList.push({
          id: v.id,
          document_id: v.document_id,
          version: v.version,
          file_path: v.storage_path,
          file_name: v.file_name,
          file_size: v.file_size,
          mime_type: v.mime_type,
          changed_by: v.uploaded_by,
          created_at: v.created_at,
          created_by_user: v.users,
          is_current: false,
          is_archived: v.is_archived,
          replaced_by_version: v.replaced_by_version
        });
      });
    }

    console.log(`📚 [Documents] Found ${versionList.length} versions`);

    return res.json({ success: true, data: versionList });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ [Documents] Get versions error:', message);
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

/**
 * Get download URL for a specific version from version history
 */
export async function getVersionDownloadUrl(req: Request, res: Response) {
  try {
    const { id: documentId, versionId } = req.params;

    console.log('📥 [Documents] Getting download URL for version:', versionId);

    // Check if this is the current version
    if (versionId.startsWith('current-')) {
      // Get current file from document_files
      const { data: currentFile, error } = await supabase
        .from("document_files")
        .select("id, storage_path, file_name")
        .eq("document_id", documentId)
        .eq("is_primary", true)
        .maybeSingle();

      if (error || !currentFile?.storage_path) {
        return res.status(404).json({
          success: false,
          error: "No file found for current version"
        });
      }

      const signedUrl = await storageService.createSignedUrl(currentFile.storage_path);
      
      return res.json({
        success: true,
        data: {
          url: signedUrl,
          file_name: currentFile.file_name
        }
      });
    }

    // Get historical version from document_file_versions
    const { data: version, error } = await supabase
      .from("document_file_versions")
      .select("id, storage_path, file_name")
      .eq("id", versionId)
      .eq("document_id", documentId)
      .single();

    if (error || !version) {
      return res.status(404).json({
        success: false,
        error: "Version not found"
      });
    }

    if (!version.storage_path) {
      return res.status(404).json({
        success: false,
        error: "No file associated with this version"
      });
    }

    const signedUrl = await storageService.createSignedUrl(version.storage_path);

    console.log('✅ [Documents] Version download URL generated');

    return res.json({
      success: true,
      data: {
        url: signedUrl,
        file_name: version.file_name
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('❌ [Documents] Get version download URL error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
