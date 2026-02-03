export declare class DocumentModel {
    static findAll(filters?: any, pagination?: any, sort?: any): Promise<{
        documents: any[];
        total: number;
        page: any;
        limit: any;
        total_pages: number;
    }>;
    static findById(id: string): Promise<any>;
    static create(documentData: any): Promise<any>;
    static update(id: string, updateData: any): Promise<any>;
    static softDelete(id: string): Promise<any>;
    static hardDelete(id: string): Promise<boolean>;
    static archive(id: string, isArchived?: boolean): Promise<any>;
    static incrementViewCount(id: string): Promise<any>;
    static updateSharedCount(id: string): Promise<void>;
    static getStats(): Promise<{
        total_documents: number;
        public_documents: number;
        restricted_documents: number;
        private_documents: number;
        archived_documents: number;
        most_viewed: any[];
        recently_updated: any[];
    }>;
}
export declare class DocumentVersionModel {
    static findByDocumentId(documentId: string): Promise<any[]>;
    static findById(id: string): Promise<any>;
    static getLatestVersionNumber(documentId: string): Promise<any>;
    static create(versionData: any): Promise<any>;
    static delete(id: string): Promise<boolean>;
}
export declare class DocumentAccessModel {
    static findByDocumentId(documentId: string): Promise<any[]>;
    static checkAccess(documentId: string, userId: string): Promise<any>;
    static create(accessData: any): Promise<any>;
    static updateAccessType(documentId: string, userId: string, accessType: string): Promise<any>;
    static delete(documentId: string, userId: string): Promise<boolean>;
    static deleteAllForDocument(documentId: string): Promise<boolean>;
}
export declare class DocumentViewModel {
    static create(documentId: string, userId: string): Promise<any>;
    static findByDocumentId(documentId: string, limit?: number): Promise<any[]>;
    static getUniqueViewersCount(documentId: string): Promise<number>;
}
//# sourceMappingURL=document.d.ts.map