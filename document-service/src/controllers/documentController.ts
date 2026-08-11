import { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/auth";
import { storageService } from "../services/storageService";
import { docxGenerator } from "../utils/docxGenerator";

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

export async function updateDocument(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (!updates || Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No update fields provided" });
    }

    // HYBRID WORKFLOW: Check if document is pre-approved (content-locked)
    // Pre-approved documents cannot be edited to preserve content integrity
    const { data: currentDoc, error: fetchError } = await supabase
      .from("documents")
      .select("status, owner_id")
      .eq("id", id)
      .single();

    if (fetchError || !currentDoc) {
      return res
        .status(404)
        .json({ success: false, error: "Document not found" });
    }

    if (currentDoc.status === "pre_approved") {
      return res.status(403).json({
        success: false,
        error: "Document is pre-approved and content-locked. Revert pre-approval to enable editing.",
        code: "DOCUMENT_LOCKED",
      });
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

    // HYBRID WORKFLOW: Automatically grant/revoke access to advisor based on status
    if (updates.status === "in_review" || updates.status === "draft") {
      try {
        const { data: internship } = await supabase
          .from("internships")
          .select("advisor_id")
          .eq("student_id", currentDoc.owner_id)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (internship?.advisor_id) {
          if (updates.status === "in_review") {
            // Grant view access - check if exists first since there's no unique constraint
            const { data: existingAccess } = await supabase
              .from("document_access_control")
              .select("id")
              .eq("document_id", id)
              .eq("user_id", internship.advisor_id)
              .limit(1)
              .maybeSingle();

            if (existingAccess) {
              await supabase.from("document_access_control").update({
                revoked_at: null,
                permission_level: "view",
                granted_at: new Date().toISOString()
              }).eq("id", existingAccess.id);
            } else {
              await supabase.from("document_access_control").insert({
                document_id: id,
                user_id: internship.advisor_id,
                permission_level: "view",
                granted_by: req.user?.id || currentDoc.owner_id,
                granted_at: new Date().toISOString(),
                revoked_at: null,
              });
            }
            console.log(`✅ [Documents] Granted advisor view access for document ${id}`);
          } else if (updates.status === "draft") {
            // Revoke access by setting revoked_at
            await supabase.from("document_access_control").update({
              revoked_at: new Date().toISOString()
            }).eq("document_id", id).eq("user_id", internship.advisor_id);
            console.log(`✅ [Documents] Revoked advisor view access for document ${id} (reverted to draft)`);
          }
        }
      } catch (accessErr) {
        console.warn("⚠️ [Documents] Could not update advisor access:", accessErr);
      }
    }

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

    console.log('🗑️ [Documents] Deleting document and all related records:', id);

    // Step 1: Collect storage files for later cleanup
    const { data: files } = await supabase
      .from("document_files")
      .select("id, storage_path")
      .eq("document_id", id);

    const { data: fileVersions } = await supabase
      .from("document_file_versions")
      .select("id, storage_path")
      .eq("document_id", id);

    // Step 2: Delete grandchild records that reference document_signatures
    const { data: signatures } = await supabase
      .from("document_signatures")
      .select("id")
      .eq("document_id", id);

    if (signatures && signatures.length > 0) {
      const signatureIds = signatures.map(s => s.id);
      await supabase
        .from("signature_verification_attempts")
        .delete()
        .in("signature_id", signatureIds);
      await supabase
        .from("signature_verification_queue")
        .delete()
        .in("signature_id", signatureIds);
    }

    // Step 3: Delete grandchild records that reference document_workflows
    const { data: workflows } = await supabase
      .from("document_workflows")
      .select("id")
      .eq("document_id", id);

    if (workflows && workflows.length > 0) {
      const workflowIds = workflows.map(w => w.id);
      await supabase
        .from("document_approvals")
        .delete()
        .in("workflow_id", workflowIds);
      await supabase
        .from("workflow_states")
        .delete()
        .in("workflow_id", workflowIds);
    }

    // Step 4: Null out self-referencing parent_comment_id in document_comments
    await supabase
      .from("document_comments")
      .update({ parent_comment_id: null })
      .eq("document_id", id);

    // Step 5: Delete all direct child records of the document (in safe order)
    const childTables = [
      "document_audit_log",
      "document_changes",
      "collaboration_sessions",
      "document_comments",
      "document_signatures",
      "document_workflows",
      "document_access_control",
      "document_files",
      "document_file_versions",
      "document_content_versions",
    ] as const;

    for (const table of childTables) {
      const { error: deleteChildError } = await supabase
        .from(table)
        .delete()
        .eq("document_id", id);
      if (deleteChildError) {
        console.warn(`⚠️ [Documents] Could not delete from ${table}:`, deleteChildError.message);
      }
    }

    // Step 6: Delete files from Supabase Storage (after DB records removed)
    if (files && files.length > 0) {
      console.log(`📁 [Documents] Removing ${files.length} files from storage`);
      for (const file of files) {
        if (file.storage_path) {
          // Verify this storage path is not being used by any Official Template before deleting
          const { data: templatesUsingFile } = await supabase
            .from("document_templates")
            .select("id")
            .eq("structure->>master_file_url", file.storage_path)
            .limit(1);

          if (!templatesUsingFile || templatesUsingFile.length === 0) {
            await storageService.removeFile(file.storage_path);
          } else {
            console.log(`⚠️ [Documents] Skipping storage deletion for ${file.storage_path}, currently in use by an Official Template.`);
          }
        }
      }
    }

    if (fileVersions && fileVersions.length > 0) {
      console.log(`📁 [Documents] Removing ${fileVersions.length} version files from storage`);
      for (const version of fileVersions) {
        if (version.storage_path) {
          const { data: templatesUsingFile } = await supabase
            .from("document_templates")
            .select("id")
            .eq("structure->>master_file_url", version.storage_path)
            .limit(1);

          if (!templatesUsingFile || templatesUsingFile.length === 0) {
            await storageService.removeFile(version.storage_path);
          } else {
            console.log(`⚠️ [Documents] Skipping version storage deletion for ${version.storage_path}, currently in use by an Official Template.`);
          }
        }
      }
    }

    // Step 7: Finally delete the document itself
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

export async function generateDocx(req: AuthRequest, res: Response) {
  try {
    const documentId = req.params.id;
    const { field_values } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    console.log(`📝 [Documents] Generating DOCX for document: ${documentId}`);

    // 1. Fetch document and template info
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, title, file_url, metadata")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ success: false, error: "Document not found." });
    }

    const masterFileUrl = doc.metadata?.master_file_url || doc.file_url;
    if (!masterFileUrl) {
      return res.status(400).json({ success: false, error: "No master template file associated with this document." });
    }

    // 2. Save the field values to metadata
    const newMetadata = {
      ...(doc.metadata || {}),
      field_values: field_values || doc.metadata?.field_values || {}
    };

    // We defer the document update until AFTER we upload the new .docx to get its path.


    // 3. Get signed URL for the master template to download
    const signedUrl = await storageService.createSignedUrl(masterFileUrl, 60);

    // 4. Generate the new DOCX buffer
    const { docxGenerator } = await import("../utils/docxGenerator");
    const buffer = await docxGenerator.generateFromUrl(signedUrl, newMetadata.field_values);

    // 5. Upload the generated buffer to storage
    const fileName = `${doc.title || 'Generated_Document'}.docx`;
    const { path } = await storageService.uploadDocumentFile({
      documentId,
      buffer,
      fileName,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    // 6. Update document_files table (set previous primary to false)
    await supabase
      .from("document_files")
      .update({ is_primary: false })
      .eq("document_id", documentId);

    await supabase
      .from("document_files")
      .insert({
        document_id: documentId,
        storage_path: path,
        file_name: fileName,
        file_size: buffer.length,
        mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by: userId,
        is_primary: true
      });

    // 7. Update documents table with new file_url and metadata
    await supabase
      .from("documents")
      .update({ metadata: newMetadata, file_url: path })
      .eq("id", documentId);

    console.log(`✅ [Documents] Successfully generated and attached DOCX for document: ${documentId}`);

    return res.json({
      success: true,
      data: {
        message: "Document generated successfully",
        path
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error generating docx";
    console.error('❌ [Documents] Generate DOCX error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}

export const extractFields = async (req: Request, res: Response) => {
  try {
    const { id: documentId } = req.params;

    // 1. Fetch document metadata to get the file_url
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, file_url, title, metadata')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const masterFileUrl = document.metadata?.master_file_url || document.file_url;
    if (!masterFileUrl) {
      return res.status(400).json({ success: false, error: "Document has no file associated" });
    }

    // 2. We need a signed URL to download the file since the bucket is private
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(masterFileUrl, 60 * 5); // 5 mins

    if (signedUrlError || !signedUrlData) {
      return res.status(500).json({ success: false, error: "Failed to generate signed URL" });
    }

    // 3. Extract fields
    const fields = await docxGenerator.extractFieldsFromUrl(signedUrlData.signedUrl);

    return res.json({
      success: true,
      data: { fields }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error extracting fields";
    console.error('❌ [Documents] Extract Fields error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getSecurePdfUrl(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!req.user?.id) return res.status(401).json({ success: false, error: "Authentication required" });

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, metadata')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const storagePath = (document.metadata as any)?.secure_pdf_storage_path;
    if (!storagePath) {
      return res.status(404).json({ success: false, error: "Secure PDF not generated yet" });
    }

    // Generate fresh signed url
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(storagePath, 60 * 60); // 1 hour

    if (signedUrlError || !signedUrlData) {
      return res.status(500).json({ success: false, error: "Failed to generate signed URL" });
    }

    return res.json({
      success: true,
      url: signedUrlData.signedUrl
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error generating secure PDF URL";
    console.error('❌ [Documents] Get Secure PDF URL error:', message);
    return res.status(500).json({ success: false, error: message });
  }
}
