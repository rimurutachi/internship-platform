export declare const messageService: {
    getContacts(userId: string, role: string): Promise<any[]>;
    getMessages(user1Id: string, user2Id: string): Promise<any[]>;
    sendMessage(senderId: string, receiverId: string, content: string): Promise<any>;
    markAsRead(messageIds: string[]): Promise<void>;
};
//# sourceMappingURL=messageService.d.ts.map