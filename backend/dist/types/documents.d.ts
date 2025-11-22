export type DocumentType = 'evaluation' | 'agreement' | 'report' | 'form' | 'certificate' | 'memorandum' | 'other';
export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived' | 'rejected';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';
export interface Document {
    id: string;
    title: string;
    type: DocumentType;
    content: any;
    file_url?: string;
    file_type?: string;
    file_size?: number;
    version: string;
    parent_version_id?: string;
    is_template: boolean;
    template_id?: string;
    owner_id: string;
    internship_id?: string;
    status: DocumentStatus;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
    published_at?: Date | null;
}
export interface DocumentVersion {
    id: string;
    document_id: string;
    version: string;
    content: any;
    changes_summary: string;
    changed_by: string;
    change_type: string;
    diff_data: any;
    created_at: Date;
}
export interface CollaborationSession {
    id: string;
    document_id: string;
    user_id: string;
    cursor_position: number;
    selection_range: any;
    is_active: boolean;
    last_seen: Date;
    user_color: string;
}
export interface DocumentComment {
    id: string;
    document_id: string;
    user_id: string;
    parent_comment_id?: string;
    content: string;
    position_data: any;
    is_resolved: boolean;
    resolved_by?: string;
    resolved_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface DocumentWorkflow {
    id: string;
    document_id: string;
    workflow_definition: any;
    current_stage: string;
    status: WorkflowStatus;
    started_at: Date;
    completed_at?: Date;
    metadata?: any;
}
export interface DocumentApproval {
    id: string;
    workflow_id: string;
    stage_name: string;
    approver_id: string;
    status: ApprovalStatus;
    comments?: string;
    approved_at?: Date;
    created_at: Date;
}
export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    structure: any;
    default_content: any;
    version: string;
    is_active: boolean;
    university_id: string;
    created_by: string;
    update_policy: string;
    created_at: Date;
    updated_at: Date;
}
export interface DocumentWithDetails extends Document {
    versions?: DocumentVersion[];
    comments?: DocumentComment[];
    workflow?: DocumentWorkflow;
    approvals?: DocumentApproval[];
    collaborators?: CollaborationSession[];
    owner?: {
        id: string;
        name: string;
        email: string;
    };
}
export interface DocumentFilters {
    type?: DocumentType;
    status?: DocumentStatus;
    owner_id?: string;
    search?: string;
    internship_id?: string;
    is_template?: boolean;
}
export interface DocumentSortOptions {
    sort_by?: 'title' | 'created_at' | 'updated_at' | 'version' | 'status';
    sort_order?: 'asc' | 'desc';
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
}
export interface PaginatedDocuments {
    documents: DocumentWithDetails[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}
export interface DocumentStats {
    total_documents: number;
    by_status: Record<DocumentStatus, number>;
    by_type: Record<DocumentType, number>;
    by_owner: Array<{
        owner_id: string;
        owner_name: string;
        count: number;
    }>;
    recent_documents: DocumentWithDetails[];
    avg_lifecycle_time?: number;
}
export interface UpdateStatusData {
    status: DocumentStatus;
}
export interface UpdateWorkflowData {
    action: 'approve' | 'reject' | 'advance';
    comments?: string;
}
export interface CollaborationInfo {
    active_users: Array<{
        user_id: string;
        name: string;
        email: string;
        user_color: string;
        cursor_position: number;
        last_seen: Date;
    }>;
    sessions: CollaborationSession[];
}
//# sourceMappingURL=documents.d.ts.map