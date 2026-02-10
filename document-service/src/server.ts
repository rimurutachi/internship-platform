import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import { Server as SocketServer } from "socket.io";
import { setupWebSocket } from "./websocket";
import documentRoutes from "./routes/documents";
import blockchainRoutes from "./routes/blockchain";
import signatureRoutes from "./routes/signatures";
import accessRoutes from "./routes/access";
import workflowRoutes from "./routes/workflows";
import templateRoutes from "./routes/templates";
import collaborationRoutes from "./routes/collaboration";
import { env } from "./config/env";
import morgan from "morgan";
import { generalLimiter } from "./middleware/rateLimiter";

const app = express();
const server = http.createServer(app);

// =============================================================================
// FIX #1: Trust Proxy (Render/Production Deployment)
// =============================================================================
// Trust first proxy (Render) for proper rate limiting and IP detection
app.set('trust proxy', 1);

const io = new SocketServer(server, {
  cors: {
    origin: env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true, // Enable compatibility with older clients
  pingTimeout: 60000,
  pingInterval: 25000,
});

// =============================================================================
// SECURITY: Security Headers (helmet) - OWASP Best Practice
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for document rendering
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.FRONTEND_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding documents
}));

// =============================================================================
// FIX #2: Enhanced CORS Configuration
// =============================================================================
const allowedOrigins = env.FRONTEND_URL?.split(',').map((url: string) => url.trim()) || ['http://localhost:3000'];
console.log('🌐 Document Service CORS Allowed Origins:', allowedOrigins);

app.use(cors({ 
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use(generalLimiter); // Apply general rate limiter to all routes

// =============================================================================
// FIX #3: Enhanced Health Check Route
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
app.use("/api/documents", documentRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/signatures", signatureRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/collaboration", collaborationRoutes);

// =============================================================================
// FIX #4: Improved 404 Handler
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
      'GET /api/blockchain/*',
      'POST /api/signatures/*',
      'GET /api/access/*',
      'POST /api/workflows/*',
      'GET /api/templates/*',
      'POST /api/collaboration/*'
    ],
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// FIX #5: Enhanced Error Handling Middleware
// =============================================================================
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
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
  }
);

// Websocket Setup
setupWebSocket(io);

// Start Server (unified port for HTTP + WebSocket)
const PORT = env.PORT;

server.listen(PORT, () => {
  console.log(`🟢 Socket.io + HTTP server running on port ${PORT}`);
  console.log(`   - WebSocket: ws://localhost:${PORT}`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/documents`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/blockchain`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/signatures`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/access`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/workflows`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/templates`);
  console.log(`   - HTTP API: http://localhost:${PORT}/api/collaboration`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
});

export { app, io, server };
