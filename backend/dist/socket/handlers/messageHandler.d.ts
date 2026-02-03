import { Server, Socket } from "socket.io";
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare const setupMessageHandlers: (io: Server, socket: AuthenticatedSocket) => void;
export {};
//# sourceMappingURL=messageHandler.d.ts.map