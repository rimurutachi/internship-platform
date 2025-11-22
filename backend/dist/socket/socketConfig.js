"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketHandler_1 = require("./socketHandler");
const initializeSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true,
        },
        pingTimeout: 60000,
    });
    // Middleware: JWT Authentication
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            next(new Error("Invalid authentication token"));
        }
    });
    // Setup all socket event handlers
    (0, socketHandler_1.setupSocketHandlers)(io);
    return io;
};
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socketConfig.js.map