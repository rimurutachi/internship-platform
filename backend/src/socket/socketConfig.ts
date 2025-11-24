import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import { setupSocketHandlers } from "./socketHandler";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const initializeSocket = (httpServer: HTTPServer) => {
  // Initialize Supabase client inside the function to ensure env vars are loaded
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Middleware: Supabase JWT Authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;

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
    } catch (error) {
      console.error("[Socket.io Auth Error]:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Setup all socket event handlers
  setupSocketHandlers(io);

  return io;
};
