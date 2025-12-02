"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const websocket_1 = require("./websocket");
const documents_1 = __importDefault(require("./routes/documents"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.FRONTEND_URL,
        credentials: true
    }
});
exports.io = io;
// Middleware
app.use((0, cors_1.default)({ origin: env_1.env.FRONTEND_URL, credentials: true }));
app.use(express_1.default.json({ limit: '50mb' }));
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'document-service' });
});
app.use('/api/documents', documents_1.default);
// Websocket Setup
(0, websocket_1.setupWebSocket)(io);
// Start Servers
const PORT = env_1.env.PORT;
const WS_PORT = env_1.env.WEBSOCKET_PORT;
server.listen(WS_PORT, () => {
    console.log(`WebSocket server is running on port ${WS_PORT}`);
});
app.listen(PORT, () => {
    console.log(`HTTP server is running on port ${PORT}`);
});
