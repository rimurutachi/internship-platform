import { body, param, query, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthRequest } from "./auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Custom error handler middleware
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.type === "field" ? err.path : undefined,
      message: err.msg,
    }));

    // If there's only one error, return it as a simple message
    if (formattedErrors.length === 1) {
      return res.status(400).json({
        success: false,
        error: formattedErrors[0].message,
      });
    }

    return res.status(400).json({
      success: false,
      error: formattedErrors,
    });
  }
  next();
};

/* Notification Validators */

// Get notifications validation
export const validateGetNotifications = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a non-negative integer"),
  query("is_read")
    .optional()
    .isIn(["true", "false"])
    .withMessage("is_read must be 'true' or 'false'"),
  query("category")
    .optional()
    .isIn(["all", "internship", "document", "evaluation", "message", "system"])
    .withMessage("Invalid notification category"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage("Search query must be at most 200 characters"),
  handleValidationErrors,
];

// Mark notification as read validation
export const validateMarkNotificationAsRead = [
  param("notificationId")
    .isUUID()
    .withMessage("Invalid notification ID format."),
  handleValidationErrors,
];

// Create notification validation
export const validateCreateNotification = [
  body("user_id").isUUID().withMessage("Invalid user ID format"),
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Notification type is required.")
    .isIn([
      "message",
      "message_received",
      "evaluation_submitted",
      "evaluation_approved",
      "evaluation_revision_requested",
      "evaluation_rejected",
      "evaluation_grade_overridden",
      "evaluation_reminder",
      "internship_created",
      "internship_updated",
      "internship_active",
      "internship_completed",
      "internship_cancelled",
      "internship_reminder",
      "document_shared",
      "document_required",
      "document_submitted",
      "document_reviewed",
      "document_revision_requested",
      "document_approved",
      "document_rejected",
      "document_pre_approved",
      "document_pre_approval_reverted",
      "document_template_uploaded",
      "weekly_report_submitted",
      "weekly_report_approved",
      "weekly_report_rejected",
      "comment_added",
      "mention",
      "system",
      "profile_verified",
      "profile_rejected",
      "student_graduated",
      "account_archive_warning",
      "account_archived",
      "account_updated",
      "account_restored",
    ])
    .withMessage("Invalid notification type"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ min: 1, max: 255 })
    .withMessage("Title must be between 1 and 255 characters only."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters only."),
  body("action_url")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage("Invalid action URL format."),
  body("reference_id")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Invalid reference ID format"),
  body("reference_type")
    .optional({ nullable: true })
    .trim()
    .isIn([
      "message",
      "conversation",
      "internship",
      "evaluation",
      "document",
      "document_requirement",
      "document_submission",
      "weekly_dtr",
      "user",
      "comment",
    ])
    .withMessage("Invalid reference type."),
  handleValidationErrors,

  // Custom async validator for user existence
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.body;

      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("id", user_id)
        .single();

      if (error || !user) {
        return res.status(400).json({
          success: false,
          error: "User does not exist.",
        });
      }

      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
];

/* Authorization Validators */

export const validateNotificationOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }
    const { notificationId } = req.params;

    // Check if notification belongs to user
    const { data: notification, error } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("id", notificationId)
      .single();

    if (error || !notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found. Please try again.",
      });
    }

    if (notification.user_id !== userId) {
      return res.status(401).json({
        success: false,
        error: "You can only manage your own notifications.",
      });
    }
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
