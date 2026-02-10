import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import { Server as SocketServer } from "socket.io";
import { setupWebSocket } from "./websocket";
import documentRoutes from "./routes/documents";
import blockchainRoutes from "./routes/blockchain";
import signatureRoutes from "./routes/signatures";
import accessRoutes from "./routes/access";
import workflowRoutes from "./routes/workflows";
import templateRoutes from "./routes/templates";
import collaborationRoutes from "./routes/collaboration";
import { env } from "./config/env";
import morgan from "morgan";
import { generalLimiter } from "./middleware/rateLimiter";

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Enable compatibility with older clients
  pingTimeout: 60000,
  pingInterval: 25000,
});

// =============================================================================
// SECURITY: Security Headers (helmet) - OWASP Best Practice
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for document rendering
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.FRONTEND_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding documents
}));

// Middleware
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(generalLimiter); // Apply general rate limiter to all routes

// Error handling middleware (Morgan)
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error", err);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
);

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "document-service" });
});

app.use("/api/documents", documentRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/collaboration", collaborationRoutes);

// Websocket Setup
setupWebSocket(io);

// Start Server (unified port for HTTP + WebSocket)
const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`🟢 Socket.io + HTTP server running on port ${PORT}`);
  console.log(`   - WebSocket: ws://localhost:${PORT}`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/documents`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/blockchain`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/signatures`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/access`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/workflows`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/templates`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/collaboration`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
});

export { app, io, server };
