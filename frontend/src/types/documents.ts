/* eslint-disable @typescript-eslint/no-explicit-any */
// Frontend document types matching backend schema

export type DocumentType = 
  | 'evaluation'
  | 'agreement'
  | 'report'
  | 'form'
  | 'certificate'
  | 'memorandum'
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'image'
  | 'zip'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'rejected';

export type WorkflowStatus = 
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  description?: string;
  content: any; // JSONB
  file_url?: string;
  version: string; // Semantic version (e.g., "1.0.0")
  owner_id: string;
  status: DocumentStatus;
  metadata?: any; // JSONB
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string; // Semantic version (e.g., "v1.0.0", "v2.0.0")
  storage_path?: string | null; // Supabase Storage path
  file_path?: string | null; // Alias for storage_path (backwards compatibility)
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_by?: string; // User ID who uploaded this version
  changed_by?: string; // Alias for uploaded_by (backwards compatibility)
  created_at: string;
  is_current?: boolean; // True if this is the active version
  is_archived?: boolean; // True for old versions
  replaced_by_version?: string | null; // Version string that replaced this one
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}



export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  replies?: DocumentComment[];
}

export interface DocumentWorkflow {
  id: string;
  document_id: string;
  workflow_type: string;
  status: WorkflowStatus;
  current_stage?: number;
  stages?: any; // JSONB
  created_at: string;
  updated_at: string;
  approvals?: DocumentApproval[];
}

export interface DocumentApproval {
  id: string;
  workflow_id?: string;
  document_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  template_content: any; // JSONB
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithDetails extends Document {
  versions?: DocumentVersion[];
  comments?: DocumentComment[];
  workflow?: DocumentWorkflow[];
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  owner_id?: string;
  search?: string;
}

export interface DocumentSortOptions {
  sort_by?: 'title' | 'created_at' | 'updated_at' | 'status' | 'type';
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
  by_owner: Array<{ owner_id: string; owner_name: string; count: number }>;
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



// API Response types
export interface DocumentsResponse {
  documents: DocumentWithDetails[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DocumentResponse {
  id: string;
  title: string;
  type: DocumentType;
  description?: string;
  content: any;
  file_url?: string;
  version: string;
  owner_id: string;
  status: DocumentStatus;
  metadata?: any;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  versions?: DocumentVersion[];
  comments?: DocumentComment[];
  workflow?: DocumentWorkflow[];
}

export interface StatsResponse {
  total_documents: number;
  by_status: Record<DocumentStatus, number>;
  by_type: Record<DocumentType, number>;
  by_owner: Array<{ owner_id: string; owner_name: string; count: number }>;
  recent_documents: DocumentWithDetails[];
}
