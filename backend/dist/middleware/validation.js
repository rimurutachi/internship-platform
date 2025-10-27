"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.validateRoleChangeRequest = exports.validateProfileUpdateRequest = exports.validateRegisterRequest = exports.validateLoginRequest = void 0;
/* Validation middleware for login requests */
const validateLoginRequest = (req, res, next) => {
    const { email, password } = req.body;
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format",
            message: "Please provide a valid email address",
        });
    }
    // Validate password
    if (!password || password.length < 6) {
        return res.status(400).json({
            error: "Invalid password",
            message: "Password must be at least 6 characters long",
        });
    }
    next();
};
exports.validateLoginRequest = validateLoginRequest;
/* Validation middleware for registration requests */
const validateRegisterRequest = (req, res, next) => {
    const { email, password, first_name, last_name, role = "student", } = req.body;
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            error: "Invalid email format",
            message: "Please provide a valid email address",
        });
    }
    // Validate password
    if (!password || password.length < 6) {
        return res.status(400).json({
            error: "Invalid password",
            message: "Password must be at least 6 characters long",
        });
    }
    // Validate required fields
    if (!first_name || !last_name) {
        return res.status(400).json({
            error: "Missing required fields",
            message: "First name and last name are required",
        });
    }
    // Validate name length
    if (first_name.length < 2 || last_name.length < 2) {
        return res.status(400).json({
            error: "Invalid name format",
            message: "First name and last name must be at least 2 characters long",
        });
    }
    // Validate role
    const validRoles = ["student", "advisor", "supervisor", "admin"];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({
            error: "Invalid role",
            message: `Role must be one of: ${validRoles.join(", ")}`,
        });
    }
    next();
};
exports.validateRegisterRequest = validateRegisterRequest;
/* Validation middleware for profile update requests */
const validateProfileUpdateRequest = (req, res, next) => {
    const { first_name, last_name, profile_data } = req.body;
    // Validate first name if provided
    if (first_name !== undefined) {
        if (!first_name || first_name.length < 2) {
            return res.status(400).json({
                error: "Invalid first name",
                message: "First name must be at least 2 characters long",
            });
        }
    }
    // Validate last name if provided
    if (last_name !== undefined) {
        if (!last_name || last_name.length < 2) {
            return res.status(400).json({
                error: "Invalid last name",
                message: "Last name must be at least 2 characters long",
            });
        }
    }
    // Validate profile_data if provided
    if (profile_data !== undefined && typeof profile_data !== "object") {
        return res.status(400).json({
            error: "Invalid profile data",
            message: "Profile data must be a valid object",
        });
    }
    // Check if at least one field is being updated
    if (!first_name && !last_name && !profile_data) {
        return res.status(400).json({
            error: "No updates provided",
            message: "At least one field must be provided for update",
        });
    }
    next();
};
exports.validateProfileUpdateRequest = validateProfileUpdateRequest;
/* Validation middleware for role change requests */
const validateRoleChangeRequest = (req, res, next) => {
    const { role } = req.body;
    // Validate role
    const validRoles = ["student", "advisor", "supervisor", "admin"];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
            error: "Invalid role",
            message: `Role must be one of: ${validRoles.join(", ")}`,
        });
    }
    next();
};
exports.validateRoleChangeRequest = validateRoleChangeRequest;
/* Sanitize input to prevent XSS attacks */
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        return str
            .trim()
            .replace(/[<>]/g, "") // Remove potential HTML tags
            .replace(/javascript:/gi, "") // Remove javascript: protocol
            .replace(/on\w+=/gi, ""); // Remove event handlers
    };
    /* Sanitize string fields in body */
    if (req.body) {
        const stringFields = ["email", "first_name", "last_name", "role"];
        stringFields.forEach((field) => {
            if (req.body[field] && typeof req.body[field] === "string") {
                req.body[field] = sanitizeString(req.body[field]);
            }
        });
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validation.js.map