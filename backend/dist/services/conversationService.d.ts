import { CreateConversationDTO, Conversation } from "../models/communication";
export declare class ConversationService {
    createConversation(creatorId: string, data: CreateConversationDTO): Promise<Conversation>;
    getUserConversations(userId: string): Promise<any[]>;
    getConversation(conversationId: string): Promise<any>;
    markAsRead(conversationId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    searchUsers(currentUserId: string, searchQuery?: string, roleFilter?: string): Promise<any[]>;
    createDirectConversation(userId1: string, userId2: string): Promise<any>;
}
declare const _default: ConversationService;
export default _default;
//# sourceMappingURL=conversationService.d.ts.map