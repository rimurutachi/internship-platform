import { Server, Socket } from "socket.io";
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const setupEvaluationHandlers: (io: Server, socket: AuthenticatedSocket) => void;
export {};
//# sourceMappingURL=evaluationHandler.d.ts.map