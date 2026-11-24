"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../middleware/auth");
const communicationController_1 = __importDefault(require("../controllers/communicationController"));
const communciationValidators_1 = require("../middleware/communciationValidators");
const supabase_js_1 = require("@supabase/supabase-js");
const router = (0, express_1.Router)();
/**
 * Validates internal service-to-service calls (e.g., from document-service)
 * using constant-time comparison against INTERNAL_SERVICE_KEY or SUPABASE_SERVICE_KEY.
 */
function validateInternalServiceKey(req, res, next) {
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
    const providedKey = String(req.headers["x-internal-service-key"] || "");
    if (!expectedKey || !providedKey) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized internal request",
        });
    }
    const expectedBuf = Buffer.from(expectedKey, "utf8");
    const providedBuf = Buffer.from(providedKey, "utf8");
    if (expectedBuf.length !== providedBuf.length ||
        !crypto_1.default.timingSafeEqual(expectedBuf, providedBuf)) {
        return res.status(403).json({
            success: false,
            error: "Invalid internal service key",
        });
    }
    next();
}
// Internal service-to-service notification endpoint (before JWT auth middleware)
router.post("/notifications/internal", validateInternalServiceKey, communicationController_1.default.createInternalNotifications);
// All user-facing routes require authentication
router.use(auth_1.authenticateToken);
// ===== USER SEARCH (for document sharing) =====
/**
 * @route   GET /api/communications/users/search
 * @desc    Search users by name or email for document sharing
 * @query   q (search term, min 2 chars), role (optional filter)
 * @access  Any authenticated user (excludes supervisors, admins, archived)
 */
router.get("/users/search", async (req, res) => {
    try {
        const { q, role } = req.query;
        const requestingUserId = req.user?.id;
        if (!q || String(q).trim().length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }
        const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        const searchTerm = `%${String(q).trim()}%`;
        let query = supabase
            .from("users")
            .select("id, first_name, last_name, email, role")
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .not("id", "eq", requestingUserId) // exclude self
            .not("role", "in", '("supervisor","admin")') // exclude supervisor and admin
            .or("is_archived.is.null,is_archived.eq.false") // exclude archived
            .eq("status", "active")
            .limit(15);
        // Optional role filter (e.g., only students or only advisors)
        if (role && !["supervisor", "admin"].includes(String(role))) {
            query = query.eq("role", role);
        }
        const { data: users, error } = await query;
        if (error) {
            console.error("❌ [Users Search] Supabase error:", error.message);
            return res.status(500).json({ success: false, error: "Failed to search users" });
        }
        return res.status(200).json({ success: true, data: users || [] });
    }
    catch (error) {
        console.error("❌ [Users Search] Error:", error.message);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* Notification Routes */
// Create notification (Admin only)
router.post("/notifications", (0, auth_1.requireRole)(["admin"]), communciationValidators_1.validateCreateNotification, communicationController_1.default.createNotification);
// Get user notifications
router.get("/notifications", communciationValidators_1.validateGetNotifications, communicationController_1.default.getNotifications);
// Get unread notifications count
router.get("/notifications/unread/count", communicationController_1.default.getUnreadNotificationsCount);
// Mark all notifications as read
router.patch("/notifications/read-all", communicationController_1.default.markAllAsRead);
// Clear read notifications (must precede /:notificationId)
router.delete("/notifications/clear-read", communicationController_1.default.clearReadNotifications);
// Clear all notifications (must precede /:notificationId)
router.delete("/notifications/clear-all", communicationController_1.default.clearAllNotifications);
// Mark single notification as read
router.patch("/notifications/:notificationId/read", communciationValidators_1.validateMarkNotificationAsRead, communciationValidators_1.validateNotificationOwnership, communicationController_1.default.markNotificationAsRead);
// Delete notification
router.delete("/notifications/:notificationId", communciationValidators_1.validateMarkNotificationAsRead, communciationValidators_1.validateNotificationOwnership, communicationController_1.default.deleteNotification);
exports.default = router;
//# sourceMappingURL=communications.js.map