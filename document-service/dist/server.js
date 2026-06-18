"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const helmet_1 = __importDefault(require("helmet"));
const documents_1 = __importDefault(require("./routes/documents"));
const workflows_1 = __importDefault(require("./routes/workflows"));
const templates_1 = __importDefault(require("./routes/templates"));
const access_1 = __importDefault(require("./routes/access"));
const env_1 = require("./config/env");
const morgan_1 = __importDefault(require("morgan"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// =============================================================================
// Trust Proxy (Render/Production Deployment)
// =============================================================================
// Trust first proxy (Render) for proper rate limiting and IP detection
app.set('trust proxy', 1);
// =============================================================================
// SECURITY: Security Headers (helmet) - OWASP Best Practice
// =============================================================================
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for document rendering
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", env_1.env.FRONTEND_URL || "http://localhost:3000"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding documents
}));
// =============================================================================
// Enhanced CORS Configuration
// =============================================================================
const allowedOrigins = env_1.env.FRONTEND_URL?.split(',').map((url) => url.trim()) || ['http://localhost:3000'];
console.log('🌐 Document Service CORS Allowed Origins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
        if (!origin) {
            console.log('✅ CORS: Request with no origin (curl/Postman/server)');
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS: Allowed origin:', origin);
            callback(null, true);
        }
        else {
            console.warn('🚫 CORS: Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: "50mb" }));
app.use((0, morgan_1.default)("dev"));
app.use(rateLimiter_1.generalLimiter); // Apply general rate limiter to all routes
// =============================================================================
// Enhanced Health Check Route
// =============================================================================
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "document-service",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});
// Routes
app.use("/api/documents", documents_1.default);
app.use("/api/access", access_1.default);
app.use("/api/workflows", workflows_1.default);
app.use("/api/templates", templates_1.default);
// =============================================================================
// Improved 404 Handler
// =============================================================================
app.use((req, res, next) => {
    console.warn('⚠️ 404 Not Found:', req.method, req.originalUrl, '| IP:', req.ip);
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /health',
            'GET /api/documents',
            'POST /api/documents',
            'GET /api/access/*',
            'POST /api/workflows/*',
            'GET /api/templates/*',
        ],
        timestamp: new Date().toISOString()
    });
});
// =============================================================================
// Enhanced Error Handling Middleware
// =============================================================================
app.use((err, req, res, next) => {
    console.error('🔴 Document Service Error:', err.message);
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
// Start Server (unified port for HTTP)
const PORT = env_1.env.PORT;
server.listen(PORT, () => {
    console.log(`🟢 HTTP server running on port ${PORT}`);
    console.log(`   - HTTP API: http://localhost:${PORT}/api/documents`);
    console.log(`   - HTTP API: http://localhost:${PORT}/api/access`);
    console.log(`   - HTTP API: http://localhost:${PORT}/api/workflows`);
    console.log(`   - HTTP API: http://localhost:${PORT}/api/templates`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
});
