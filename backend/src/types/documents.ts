// Document management types - Backend gateway to document-service

export type DocumentType = 'evaluation' | 'agreement' | 'report' | 'form' | 'certificate' | 'memorandum' | 'other';
export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived' | 'rejected';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

// Document-service enhanced types
export type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';
export type DocumentField = {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email' | 'phone';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: any;
  validation_pattern?: string;
  help_text?: string;
};

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content: any; // JSONB
  file_url?: string;
  file_type?: string;
  file_size?: number;
  version: string; // Semantic version like "1.0.0"
  parent_version_id?: string;
  is_template: boolean;
  template_id?: string;
  owner_id: string;
  internship_id?: string;
  status: DocumentStatus;
  metadata?: any; // JSONB
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: string; // Semantic version
  content: any; // JSONB
  changes_summary: string;
  changed_by: string;
  change_type: string;
  diff_data: any; // JSONB
  created_at: Date;
}

export interface CollaborationSession {
  id: string;
  document_id: string;
  user_id: string;
  cursor_position: number;
  selection_range: any; // JSONB
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
  position_data: any; // JSONB
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentWorkflow {
  id: string;
  document_id: string;
  workflow_definition: any; // JSONB
  current_stage: string;
  status: WorkflowStatus;
  started_at: Date;
  completed_at?: Date;
  metadata?: any; // JSONB
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
  structure: any; // JSONB
  default_content: any; // JSONB
  version: string;
  is_active: boolean;
  university_id: string;
  created_by: string;
  update_policy: string;
  created_at: Date;
  updated_at: Date;
}

// Document-service access control types
export interface AccessControl {
  id: string;
  document_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  access_conditions?: any;
}

// Document-service audit log types
export interface AuditLog {
  id: string;
  document_id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  timestamp: string;
}

// Document-service workflow types (enhanced)
export interface WorkflowDefinition {
  stages: {
    name: string;
    required_approvers: Array<{
      approver_role?: string;
      approver_user_id?: string;
      condition_type?: 'all' | 'any';
      metadata?: any;
    }>;
    auto_progress_condition?: string;
    timeout_days?: number;
  }[];
  metadata?: any;
}

export interface EnhancedDocumentWorkflow extends DocumentWorkflow {
  workflow_definition: WorkflowDefinition;
  approvals?: DocumentApproval[];
  current_stage_index?: number;
}

// Document-service templates types
export interface DocumentTemplateWithFields extends DocumentTemplate {
  fields: DocumentField[];
  is_public: boolean;
  requires_approval: boolean;
  tags?: string[];
  created_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
  };
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
