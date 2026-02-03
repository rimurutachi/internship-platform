export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    message_type: "text" | "file" | "system";
    file_url?: string;
    metadata?: any;
    is_edited: boolean;
    edited_at?: Date;
    is_deleted: boolean;
    deleted_at?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface Conversation {
    id: string;
    type: "direct" | "group" | "internship";
    name?: string;
    internship_id?: string;
    metadata?: any;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    last_message_at: Date;
}
export interface ConversationParticipant {
    id: string;
    conversation_id: string;
    user_id: string;
    role: "admin" | "member";
    last_read_at: Date;
    joined_at: Date;
    is_active: boolean;
}
export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    reference_id?: string;
    reference_type?: string;
    metadata?: any;
    is_read: boolean;
    read_at?: Date;
    created_at: Date;
}
export interface ActivityLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    description?: string;
    metadata?: any;
    internship_id?: string;
    created_at: Date;
}
export interface CreateMessageDTO {
    conversation_id: string;
    content: string;
    message_type?: "text" | "file" | "system";
    file_url?: string;
    metadata?: any;
}
export interface CreateConversationDTO {
    type: "direct" | "group" | "internship";
    name?: string;
    internship_id?: string;
    participant_ids: string[];
}
export interface CreateNotificationDTO {
    user_id: string;
    type: string;
    title: string;
    message: string;
    action_url?: string;
    reference_id?: string;
    reference_type?: string;
}
//# sourceMappingURL=communication.d.ts.map