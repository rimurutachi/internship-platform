// CRITICAL: Load environment variables FIRST before ANY other imports
import dotenv from "dotenv";
dotenv.config();

// Now import everything else
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { initializeSocket } from "./socket/socketConfig";

// For Routes on top of dotenv
import internshipRoutes from "./routes/internships";
import evaluationRoutes from "./routes/evaluations";
import authRoutes from "./routes/authRoutes";
import communicationRoutes from "./routes/communications";
import adminRoutes from "./routes/admin";
import studentRoutes from "./routes/student";
import advisorRoutes from "./routes/advisor";
import supervisorRoutes from "./routes/supervisor";
import publicRoutes from "./routes/public";

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

// =============================================================================
// SECURITY: Security Headers (helmet) - OWASP Best Practice
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI components
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000", "wss:", "ws:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// =============================================================================
// SECURITY: Rate Limiting Configuration (OWASP Best Practice)
// =============================================================================

/**
 * Rate limit configuration via environment variables for production flexibility
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 15 minutes)
 * - RATE_LIMIT_MAX_REQUESTS: Max requests per window (default: 100 prod, 1000 dev)
 * - RATE_LIMIT_AUTH_MAX: Max auth attempts per window (default: 5 - stricter)
 * - RATE_LIMIT_ENABLED: Feature flag to disable rate limiting (default: true)
 */
const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'production' ? '100' : '1000')),
  authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'), // Stricter for auth routes
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false', // Feature flag for emergencies
};

// Log rate limit configuration on startup
console.log('🔒 Rate Limiting Config:', {
  enabled: rateLimitConfig.enabled,
  windowMs: rateLimitConfig.windowMs,
  maxRequests: rateLimitConfig.maxRequests,
  authMaxRequests: rateLimitConfig.authMaxRequests,
  environment: process.env.NODE_ENV
});

// General rate limiter for all API routes
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  skip: (req) => {
    // Skip if rate limiting is disabled via feature flag
    if (!rateLimitConfig.enabled) return true;
    
    // SECURITY: Only skip internal health checks
    // Auth routes now have their OWN stricter limiter (not skipped here)
    return req.path === '/health';
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // SECURITY: Return JSON response instead of HTML for rate limit errors
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil(rateLimitConfig.windowMs / 1000);
    console.warn(`⚠️ RATE LIMIT: IP ${req.ip} exceeded limit on ${req.method} ${req.path}`);
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: retryAfterSeconds,
      message: `Rate limit exceeded. Please wait ${Math.ceil(retryAfterSeconds / 60)} minutes before retrying.`
    });
  }
});

// SECURITY: Stricter rate limiter for authentication routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.authMaxRequests, // Only 5 attempts per 15 minutes (configurable)
  skip: () => !rateLimitConfig.enabled, // Skip if feature flag disabled
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil(rateLimitConfig.windowMs / 1000);
    console.warn(`🔴 AUTH RATE LIMIT: IP ${req.ip} exceeded auth limit on ${req.method} ${req.path} - possible brute force attempt`);
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts.',
      retryAfter: retryAfterSeconds,
      message: `Too many login attempts. Please wait ${Math.ceil(retryAfterSeconds / 60)} minutes before trying again.`
    });
  }
});

// Apply general rate limiter to all routes
app.use(generalLimiter);

// SECURITY: Apply stricter rate limiter ONLY to sensitive auth endpoints
// Do NOT apply to logout, profile, or other authenticated routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

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

// Public APIs - No authentication required (e.g., QR code verification)
app.use("/api/public", publicRoutes);

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
