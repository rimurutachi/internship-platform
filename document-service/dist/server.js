"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const websocket_1 = require("./websocket");
const documents_1 = __importDefault(require("./routes/documents"));
const blockchain_1 = __importDefault(require("./routes/blockchain"));
const signatures_1 = __importDefault(require("./routes/signatures"));
const access_1 = __importDefault(require("./routes/access"));
const workflows_1 = __importDefault(require("./routes/workflows"));
const templates_1 = __importDefault(require("./routes/templates"));
const collaboration_1 = __importDefault(require("./routes/collaboration"));
const env_1 = require("./config/env");
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true, // Enable compatibility with older clients
    pingTimeout: 60000,
    pingInterval: 25000,
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({ origin: env_1.env.FRONTEND_URL, credentials: true }));
app.use(express_1.default.json({ limit: "50mb" }));
app.use((0, morgan_1.default)("dev"));
// Error handling middleware (Morgan)
app.use((err, req, res, next) => {
    console.error("Error", err);
    res.status(500).json({ success: false, error: "Internal server error." });
});
// Routes
app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "document-service" });
});
app.use("/api/documents", documents_1.default);
app.use("/api/blockchain", blockchain_1.default);
app.use("/api/signatures", signatures_1.default);
app.use("/api/access", access_1.default);
app.use("/api/workflows", workflows_1.default);
app.use("/api/templates", templates_1.default);
app.use("/api/collaboration", collaboration_1.default);
// Websocket Setup
(0, websocket_1.setupWebSocket)(io);
// Start Servers
const PORT = env_1.env.PORT;
const WS_PORT = env_1.env.WEBSOCKET_PORT;
// Use single port for everything (Socket.io + HTTP API)
// Note: Using same port for both to avoid browser unsafe port blocking
const SERVER_PORT = WS_PORT || PORT;
server.listen(SERVER_PORT, () => {
    console.log(`🟢 Socket.io + HTTP server running on port ${SERVER_PORT}`);
    console.log(`   - WebSocket: ws://localhost:${SERVER_PORT}`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/documents`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/blockchain`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/signatures`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/access`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/workflows`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/templates`);
    console.log(`   - HTTP API: http://localhost:${SERVER_PORT}/api/collaboration`);
    console.log(`   - Health: http://localhost:${SERVER_PORT}/health`);
});
