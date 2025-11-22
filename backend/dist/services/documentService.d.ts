import { DocumentFilters, DocumentSortOptions, PaginationOptions, CreateDocumentData, GrantAccessData, AccessLevel, AccessType } from '../types/documents';
export declare class DocumentService {
    private static readonly ALLOWED_MIME_TYPES;
    private static readonly MAX_FILE_SIZE;
    private static readonly STORAGE_BUCKET;
    /**
     * Upload file to Supabase Storage
     */
    static uploadToSupabase(file: any, folder?: string): Promise<{
        file_path: string;
        file_url: string;
    }>;
    /**
     * Download file from Supabase Storage
     */
    static downloadFromSupabase(filePath: string): Promise<{
        data: Blob;
        contentType: string;
    }>;
    /**
     * Delete file from Supabase Storage
     */
    static deleteFromSupabase(filePath: string): Promise<boolean>;
    /**
     * Get all documents with filters and pagination
     */
    static getAllDocuments(filters?: DocumentFilters, pagination?: PaginationOptions, sort?: DocumentSortOptions): Promise<{
        documents: any[];
        total: number;
        page: any;
        limit: any;
        total_pages: number;
    }>;
    /**
     * Get document by ID with full details
     */
    static getDocumentById(documentId: string, includeVersions?: boolean): Promise<any>;
    /**
     * Create document with initial version
     */
    static createDocumentWithVersion(documentData: CreateDocumentData, file: any): Promise<any>;
    /**
     * Create new version of existing document
     */
    static createNewVersion(documentId: string, file: any, changeLog: string, userId: string): Promise<any>;
    /**
     * Get all versions of a document
     */
    static getDocumentVersions(documentId: string): Promise<any[]>;
    /**
     * Download specific version
     */
    static downloadVersion(versionId: string, userId: string): Promise<{
        data: Blob;
        contentType: string;
    }>;
    /**
     * Update document access level
     */
    static updateAccessLevel(documentId: string, accessLevel: AccessLevel): Promise<any>;
    /**
     * Get access control list for document
     */
    static getAccessList(documentId: string): Promise<any[]>;
    /**
     * Grant access to user
     */
    static grantAccess(data: GrantAccessData): Promise<any>;
    /**
     * Revoke access from user
     */
    static revokeAccess(documentId: string, userId: string): Promise<boolean>;
    /**
     * Batch update access control
     */
    static updateBatchAccess(documentId: string, userAccessList: Array<{
        user_id: string;
        access_type: AccessType;
    }>, sharedBy: string): Promise<any[]>;
    /**
     * Archive document
     */
    static archiveDocument(documentId: string): Promise<any>;
    /**
     * Unarchive document
     */
    static unarchiveDocument(documentId: string): Promise<any>;
    /**
     * Delete document (soft delete)
     */
    static deleteDocument(documentId: string): Promise<boolean>;
    /**
     * Get document statistics
     */
    static getDocumentStats(): Promise<{
        total_documents: number;
        public_documents: number;
        restricted_documents: number;
        private_documents: number;
        archived_documents: number;
        most_viewed: any[];
        recently_updated: any[];
    }>;
    /**
     * Check if user has access to document
     */
    static checkUserAccess(documentId: string, userId: string, requiredAccessType?: AccessType): Promise<boolean>;
}
//# sourceMappingURL=documentService.d.ts.map