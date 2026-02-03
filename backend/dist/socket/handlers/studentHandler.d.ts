import { Server, Socket } from 'socket.io';
/**
 * Student-specific Socket.io event handlers
 */
export declare const setupStudentHandlers: (io: Server, socket: Socket) => void;
/**
 * Emit functions to be used by controllers/services
 */
/**
 * Notify student of new evaluation
 */
export declare const notifyStudentEvaluation: (io: Server, userId: string, evaluation: any) => void;
/**
 * Notify student of evaluation update
 */
export declare const notifyStudentEvaluationUpdate: (io: Server, userId: string, evaluation: any) => void;
/**
 * Notify student of document status change
 */
export declare const notifyStudentDocumentUpdate: (io: Server, userId: string, internshipId: string, document: any) => void;
/**
 * Notify student of new message
 */
export declare const notifyStudentMessage: (io: Server, conversationId: string, message: any, recipientIds: string[]) => void;
/**
 * Notify student of general notification
 */
export declare const notifyStudent: (io: Server, userId: string, notification: any) => void;
/**
 * Broadcast internship update to student
 */
export declare const notifyStudentInternshipUpdate: (io: Server, internshipId: string, userId: string, update: any) => void;
//# sourceMappingURL=studentHandler.d.ts.map