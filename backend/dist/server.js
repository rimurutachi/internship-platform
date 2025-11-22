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
const app = (0, express_1.default)();
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
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
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
// Auth APIs
app.use("/api", authRoutes_1.default);
// Communication APIs
app.use("/api/communication", communications_1.default);
// Admin APIs
app.use("/api/admin", admin_1.default);
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong." });
});
// Start Server only if not in test environment
if (process.env.NODE_ENV !== "test") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log("Socket.io initialized and ready.");
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map