"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNotificationOwnership = exports.validateMessageOwnership = exports.validateConversationAccess = exports.sanitizeConversationName = exports.sanitizeMessageInput = exports.validateCreateNotification = exports.validateMarkNotificationAsRead = exports.validateGetNotifications = exports.validateMarkAsRead = exports.validateGetConversation = exports.validateCreateConversation = exports.validateGetMessages = exports.validateDeleteMessage = exports.validateEditMessage = exports.validateCreateMessage = exports.handleValidationErrors = void 0;
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
/* Message Validators */
// Create message validation
exports.validateCreateMessage = [
    (0, express_validator_1.body)("conversation_id")
        .isUUID()
        .withMessage("Invalid conversation ID format."),
    (0, express_validator_1.body)("content")
        .trim()
        .notEmpty()
        .withMessage("Message content is required.")
        .isLength({ min: 1, max: 5000 })
        .withMessage("Message must be between to 1 and 5000 characters."),
    (0, express_validator_1.body)("message_type")
        .optional()
        .isIn(["text", "file", "system"])
        .withMessage("Invalid message type."),
    (0, express_validator_1.body)("file_url")
        .optional()
        .isURL()
        .withMessage("Invalid file URL format. Try again."),
    exports.handleValidationErrors,
];
// Edit message validation
exports.validateEditMessage = [
    (0, express_validator_1.param)("messageId").isUUID().withMessage("Invalid message ID format."),
    (0, express_validator_1.body)("content")
        .trim()
        .notEmpty()
        .withMessage("Message content is required")
        .isLength({ min: 1, max: 5000 })
        .withMessage("Message must be between 1 and 5000 characters."),
    exports.handleValidationErrors,
];
// Delete message validation
exports.validateDeleteMessage = [
    (0, express_validator_1.param)("messageId").isUUID().withMessage("Invalid message ID format."),
    exports.handleValidationErrors,
];
// Get messages validation
exports.validateGetMessages = [
    (0, express_validator_1.param)("conversationId")
        .isUUID()
        .withMessage("Invalid conversation ID format."),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100."),
    (0, express_validator_1.query)("offset")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Offset must be a non-negative integer. No negative."),
    exports.handleValidationErrors,
];
/* Conversation Validators */
// Create conversation validation
exports.validateCreateConversation = [
    (0, express_validator_1.body)("type")
        .isIn(["direct", "group", "internship"])
        .withMessage("Invalid conversation type. Only direct, group, or internship required."),
    (0, express_validator_1.body)("name")
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage("Conversation name must be between 1 and 255 characters."),
    (0, express_validator_1.body)("internship_id")
        .optional()
        .isUUID()
        .withMessage("Invalid internship ID format."),
    (0, express_validator_1.body)("participant_ids")
        .isArray({ min: 1 })
        .withMessage("At least one participant is required."),
    (0, express_validator_1.body)("participant_ids.*")
        .isUUID()
        .withMessage("All participant IDs must be valid UUIDs."),
    exports.handleValidationErrors,
    // Custom async validator for participants
    async (req, res, next) => {
        try {
            const { participant_ids, type, internship_id } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: "User not authenticated",
                });
            }
            // Validate that creator is included in participants
            if (!participant_ids.includes(userId)) {
                return res.status(400).json({
                    success: false,
                    error: "Creator must be included in participant list",
                });
            }
            // Check if all participants exist
            const { data: users, error } = await supabase
                .from("users")
                .select("id")
                .in("id", participant_ids);
            if (error)
                throw error;
            if (!users || users.length !== participant_ids.length) {
                return res.status(400).json({
                    success: false,
                    error: "One or more participants do not exist.",
                });
            }
            // For direct conversations, validate only 2 participants
            if (type === "direct" && participant_ids.length !== 2) {
                return res.status(400).json({
                    success: false,
                    error: "Direct conversation must have exactly 2 participants",
                });
            }
            // For internship conversations, validate internship exists
            if (type === "internship" && internship_id) {
                const { data: internship, error: internshipError } = await supabase
                    .from("internships")
                    .select("id")
                    .eq("id", internship_id)
                    .single();
                if (internshipError || !internship) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid internship ID.",
                    });
                }
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
// Get conversation validation
exports.validateGetConversation = [
    (0, express_validator_1.param)("conversationId")
        .isUUID()
        .withMessage("Invalid conversation ID format."),
    exports.handleValidationErrors,
];
// Mark as read conversation validation
exports.validateMarkAsRead = [
    (0, express_validator_1.param)("conversationId")
        .isUUID()
        .withMessage("Invalid conversation ID format"),
    exports.handleValidationErrors,
];
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
/* Sanitization Helpers */
const sanitizeMessageInput = (req, res, next) => {
    if (req.body.content) {
        // Remove potentially harmful character while preserving basic formatting.
        req.body.content = req.body.content.trim().slice(0, 5000);
    }
    next();
};
exports.sanitizeMessageInput = sanitizeMessageInput;
const sanitizeConversationName = (req, res, next) => {
    if (req.body.name) {
        req.body.name = req.body.name.trim().slice(0, 255);
    }
    next();
};
exports.sanitizeConversationName = sanitizeConversationName;
/* Authorization Validators */
const validateConversationAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Get conversationId from params or body
        const conversationId = req.params.conversationId || req.body.conversation_id;
        if (!conversationId) {
            return res.status(400).json({
                success: false,
                error: "Conversation ID is required",
            });
        }
        // Check if user is a participant in the conversation
        const { data: participant, error } = await supabase
            .from("conversation_participants")
            .select("*")
            .eq("conversation_id", conversationId)
            .eq("user_id", userId)
            .eq("is_active", true)
            .single();
        if (error || !participant) {
            return res.status(403).json({
                success: false,
                error: "You have no access to this conversation.",
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
exports.validateConversationAccess = validateConversationAccess;
const validateMessageOwnership = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { messageId } = req.params;
        // Check if user is the message sender
        const { data: message, error } = await supabase
            .from("messages")
            .select("sender_id")
            .eq("id", messageId)
            .single();
        if (error || !message) {
            return res.status(404).json({
                success: false,
                error: "Message not found",
            });
        }
        if (message.sender_id !== userId) {
            return res.status(403).json({
                success: false,
                error: "You can only edit or delete your own messages",
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
exports.validateMessageOwnership = validateMessageOwnership;
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