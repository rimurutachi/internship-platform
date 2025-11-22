"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
// Document Service - handles file storage, version control, and access management
const supabase_js_1 = require("@supabase/supabase-js");
const document_1 = require("../models/document");
const path_1 = __importDefault(require("path"));
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
class DocumentService {
    /**
     * Upload file to Supabase Storage
     */
    static async uploadToSupabase(file, folder = 'general') {
        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }
            if (file.size > this.MAX_FILE_SIZE) {
                throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
            }
            if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw new Error(`File type ${file.mimetype} is not allowed`);
            }
            // Generate unique filename
            const fileExt = path_1.default.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
            const filePath = `${folder}/${fileName}`;
            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                cacheControl: '3600',
                upsert: false
            });
            if (error) {
                throw new Error(`Storage upload failed: ${error.message}`);
            }
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(this.STORAGE_BUCKET)
                .getPublicUrl(filePath);
            return {
                file_path: data.path,
                file_url: urlData.publicUrl
            };
        }
        catch (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }
    }
    /**
     * Download file from Supabase Storage
     */
    static async downloadFromSupabase(filePath) {
        try {
            const { data, error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .download(filePath);
            if (error) {
                throw new Error(`Storage download failed: ${error.message}`);
            }
            if (!data) {
                throw new Error('File not found in storage');
            }
            // Get file metadata to determine content type
            const fileExt = path_1.default.extname(filePath).toLowerCase();
            const contentTypeMap = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.txt': 'text/plain',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            };
            return {
                data,
                contentType: contentTypeMap[fileExt] || 'application/octet-stream'
            };
        }
        catch (error) {
            throw new Error(`File download failed: ${error.message}`);
        }
    }
    /**
     * Delete file from Supabase Storage
     */
    static async deleteFromSupabase(filePath) {
        try {
            const { error } = await supabase.storage
                .from(this.STORAGE_BUCKET)
                .remove([filePath]);
            if (error) {
                throw new Error(`Storage deletion failed: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            console.error(`File deletion failed: ${error.message}`);
            // Don't throw error for deletion failures
            return false;
        }
    }
    /**
     * Get all documents with filters and pagination
     */
    static async getAllDocuments(filters = {}, pagination = {}, sort = {}) {
        try {
            return await document_1.DocumentModel.findAll(filters, pagination, sort);
        }
        catch (error) {
            throw new Error(`Failed to fetch documents: ${error.message}`);
        }
    }
    /**
     * Get document by ID with full details
     */
    static async getDocumentById(documentId, includeVersions = true) {
        try {
            const document = await document_1.DocumentModel.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }
            let versions = [];
            let accessList = [];
            if (includeVersions) {
                versions = await document_1.DocumentVersionModel.findByDocumentId(documentId);
                accessList = await document_1.DocumentAccessModel.findByDocumentId(documentId);
            }
            return {
                ...document,
                versions,
                access_list: accessList
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch document: ${error.message}`);
        }
    }
    /**
     * Create document with initial version
     */
    static async createDocumentWithVersion(documentData, file) {
        try {
            // Upload file to storage
            const { file_path } = await this.uploadToSupabase(file, documentData.category || 'general');
            // Create document record
            const document = await document_1.DocumentModel.create({
                name: documentData.name,
                file_name: file.originalname,
                file_path: file_path,
                file_size: file.size,
                mime_type: file.mimetype,
                access_level: documentData.access_level || 'restricted',
                uploaded_by: documentData.uploaded_by,
                category: documentData.category,
                description: documentData.description
            });
            // Create initial version
            const version = await document_1.DocumentVersionModel.create({
                document_id: document.id,
                version_number: 1,
                file_path: file_path,
                file_size: file.size,
                uploaded_by: documentData.uploaded_by,
                change_log: 'Initial version'
            });
            // Update document with current version
            await document_1.DocumentModel.update(document.id, {
                current_version_id: version.id
            });
            return {
                ...document,
                current_version: version
            };
        }
        catch (error) {
            throw new Error(`Failed to create document: ${error.message}`);
        }
    }
    /**
     * Create new version of existing document
     */
    static async createNewVersion(documentId, file, changeLog, userId) {
        try {
            // Get current document
            const document = await document_1.DocumentModel.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }
            // Get latest version number
            const latestVersionNumber = await document_1.DocumentVersionModel.getLatestVersionNumber(documentId);
            const newVersionNumber = latestVersionNumber + 1;
            // Upload new file
            const { file_path } = await this.uploadToSupabase(file, document.category || 'general');
            // Create version record
            const version = await document_1.DocumentVersionModel.create({
                document_id: documentId,
                version_number: newVersionNumber,
                file_path: file_path,
                file_size: file.size,
                uploaded_by: userId,
                change_log: changeLog || `Version ${newVersionNumber}`
            });
            // Update document with new version
            await document_1.DocumentModel.update(documentId, {
                current_version_id: version.id,
                file_path: file_path,
                file_size: file.size,
                file_name: file.originalname
            });
            return version;
        }
        catch (error) {
            throw new Error(`Failed to create version: ${error.message}`);
        }
    }
    /**
     * Get all versions of a document
     */
    static async getDocumentVersions(documentId) {
        try {
            return await document_1.DocumentVersionModel.findByDocumentId(documentId);
        }
        catch (error) {
            throw new Error(`Failed to fetch versions: ${error.message}`);
        }
    }
    /**
     * Download specific version
     */
    static async downloadVersion(versionId, userId) {
        try {
            const version = await document_1.DocumentVersionModel.findById(versionId);
            if (!version) {
                throw new Error('Version not found');
            }
            // Record view
            await document_1.DocumentViewModel.create(version.document_id, userId);
            await document_1.DocumentModel.incrementViewCount(version.document_id);
            // Download file
            return await this.downloadFromSupabase(version.file_path);
        }
        catch (error) {
            throw new Error(`Failed to download version: ${error.message}`);
        }
    }
    /**
     * Update document access level
     */
    static async updateAccessLevel(documentId, accessLevel) {
        try {
            const validLevels = ['public', 'restricted', 'private'];
            if (!validLevels.includes(accessLevel)) {
                throw new Error(`Invalid access level. Must be one of: ${validLevels.join(', ')}`);
            }
            return await document_1.DocumentModel.update(documentId, { access_level: accessLevel });
        }
        catch (error) {
            throw new Error(`Failed to update access level: ${error.message}`);
        }
    }
    /**
     * Get access control list for document
     */
    static async getAccessList(documentId) {
        try {
            return await document_1.DocumentAccessModel.findByDocumentId(documentId);
        }
        catch (error) {
            throw new Error(`Failed to fetch access list: ${error.message}`);
        }
    }
    /**
     * Grant access to user
     */
    static async grantAccess(data) {
        try {
            const validTypes = ['view', 'edit', 'admin'];
            if (!validTypes.includes(data.access_type)) {
                throw new Error(`Invalid access type. Must be one of: ${validTypes.join(', ')}`);
            }
            // Check if access already exists
            const existingAccess = await document_1.DocumentAccessModel.checkAccess(data.document_id, data.user_id);
            if (existingAccess) {
                // Update existing access type
                return await document_1.DocumentAccessModel.updateAccessType(data.document_id, data.user_id, data.access_type);
            }
            // Create new access
            const access = await document_1.DocumentAccessModel.create({
                document_id: data.document_id,
                user_id: data.user_id,
                access_type: data.access_type,
                shared_by: data.shared_by
            });
            // Update shared count
            await document_1.DocumentModel.updateSharedCount(data.document_id);
            return access;
        }
        catch (error) {
            throw new Error(`Failed to grant access: ${error.message}`);
        }
    }
    /**
     * Revoke access from user
     */
    static async revokeAccess(documentId, userId) {
        try {
            await document_1.DocumentAccessModel.delete(documentId, userId);
            await document_1.DocumentModel.updateSharedCount(documentId);
            return true;
        }
        catch (error) {
            throw new Error(`Failed to revoke access: ${error.message}`);
        }
    }
    /**
     * Batch update access control
     */
    static async updateBatchAccess(documentId, userAccessList, sharedBy) {
        try {
            // Delete all existing access
            await document_1.DocumentAccessModel.deleteAllForDocument(documentId);
            // Create new access records
            for (const access of userAccessList) {
                await document_1.DocumentAccessModel.create({
                    document_id: documentId,
                    user_id: access.user_id,
                    access_type: access.access_type,
                    shared_by: sharedBy
                });
            }
            // Update shared count
            await document_1.DocumentModel.updateSharedCount(documentId);
            return await this.getAccessList(documentId);
        }
        catch (error) {
            throw new Error(`Failed to update batch access: ${error.message}`);
        }
    }
    /**
     * Archive document
     */
    static async archiveDocument(documentId) {
        try {
            return await document_1.DocumentModel.archive(documentId, true);
        }
        catch (error) {
            throw new Error(`Failed to archive document: ${error.message}`);
        }
    }
    /**
     * Unarchive document
     */
    static async unarchiveDocument(documentId) {
        try {
            return await document_1.DocumentModel.archive(documentId, false);
        }
        catch (error) {
            throw new Error(`Failed to unarchive document: ${error.message}`);
        }
    }
    /**
     * Delete document (soft delete)
     */
    static async deleteDocument(documentId) {
        try {
            const document = await document_1.DocumentModel.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }
            // Soft delete document
            await document_1.DocumentModel.softDelete(documentId);
            // Optionally delete from storage (commented out for safety)
            // await this.deleteFromSupabase(document.file_path);
            return true;
        }
        catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }
    /**
     * Get document statistics
     */
    static async getDocumentStats() {
        try {
            return await document_1.DocumentModel.getStats();
        }
        catch (error) {
            throw new Error(`Failed to fetch statistics: ${error.message}`);
        }
    }
    /**
     * Check if user has access to document
     */
    static async checkUserAccess(documentId, userId, requiredAccessType) {
        try {
            const document = await document_1.DocumentModel.findById(documentId);
            if (!document) {
                return false;
            }
            // Public documents are accessible to all
            if (document.access_level === 'public') {
                return true;
            }
            // Document owner always has access
            if (document.uploaded_by === userId) {
                return true;
            }
            // Check explicit access control
            const access = await document_1.DocumentAccessModel.checkAccess(documentId, userId);
            if (!access) {
                return false;
            }
            // If specific access type required, check it
            if (requiredAccessType) {
                const accessHierarchy = {
                    view: 1,
                    edit: 2,
                    admin: 3
                };
                const userAccessLevel = accessHierarchy[access.access_type];
                const requiredAccessLevel = accessHierarchy[requiredAccessType];
                return userAccessLevel >= requiredAccessLevel;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.DocumentService = DocumentService;
DocumentService.ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif'
];
DocumentService.MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
DocumentService.STORAGE_BUCKET = 'documents';
//# sourceMappingURL=documentService.js.map