"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNotificationOwnership = exports.validateCreateNotification = exports.validateMarkNotificationAsRead = exports.validateGetNotifications = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
// Custom error handler middleware
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
/* Notification Validators */
// Get notifications validation
exports.validateGetNotifications = [
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    exports.handleValidationErrors,
];
// Mark notification as read validation
exports.validateMarkNotificationAsRead = [
    (0, express_validator_1.param)("notificationId")
        .isUUID()
        .withMessage("Invalid notification ID format."),
    exports.handleValidationErrors,
];
// Create notification validation
exports.validateCreateNotification = [
    (0, express_validator_1.body)("user_id").isUUID().withMessage("Invalid user ID format"),
    (0, express_validator_1.body)("type")
        .trim()
        .notEmpty()
        .withMessage("Notification type is required.")
        .isIn([
        "message",
        "evaluation_submitted",
        "evaluation_approved",
        "internship_created",
        "internship_updated",
        "document_shared",
        "comment_added",
        "mention",
        "system",
    ])
        .withMessage("Invalid notification type"),
    (0, express_validator_1.body)("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required.")
        .isLength({ min: 1, max: 255 })
        .withMessage("Title must be between 1 and 255 characters only."),
    (0, express_validator_1.body)("message")
        .trim()
        .notEmpty()
        .withMessage("Message is required")
        .isLength({ min: 1, max: 1000 })
        .withMessage("Message must be between 1 and 1000 characters only."),
    (0, express_validator_1.body)("action_url")
        .optional()
        .isUUID()
        .withMessage("Invalid action URL format."),
    (0, express_validator_1.body)("reference_id")
        .optional()
        .isUUID()
        .withMessage("Invalid reference ID format"),
    (0, express_validator_1.body)("reference_type")
        .optional()
        .trim()
        .isIn([
        "message",
        "conversation",
        "internship",
        "evaluation",
        "document",
        "comment",
    ])
        .withMessage("Invalid reference type."),
    exports.handleValidationErrors,
    // Custom async validator for user existence
    async (req, res, next) => {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    },
];
/* Authorization Validators */
const validateNotificationOwnership = async (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};
exports.validateNotificationOwnership = validateNotificationOwnership;
//# sourceMappingURL=communciationValidators.js.map