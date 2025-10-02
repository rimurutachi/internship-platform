import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupWebSocket } from './websocket';
import documentRoutes from './routes/documents';
import { env } from './config/env';


const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: env.FRONTEND_URL,
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// Routes
app.get('/health', (req,res) => {
    res.json({ status: 'OK', service: 'document-service' });
});

app.use('/api/documents', documentRoutes);

// Websocket Setup
setupWebSocket(io);

// Start Servers
const PORT = env.PORT;
const WS_PORT = env.WEBSOCKET_PORT;

server.listen(WS_PORT, () => {
    console.log(`WebSocket server is running on port ${WS_PORT}`);
});

app.listen(PORT,() => {
    console.log(`HTTP server is running on port ${PORT}`);
});

export { app, io };
