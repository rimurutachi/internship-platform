"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socketConfig_1 = require("./socket/socketConfig");
// Load environment variables FIRST before importing any modules that need them
dotenv_1.default.config();
// For Routes on top of dotenv
const internships_1 = __importDefault(require("./routes/internships"));
const evaluations_1 = __importDefault(require("./routes/evaluations"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const communications_1 = __importDefault(require("./routes/communications"));
const admin_1 = __importDefault(require("./routes/admin"));
const student_1 = __importDefault(require("./routes/student"));
const advisor_1 = __importDefault(require("./routes/advisor"));
const supervisor_1 = __importDefault(require("./routes/supervisor"));
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
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use((0, morgan_1.default)("combined"));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate Limiting
const rateLimitWindow = 15 * 60 * 1000; // 15 minutes
const limiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitWindow,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
    skip: (req) => {
        // Skip rate limiting for:
        // - Admin routes (settings, reports, system)
        // - Authentication routes
        // - Communication routes (messages, notifications)
        return (req.path.startsWith('/api/admin/settings') ||
            req.path.startsWith('/api/admin/reports') ||
            req.path.startsWith('/api/admin/system') ||
            req.path.startsWith('/api/auth') ||
            req.path.startsWith('/api/communications'));
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