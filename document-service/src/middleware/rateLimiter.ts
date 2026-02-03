import rateLimit from "express-rate-limit";

// =============================================================================
// SECURITY: Rate Limiting Configuration (OWASP Best Practice)
// =============================================================================

/**
 * Rate limit configuration via environment variables
 * - RATE_LIMIT_WINDOW_MS: Time window (default: 15 minutes)
 * - RATE_LIMIT_MAX_REQUESTS: Max requests per window (default: 100 prod, 500 dev)
 * - RATE_LIMIT_UPLOAD_MAX: Max file uploads per hour (default: 20)
 * - RATE_LIMIT_ENABLED: Feature flag to disable (default: true)
 */
export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (process.env.NODE_ENV === 'production' ? '100' : '500')),
  uploadMaxRequests: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX || '20'),
  uploadWindowMs: 60 * 60 * 1000, // 1 hour for uploads
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
};

console.log('🔒 Document Service Rate Limiting:', {
  enabled: rateLimitConfig.enabled,
  windowMs: rateLimitConfig.windowMs,
  maxRequests: rateLimitConfig.maxRequests,
  uploadMax: rateLimitConfig.uploadMaxRequests,
  environment: process.env.NODE_ENV
});

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  skip: (req) => !rateLimitConfig.enabled || req.path === '/health',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil(rateLimitConfig.windowMs / 1000);
    console.warn(`⚠️ RATE LIMIT: IP ${req.ip} exceeded limit on ${req.method} ${req.path}`);
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: retryAfterSeconds
    });
  }
});

// SECURITY: Stricter rate limiter for file uploads (prevent storage abuse)
export const uploadLimiter = rateLimit({
  windowMs: rateLimitConfig.uploadWindowMs,
  max: rateLimitConfig.uploadMaxRequests, // 20 uploads per hour
  skip: () => !rateLimitConfig.enabled,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfterSeconds = Math.ceil(rateLimitConfig.uploadWindowMs / 1000);
    console.warn(`🔴 UPLOAD RATE LIMIT: IP ${req.ip} exceeded upload limit - possible abuse`);
    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: 'Too many file uploads.',
      retryAfter: retryAfterSeconds,
      message: 'Upload limit exceeded. Please wait before uploading more files.'
    });
  }
});
