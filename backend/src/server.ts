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
import hoursRoutes from "./routes/hours";
import aiRoutes from "./routes/ai";
import messagesRoutes from "./routes/messages";
import { startArchiveJob } from "./jobs/archiveJob";
import { startAIServiceKeepAlive } from "./jobs/aiServiceKeepAlive";

const app = express();

// =============================================================================
// FIX #1: Trust Proxy (Render/Production Deployment)
// =============================================================================
// Trust first proxy (Render) for proper rate limiting and IP detection
app.set('trust proxy', 1);

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

// =============================================================================
// FIX #2: Enhanced CORS Configuration
// =============================================================================
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(url => url.trim()) || ['http://localhost:3000'];
console.log('🌐 CORS Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) {
        console.log('✅ CORS: Request with no origin (curl/Postman/server)');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS: Allowed origin:', origin);
        callback(null, true);
      } else {
        console.warn('🚫 CORS: Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
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
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '2000'), // Default to 2000 for SPA apps
  authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '50'), // Increased auth limit default
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

// =============================================================================
// FIX #3: Enhanced Health Check Route
// =============================================================================
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "internship-platform-backend",
    message: "Intern-Galing API is running smoothly.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Routes

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

// AI Service APIs
app.use("/api/ai", aiRoutes);

// Hours Tracking APIs
app.use("/api/hours", hoursRoutes);

// Messages APIs
app.use("/api/messages", messagesRoutes);

// Auth APIs - Register LAST since it uses /api prefix (catch-all)
app.use("/api", authRoutes);

// =============================================================================
// FIX #4: Improved 404 Handler (catch-all for undefined routes)
// =============================================================================
app.use((req, res, next) => {
  console.warn('⚠️ 404 Not Found:', req.method, req.originalUrl, '| IP:', req.ip);
  res.status(404).json({ 
    success: false,
    error: 'Not Found', 
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/internships',
      'GET /api/evaluations',
      'GET /api/communications',
      'GET /api/admin/*',
      'GET /api/student/*',
      'GET /api/advisor/*',
      'GET /api/supervisor/*'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('🔴 Server Error:', err.message);
  console.error(err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS Error',
      message: 'Origin not allowed. Please check CORS configuration.',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start Server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Socket.io initialized and ready.");
    
    // Start archive job (runs every hour)
    startArchiveJob();
    console.log("✅ Archive job scheduler started");
    
    // Start AI service keep-alive (runs every 10 minutes to prevent Render shutdown)
    startAIServiceKeepAlive();
  });
}

export default app;
