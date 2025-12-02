import { CreateMessageDTO, Message } from "../models/communication";
export declare class MessageService {
    uploadFile(file: Express.Multer.File, conversationId: string): Promise<{
        url: string;
        metadata: any;
    }>;
    sendMessage(senderId: string, data: CreateMessageDTO, file?: Express.Multer.File): Promise<Message>;
    getMessages(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
    editMessage(messageId: string, userId: string, content: string): Promise<Message>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
}
declare const _default: MessageService;
export default _default;
//# sourceMappingURL=messageService.d.ts.map