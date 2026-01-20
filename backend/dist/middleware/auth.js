"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Lazy-load Supabase client
let supabaseClient = null;
function getSupabaseClient() {
    if (!supabaseClient) {
        // Validate required environment variables (skip strict check in test environment)
        if (process.env.NODE_ENV !== "test" &&
            (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
            throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY");
        }
        supabaseClient = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    }
    return supabaseClient;
}
/**
 * SECURITY: Test mode configuration
 * - Only enabled when NODE_ENV=test AND ALLOW_TEST_MODE=true
 * - TEST_USER_ROLE must be explicitly set (no default admin fallback)
 * - Production deployment: Ensure ALLOW_TEST_MODE is NOT set or set to false
 */
const isTestModeAllowed = () => {
    // Double-check: test mode requires BOTH conditions
    if (process.env.NODE_ENV !== "test")
        return false;
    if (process.env.ALLOW_TEST_MODE !== "true")
        return false;
    return true;
};
/* Middleware for authentication and extract user info including its role. */
const authenticateToken = async (req, res, next) => {
    // SECURITY: Test mode with strict guards (requires explicit ALLOW_TEST_MODE=true)
    if (isTestModeAllowed()) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No token provided",
                message: "Authorization header with Bearer token is required",
            });
        }
        // SECURITY: TEST_USER_ROLE must be explicitly configured - no default admin fallback
        const testRole = process.env.TEST_USER_ROLE;
        if (!testRole) {
            console.error("🔴 SECURITY: Test mode enabled but TEST_USER_ROLE not configured");
            return res.status(500).json({
                error: "Test configuration error",
                message: "TEST_USER_ROLE environment variable must be explicitly set",
            });
        }
        console.warn("⚠️ TEST MODE: Using mock authentication for user with role:", testRole);
        req.user = {
            id: "test-user",
            email: "test@example.com",
            role: testRole,
        };
        return next();
    }
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No token provided",
                message: "Authorization header with Bearer token is required",
            });
        }
        const token = authHeader.replace("Bearer ", "");
        // Verify token with Supabase
        const supabase = getSupabaseClient();
        const { data: { user }, error, } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({
                error: "Invalid token",
                message: "Token is invalid or expired",
            });
        }
        // Decode JWT to extract app_metadata
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            return res.status(401).json({
                error: "Invalid token.",
                message: "Token decoded failed.",
            });
        }
        // Extract role from app_metadata
        const role = decoded.app_metadata?.role || decoded.user_metadata?.role;
        if (!role) {
            // IF no role in JWT, fetch from database as fallback
            const supabase = getSupabaseClient();
            const { data: userProfile, error: profileError } = await supabase
                .from("users")
                .select("role, status")
                .eq("id", user.id)
                .single();
            if (profileError || !userProfile) {
                return res.status(403).json({
                    error: "Access denied.",
                    message: "User role not found.",
                });
            }
            // Check if user is suspended or inactive
            if (userProfile.status === 'suspended') {
                return res.status(403).json({
                    error: "Account Suspended",
                    message: "Your account has been suspended. Please contact support.",
                });
            }
            if (userProfile.status === 'inactive') {
                return res.status(403).json({
                    error: "Account Inactive",
                    message: "Your account is inactive. Please contact support.",
                });
            }
            req.user = {
                id: user.id,
                email: user.email || "",
                role: userProfile.role,
            };
        }
        else {
            // Even if role exists in JWT, check status from database
            const supabase = getSupabaseClient();
            const { data: userProfile } = await supabase
                .from("users")
                .select("status")
                .eq("id", user.id)
                .single();
            if (userProfile) {
                if (userProfile.status === 'suspended') {
                    return res.status(403).json({
                        error: "Account Suspended",
                        message: "Your account has been suspended. Please contact support.",
                    });
                }
                if (userProfile.status === 'inactive') {
                    return res.status(403).json({
                        error: "Account Inactive",
                        message: "Your account is inactive. Please contact support.",
                    });
                }
            }
            // Attach user info with role from JWT.
            req.user = {
                id: user.id,
                email: user.email || "",
                role: role,
            };
        }
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            error: "Authentication failed",
            message: "Unable to verify authentication",
        });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based Authentication
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    error: "User not authenticated",
                    message: "Please authenticate first",
                });
            }
            const userRole = req.user.role;
            if (!userRole) {
                return res.status(404).json({
                    error: "Access denied.",
                    message: "User not found.",
                });
            }
            if (!roles.includes(userRole)) {
                return res.status(403).json({
                    error: "Insufficient permissions",
                    message: `Access denied. Required roles: ${roles.join(", ")}`,
                });
            }
            next();
        }
        catch (error) {
            console.error("Authorization error:", error);
            return res.status(500).json({
                error: "Authorization failed",
                message: "Unable to verify user permissions",
            });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map