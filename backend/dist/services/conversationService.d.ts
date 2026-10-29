declare const conversationService: {
    /**
     * Create a new conversation
     */
    createConversation(userId: string, body: {
        type: string;
        name?: string;
        participant_ids: string[];
    }): Promise<any>;
    /**
     * Get all conversations for a user
     */
    getUserConversations(userId: string): Promise<any[]>;
    /**
     * Get a single conversation by ID
     */
    getConversation(conversationId: string): Promise<any>;
    /**
     * Mark conversation as read for a user
     */
    markAsRead(conversationId: string, userId: string): Promise<void>;
    /**
     * Get unread message count for a user
     */
    getUnreadCount(userId: string): Promise<any>;
};
export default conversationService;
//# sourceMappingURL=conversationService.d.ts.map