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
import systemMetricsService from "./services/systemMetricsService";

// Initialize global system metrics tracker
global.systemMetrics = systemMetricsService;

const app = express();
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

// Rate Limiting (excluding admin settings routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  skip: (req) => {
    // Skip rate limiting for admin settings API calls
    return req.path.startsWith('/api/admin/settings');
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

// Auth APIs
app.use("/api", authRoutes);

// Communication APIs
app.use("/api/communication", communicationRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);

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
