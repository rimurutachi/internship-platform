"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// CRITICAL: Load environment variables FIRST before ANY other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Now import everything else
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socketConfig_1 = require("./socket/socketConfig");
// For Routes on top of dotenv
const internships_1 = __importDefault(require("./routes/internships"));
const evaluations_1 = __importDefault(require("./routes/evaluations"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const communications_1 = __importDefault(require("./routes/communications"));
const admin_1 = __importDefault(require("./routes/admin"));
const student_1 = __importDefault(require("./routes/student"));
const advisor_1 = __importDefault(require("./routes/advisor"));
const supervisor_1 = __importDefault(require("./routes/supervisor"));
const public_1 = __importDefault(require("./routes/public"));
const app = (0, express_1.default)();
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
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.io
exports.io = (0, socketConfig_1.initializeSocket)(httpServer);
// Middleware
// =============================================================================
// SECURITY: Security Headers (helmet) - OWASP Best Practice
// =============================================================================
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
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
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.maxRequests,
    skip: (req) => {
        // Skip if rate limiting is disabled via feature flag
        if (!rateLimitConfig.enabled)
            return true;
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
const authLimiter = (0, express_rate_limit_1.default)({
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
// SECURITY: Apply stricter rate limiter SPECIFICALLY to auth endpoints
app.use('/api/auth', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/forgot-password', authLimiter);
app.use('/api/reset-password', authLimiter);
// Routes
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Intern-Galing API is running smoothly." });
});
// Internship APIs
app.use("/api/internships", internships_1.default);
// Evaluation APIs
app.use("/api/evaluations", evaluations_1.default);
// Communication APIs - Register BEFORE auth to prevent route conflict
app.use("/api/communications", communications_1.default);
// Public APIs - No authentication required (e.g., QR code verification)
app.use("/api/public", public_1.default);
// Admin APIs
app.use("/api/admin", admin_1.default);
// Student APIs
app.use("/api/student", student_1.default);
// Advisor APIs
app.use("/api/advisor", advisor_1.default);
// Supervisor APIs
app.use("/api/supervisor", supervisor_1.default);
// Supervisor APIs
app.use("/api/supervisor", supervisor_1.default);
// Auth APIs - Register LAST since it uses /api prefix (catch-all)
app.use("/api", authRoutes_1.default);
// Error Handling Middleware
app.use((err, req, res, next) => {
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
exports.default = app;
//# sourceMappingURL=server.js.map