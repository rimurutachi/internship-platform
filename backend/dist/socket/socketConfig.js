"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const supabase_js_1 = require("@supabase/supabase-js");
const socketHandler_1 = require("./socketHandler");
const initializeSocket = (httpServer) => {
    // Initialize Supabase client inside the function to ensure env vars are loaded
    const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true,
        },
        pingTimeout: 60000,
    });
    // Middleware: Supabase JWT Authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error("Authentication token required"));
            }
            // Verify Supabase JWT token
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) {
                return next(new Error("Invalid authentication token"));
            }
            // Get user role from database
            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();
            socket.user = {
                id: user.id,
                email: user.email || "",
                role: userData?.role || "student",
            };
            // Join user's personal room for notifications
            socket.join(`user:${user.id}`);
            next();
        }
        catch (error) {
            console.error("[Socket.io Auth Error]:", error);
            next(new Error("Authentication failed"));
        }
    });
    // Setup all socket event handlers
    (0, socketHandler_1.setupSocketHandlers)(io);
    return io;
};
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socketConfig.js.map