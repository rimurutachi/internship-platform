import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import documentServiceProxy from '../../services/documentServiceProxy';
import {
  Document,
  DocumentVersion,
  DocumentComment,
  DocumentWorkflow,
  CollaborationSession,
  DocumentWithDetails,
  DocumentFilters,
  DocumentSortOptions,
  PaginationOptions,
  PaginatedDocuments,
  DocumentStats,
  UpdateStatusData,
  UpdateWorkflowData,
  DocumentStatus
} from '../../types/documents';

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Get all documents with filters, sorting, and pagination (bypasses RLS)
 */
export const getAllDocuments = async (req: Request, res: Response) => {
  try {
    const {
      type,
      status,
      owner_id,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        owner:users!documents_owner_id_fkey(id, first_name, last_name, email),
        versions:document_file_versions(count),
        comments:document_comments(count)
      `, { count: 'exact' });

    // Apply filters
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (owner_id) query = query.eq('owner_id', owner_id);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const paginatedResult: PaginatedDocuments = {
      documents: data as DocumentWithDetails[],
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
      total_pages: Math.ceil((count || 0) / Number(limit))
    };

    res.json(paginatedResult);
  } catch (error: any) {
    console.error('Get all documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
};

/**
 * Get single document with full details (versions, comments, workflow, collaborators)
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        owner:users!documents_owner_id_fkey(id, first_name, last_name, email),
        versions:document_file_versions(*, uploaded_by:users(id, first_name, last_name, email)),
        comments:document_comments(*, user:users!document_comments_user_id_fkey(id, first_name, last_name, email), resolved_by_user:users!document_comments_resolved_by_fkey(id, first_name, last_name, email), replies:document_comments(*, user:users!document_comments_user_id_fkey(id, first_name, last_name, email))),
        workflow:document_workflows(*, approvals:document_approvals(*, approver:users(id, first_name, last_name, email)))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Sort versions by semantic version
    if (document.versions) {
      document.versions.sort((a: DocumentVersion, b: DocumentVersion) => {
        return compareSemanticVersions(b.version, a.version);
      });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
};

/**
 * Get document version history with semantic version sorting
 */
export const getVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: versions, error } = await supabaseAdmin
      .from('document_file_versions')
      .select(`
        *,
        uploaded_by:users(id, first_name, last_name, email)
      `)
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Sort by semantic version
    const sortedVersions = versions.sort((a: DocumentVersion, b: DocumentVersion) => {
      return compareSemanticVersions(b.version, a.version);
    });

    res.json(sortedVersions);
  } catch (error: any) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Failed to fetch versions', details: error.message });
  }
};

/**
 * Get document comments with threading
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First, get all comments for the document
    const { data: allComments, error: commentsError } = await supabaseAdmin
      .from('document_comments')
      .select(`
        *,
        user:users!document_comments_user_id_fkey(id, first_name, last_name, email),
        resolved_by_user:users!document_comments_resolved_by_fkey(id, first_name, last_name, email)
      `)
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;

    // Organize comments into parent-child structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    allComments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree structure
    allComments?.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    const comments = rootComments;
    const error = null;

    if (error) throw error;

    res.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
};

/**
 * Get document workflow and approvals
 */
export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: workflow, error } = await supabaseAdmin
      .from('document_workflows')
      .select(`
        *,
        approvals:document_approvals(
          *,
          approver:users(id, first_name, last_name, email)
        )
      `)
      .eq('document_id', id)
      .order('started_at', { ascending: false });

    if (error) throw error;

    res.json(workflow);
  } catch (error: any) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Failed to fetch workflow', details: error.message });
  }
};

/**
 * Update document status with validation
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as UpdateStatusData;

    // Get current document
    const { data: currentDoc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!currentDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Validate status transition
    const isValidTransition = validateStatusTransition(currentDoc.status, status);
    if (!isValidTransition) {
      return res.status(400).json({
        error: 'Invalid status transition',
        current: currentDoc.status,
        requested: status
      });
    }

    // Update status
    const { data: updatedDoc, error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json(updatedDoc);
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
};

/**
 * Update workflow (approve/reject/advance)
 */
export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body as UpdateWorkflowData;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current workflow
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('document_workflows')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (workflowError && workflowError.code !== 'PGRST116') throw workflowError;

    if (action === 'approve' || action === 'reject') {
      // Create approval record
      const { data: approval, error: approvalError } = await supabaseAdmin
        .from('document_approvals')
        .insert({
          workflow_id: workflow?.id,
          document_id: id,
          approver_id: userId,
          status: action === 'approve' ? 'approved' : 'rejected',
          comments,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (approvalError) throw approvalError;

      // Update workflow status if needed
      if (workflow) {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const { error: updateWorkflowError } = await supabaseAdmin
          .from('document_workflows')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', workflow.id);

        if (updateWorkflowError) throw updateWorkflowError;
      }

      res.json(approval);
    } else if (action === 'advance') {
      // Advance to next stage
      if (!workflow) {
        return res.status(404).json({ error: 'No active workflow found' });
      }

      const currentStage = workflow.current_stage || 0;
      const { error: updateError } = await supabaseAdmin
        .from('document_workflows')
        .update({
          current_stage: currentStage + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflow.id);

      if (updateError) throw updateError;

      res.json({ message: 'Workflow advanced', stage: currentStage + 1 });
    }
  } catch (error: any) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Failed to update workflow', details: error.message });
  }
};

/**
 * Archive a document
 */
export const archiveDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Archive document error:', error);
    res.status(500).json({ error: 'Failed to archive document', details: error.message });
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete document (cascades to versions, comments, workflows, etc.)
    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
};

/**
 * Get document statistics
 */
export const getDocumentStats = async (req: Request, res: Response) => {
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get counts by status
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('documents')
      .select('status');

    if (statusError) throw statusError;

    const byStatus = (statusData || []).reduce((acc: Record<string, number>, doc: any) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get counts by type
    const { data: typeData, error: typeError } = await supabaseAdmin
      .from('documents')
      .select('type');

    if (typeError) throw typeError;

    const byType = (typeData || []).reduce((acc: Record<string, number>, doc: any) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get counts by owner
    const { data: ownerData, error: ownerError } = await supabaseAdmin
      .from('documents')
      .select(`
        owner_id,
        owner:users!documents_owner_id_fkey(id, first_name, last_name, email)
      `);

    if (ownerError) throw ownerError;

    const ownerCounts = (ownerData || []).reduce((acc: Record<string, any>, doc: any) => {
      const ownerId = doc.owner_id;
      if (!acc[ownerId]) {
        acc[ownerId] = {
          owner_id: ownerId,
          owner_name: `${doc.owner?.first_name || ''} ${doc.owner?.last_name || ''}`.trim(),
          count: 0
        };
      }
      acc[ownerId].count++;
      return acc;
    }, {});

    const byOwner = Object.values(ownerCounts);

    // Get recent documents
    const { data: recentDocs, error: recentError } = await supabaseAdmin
      .from('documents')
      .select(`
        *,
        owner:users!documents_owner_id_fkey(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const stats: DocumentStats = {
      total_documents: totalCount || 0,
      by_status: byStatus,
      by_type: byType,
      by_owner: byOwner as any,
      recent_documents: recentDocs as DocumentWithDetails[]
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
};

// Helper functions

/**
 * Compare semantic versions (e.g., "1.2.3" vs "1.10.0")
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
function compareSemanticVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  return 0;
}

/**
 * Validate document status transitions
 */
function validateStatusTransition(currentStatus: DocumentStatus, newStatus: DocumentStatus): boolean {
  const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    draft: ['in_review', 'archived'],
    in_review: ['approved', 'rejected', 'draft', 'archived'],
    approved: ['published', 'archived'],
    published: ['archived'],
    archived: ['draft'], // Allow unarchiving
    rejected: ['draft', 'archived']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}
