"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Validate required environment variables (skip strict check in test environment)
if (process.env.NODE_ENV !== "test" &&
    (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)) {
    throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY");
}
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
/* Middleware for authentication and extract user info including its role. */
const authenticateToken = async (req, res, next) => {
    // In test environment, accept any Bearer token and attach a default user
    if (process.env.NODE_ENV === "test") {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No token provided",
                message: "Authorization header with Bearer token is required",
            });
        }
        req.user = {
            id: "test-user",
            email: "test@example.com",
            role: process.env.TEST_USER_ROLE || "admin",
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