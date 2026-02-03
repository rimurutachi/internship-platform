"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTracker = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Initialize Supabase client lazily
let supabase;
function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
        }
        supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
    }
    return supabase;
}
/**
 * Middleware to track all API requests for system metrics
 * Logs request details to api_request_logs table
 */
const requestTracker = async (req, res, next) => {
    const startTime = Date.now();
    // Capture response finish event
    res.on('finish', async () => {
        try {
            const responseTime = Date.now() - startTime;
            const userId = req.user?.id || null;
            // Log to database
            await getSupabaseClient()
                .from('api_request_logs')
                .insert({
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
                response_time_ms: responseTime,
                user_id: userId,
                ip_address: req.ip || req.socket.remoteAddress || null,
                user_agent: req.get('user-agent') || null,
                created_at: new Date().toISOString()
            });
            // Track in memory for real-time metrics
            if (global.systemMetrics) {
                global.systemMetrics.trackRequest(responseTime, res.statusCode >= 400);
                // Track session activity if user is authenticated
                // BUT NOT for logout endpoint (since user is logging out)
                if (userId && !req.path.includes('/auth/logout')) {
                    global.systemMetrics.trackSession(userId);
                }
            }
        }
        catch (error) {
            // Silently fail to not disrupt request flow
            console.error('Failed to log request:', error);
        }
    });
    next();
};
exports.requestTracker = requestTracker;
//# sourceMappingURL=requestTracker.js.map