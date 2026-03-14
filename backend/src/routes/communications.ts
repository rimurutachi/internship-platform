import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import communicationController from "../controllers/communicationController";
import {
  validateGetNotifications,
  validateMarkNotificationAsRead,
  validateCreateNotification,
  validateNotificationOwnership,
} from "../middleware/communciationValidators";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ===== USER SEARCH (for document sharing) =====

/**
 * @route   GET /api/communications/users/search
 * @desc    Search users by name or email for document sharing
 * @query   q (search term, min 2 chars), role (optional filter)
 * @access  Any authenticated user (excludes supervisors, admins, archived)
 */
router.get("/users/search", async (req: any, res: any) => {
  try {
    const { q, role } = req.query;
    const requestingUserId = req.user?.id;

    if (!q || String(q).trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_KEY as string
    );

    const searchTerm = `%${String(q).trim()}%`;

    let query = supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .not("id", "eq", requestingUserId)           // exclude self
      .not("role", "in", '("supervisor","admin")')  // exclude supervisor and admin
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
  } catch (error: any) {
    console.error("❌ [Users Search] Error:", error.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/* Notification Routes */

// Create notification (Admin only)
router.post(
  "/notifications",
  requireRole(["admin"]),
  validateCreateNotification,
  communicationController.createNotification
);

// Get user notifications
router.get(
  "/notifications",
  validateGetNotifications,
  communicationController.getNotifications
);

// Get unread notifications count
router.get(
  "/notifications/unread/count",
  communicationController.getUnreadNotificationsCount
);

// Mark single notification as read
router.patch(
  "/notifications/:notificationId/read",
  validateMarkNotificationAsRead,
  validateNotificationOwnership,
  communicationController.markNotificationAsRead
);

// Mark all notifications as read
router.patch("/notifications/read-all", communicationController.markAllAsRead);

// Delete notification
router.delete(
  "/notifications/:notificationId",
  validateMarkNotificationAsRead,
  validateNotificationOwnership,
  communicationController.deleteNotification
);

export default router;
