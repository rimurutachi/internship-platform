import { Message, Notification } from "../models/communication";
export declare const emitNewMessage: (conversationId: string, message: Message) => void;
export declare const emitMessageEdited: (conversationId: string, message: Message) => void;
export declare const emitMessageDeleted: (conversationId: string, messageId: string) => void;
export declare const emitNewNotification: (userId: string, notification: Notification) => void;
export declare const emitNotificationCountUpdate: (userId: string, count: number) => void;
export declare const emitEvaluationUpdate: (evaluationId: string, data: any) => void;
export declare const emitConversationUpdate: (userId: string, conversationId: string, data: any) => void;
//# sourceMappingURL=emitters.d.ts.map