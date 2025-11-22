"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentViewModel = exports.DocumentAccessModel = exports.DocumentVersionModel = exports.DocumentModel = void 0;
// Document model for database operations
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
class DocumentModel {
    // Get all documents with filters and pagination
    static async findAll(filters = {}, pagination = {}, sort = {}) {
        let query = supabase
            .from('documents')
            .select(`
        *,
        uploader:users!documents_uploaded_by_fkey(id, email, name, role)
      `, { count: 'exact' })
            .is('deleted_at', null);
        // Apply filters
        if (filters.access_level) {
            query = query.eq('access_level', filters.access_level);
        }
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.is_archived !== undefined) {
            query = query.eq('is_archived', filters.is_archived);
        }
        if (filters.uploaded_by) {
            query = query.eq('uploaded_by', filters.uploaded_by);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,file_name.ilike.%${filters.search}%`);
        }
        // Apply sorting
        const sortBy = sort.sort_by || 'created_at';
        const sortOrder = sort.sort_order === 'asc' ? { ascending: true } : { ascending: false };
        query = query.order(sortBy, sortOrder);
        // Apply pagination
        const page = pagination.page || 1;
        const limit = pagination.limit || 25;
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            documents: data || [],
            total: count || 0,
            page,
            limit,
            total_pages: Math.ceil((count || 0) / limit)
        };
    }
    // Find document by ID
    static async findById(id) {
        const { data, error } = await supabase
            .from('documents')
            .select(`
        *,
        uploader:users!documents_uploaded_by_fkey(id, email, name, role)
      `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        if (error)
            throw error;
        return data;
    }
    // Create document
    static async create(documentData) {
        const { data, error } = await supabase
            .from('documents')
            .insert(documentData)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Update document
    static async update(id, updateData) {
        const { data, error } = await supabase
            .from('documents')
            .update({ ...updateData, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Soft delete document
    static async softDelete(id) {
        const { data, error } = await supabase
            .from('documents')
            .update({ deleted_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Hard delete document
    static async hardDelete(id) {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
    // Archive document
    static async archive(id, isArchived = true) {
        const { data, error } = await supabase
            .from('documents')
            .update({ is_archived: isArchived, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Increment view count
    static async incrementViewCount(id) {
        const { data, error } = await supabase.rpc('increment_document_views', {
            doc_id: id
        });
        if (error) {
            // Fallback to manual increment if RPC doesn't exist
            const doc = await this.findById(id);
            return await this.update(id, { total_views: (doc.total_views || 0) + 1 });
        }
        return data;
    }
    // Update shared count
    static async updateSharedCount(id) {
        const { count } = await supabase
            .from('document_access_control')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', id);
        await this.update(id, { shared_with_count: count || 0 });
    }
    // Get statistics
    static async getStats() {
        const { data: totalDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .is('deleted_at', null);
        const { data: publicDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('access_level', 'public')
            .is('deleted_at', null);
        const { data: restrictedDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('access_level', 'restricted')
            .is('deleted_at', null);
        const { data: privateDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('access_level', 'private')
            .is('deleted_at', null);
        const { data: archivedDocs } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('is_archived', true)
            .is('deleted_at', null);
        // Most viewed documents
        const { data: mostViewed } = await supabase
            .from('documents')
            .select(`
        *,
        uploader:users!documents_uploaded_by_fkey(id, email, name, role)
      `)
            .is('deleted_at', null)
            .order('total_views', { ascending: false })
            .limit(5);
        // Recently updated documents
        const { data: recentlyUpdated } = await supabase
            .from('documents')
            .select(`
        *,
        uploader:users!documents_uploaded_by_fkey(id, email, name, role)
      `)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .limit(5);
        return {
            total_documents: totalDocs?.length || 0,
            public_documents: publicDocs?.length || 0,
            restricted_documents: restrictedDocs?.length || 0,
            private_documents: privateDocs?.length || 0,
            archived_documents: archivedDocs?.length || 0,
            most_viewed: mostViewed || [],
            recently_updated: recentlyUpdated || []
        };
    }
}
exports.DocumentModel = DocumentModel;
class DocumentVersionModel {
    // Get all versions for a document
    static async findByDocumentId(documentId) {
        const { data, error } = await supabase
            .from('document_versions')
            .select(`
        *,
        uploader:users!document_versions_uploaded_by_fkey(id, email, name, role)
      `)
            .eq('document_id', documentId)
            .order('version_number', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    // Get specific version
    static async findById(id) {
        const { data, error } = await supabase
            .from('document_versions')
            .select(`
        *,
        uploader:users!document_versions_uploaded_by_fkey(id, email, name, role)
      `)
            .eq('id', id)
            .single();
        if (error)
            throw error;
        return data;
    }
    // Get latest version number for document
    static async getLatestVersionNumber(documentId) {
        const { data, error } = await supabase
            .from('document_versions')
            .select('version_number')
            .eq('document_id', documentId)
            .order('version_number', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error; // PGRST116 = no rows returned
        return data?.version_number || 0;
    }
    // Create version
    static async create(versionData) {
        const { data, error } = await supabase
            .from('document_versions')
            .insert(versionData)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Delete version
    static async delete(id) {
        const { error } = await supabase
            .from('document_versions')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return true;
    }
}
exports.DocumentVersionModel = DocumentVersionModel;
class DocumentAccessModel {
    // Get access list for document
    static async findByDocumentId(documentId) {
        const { data, error } = await supabase
            .from('document_access_control')
            .select(`
        *,
        user:users!document_access_control_user_id_fkey(id, email, name, role),
        shared_by_user:users!document_access_control_shared_by_fkey(id, email, name)
      `)
            .eq('document_id', documentId);
        if (error)
            throw error;
        return data || [];
    }
    // Check if user has access
    static async checkAccess(documentId, userId) {
        const { data, error } = await supabase
            .from('document_access_control')
            .select('*')
            .eq('document_id', documentId)
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
        return data;
    }
    // Grant access
    static async create(accessData) {
        const { data, error } = await supabase
            .from('document_access_control')
            .insert(accessData)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Update access type
    static async updateAccessType(documentId, userId, accessType) {
        const { data, error } = await supabase
            .from('document_access_control')
            .update({ access_type: accessType })
            .eq('document_id', documentId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Revoke access
    static async delete(documentId, userId) {
        const { error } = await supabase
            .from('document_access_control')
            .delete()
            .eq('document_id', documentId)
            .eq('user_id', userId);
        if (error)
            throw error;
        return true;
    }
    // Revoke all access for document
    static async deleteAllForDocument(documentId) {
        const { error } = await supabase
            .from('document_access_control')
            .delete()
            .eq('document_id', documentId);
        if (error)
            throw error;
        return true;
    }
}
exports.DocumentAccessModel = DocumentAccessModel;
class DocumentViewModel {
    // Create view record
    static async create(documentId, userId) {
        const { data, error } = await supabase
            .from('document_views')
            .insert({ document_id: documentId, viewed_by: userId })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Get views for document
    static async findByDocumentId(documentId, limit = 50) {
        const { data, error } = await supabase
            .from('document_views')
            .select(`
        *,
        viewer:users!document_views_viewed_by_fkey(id, email, name, role)
      `)
            .eq('document_id', documentId)
            .order('viewed_at', { ascending: false })
            .limit(limit);
        if (error)
            throw error;
        return data || [];
    }
    // Get unique viewers count
    static async getUniqueViewersCount(documentId) {
        const { data, error } = await supabase
            .from('document_views')
            .select('viewed_by')
            .eq('document_id', documentId);
        if (error)
            throw error;
        const uniqueViewers = new Set(data?.map(v => v.viewed_by));
        return uniqueViewers.size;
    }
}
exports.DocumentViewModel = DocumentViewModel;
//# sourceMappingURL=document.js.map