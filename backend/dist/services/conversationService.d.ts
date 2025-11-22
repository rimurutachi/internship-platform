import { CreateConversationDTO, Conversation } from "../models/communication";
export declare class ConversationService {
    createConversation(creatorId: string, data: CreateConversationDTO): Promise<Conversation>;
    getUserConversations(userId: string): Promise<any[]>;
    getConversation(conversationId: string): Promise<any>;
    markAsRead(conversationId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
}
declare const _default: ConversationService;
export default _default;
//# sourceMappingURL=conversationService.d.ts.map