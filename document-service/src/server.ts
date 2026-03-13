import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import documentRoutes from "./routes/documents";
import workflowRoutes from "./routes/workflows";
import templateRoutes from "./routes/templates";
import accessRoutes from "./routes/access";
import { env } from "./config/env";
import morgan from "morgan";
import { generalLimiter } from "./middleware/rateLimiter";

const app = express();
const server = http.createServer(app);

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
app.use("/api/access", accessRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/templates", templateRoutes);

// Start Servers
const PORT = env.PORT;
const WS_PORT = env.WEBSOCKET_PORT;

// Use single port for HTTP API
const SERVER_PORT = WS_PORT || PORT;

server.listen(SERVER_PORT, () => {
  console.log(`🟢 HTTP server running on port ${SERVER_PORT}`);
  console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/documents`);
  console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/access`);
  console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/workflows`);
  console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/templates`);
  console.log(`   - Health: http://localhost:${SERVER_PORT}/health`);
});

export { app, server };
