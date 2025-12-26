import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { createServer } from "http";
import { initializeSocket } from "./socket/socketConfig";
import { requestTracker } from "./middleware/requestTracker";

// Load environment variables FIRST before importing any modules that need them
dotenv.config();

// For Routes on top of dotenv
import internshipRoutes from "./routes/internships";
import evaluationRoutes from "./routes/evaluations";
import authRoutes from "./routes/authRoutes";
import communicationRoutes from "./routes/communications";
import adminRoutes from "./routes/admin";
import studentRoutes from "./routes/student";
import advisorRoutes from "./routes/advisor";
import supervisorRoutes from "./routes/supervisor";
import systemMetricsService from "./services/systemMetricsService";

// Initialize global system metrics tracker
global.systemMetrics = systemMetricsService;

const app = express();

// Disable ETag to prevent 304 responses for dynamic APIs
app.set("etag", false);

// Global no-store for API responses to avoid client caching
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.set("Cache-Control", "no-store");
  }
  next();
});
const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
export const io = initializeSocket(httpServer);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const rateLimitWindow = 15 * 60 * 1000; // 15 minutes
const limiter = rateLimit({
  windowMs: rateLimitWindow,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
  skip: (req) => {
    // Skip rate limiting for:
    // - Admin routes (settings, reports, system)
    // - Authentication routes
    // - Communication routes (messages, notifications)
    return (
      req.path.startsWith('/api/admin/settings') ||
      req.path.startsWith('/api/admin/reports') ||
      req.path.startsWith('/api/admin/system') ||
      req.path.startsWith('/api/auth') ||
      req.path.startsWith('/api/communications')
    );
  },
  // Return JSON response instead of HTML for rate limit errors
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(rateLimitWindow / 1000)
    });
  }
});
app.use(limiter);

// Request Tracking Middleware (after rate limiting, before routes)
app.use(requestTracker);

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Intern-Galing API is running smoothly." });
});

// Internship APIs
app.use("/api/internships", internshipRoutes);

// Evaluation APIs
app.use("/api/evaluations", evaluationRoutes);

// Communication APIs - Register BEFORE auth to prevent route conflict
app.use("/api/communications", communicationRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);

// Student APIs
app.use("/api/student", studentRoutes);

// Advisor APIs
app.use("/api/advisor", advisorRoutes);

// Supervisor APIs
app.use("/api/supervisor", supervisorRoutes);

// Supervisor APIs
app.use("/api/supervisor", supervisorRoutes);

// Auth APIs - Register LAST since it uses /api prefix (catch-all)
app.use("/api", authRoutes);

// Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong." });
});

// Start Server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Socket.io initialized and ready.");
  });
}

export default app;
