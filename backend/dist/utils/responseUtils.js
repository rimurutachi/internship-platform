"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.asyncHandler = exports.sendInternalError = exports.sendNotFoundError = exports.sendAuthorizationError = exports.sendAuthError = exports.sendValidationError = exports.sendErrorResponse = exports.sendSuccessResponse = void 0;
/* Send standardized success response */
const sendSuccessResponse = (res, message, data, statusCode = 200) => {
    const response = {
        success: true,
        message,
    };
    if (data) {
        response.data = data;
    }
    return res.status(statusCode).json(response);
};
exports.sendSuccessResponse = sendSuccessResponse;
/* Send standardized error response */
const sendErrorResponse = (res, error, message, statusCode = 400) => {
    const response = {
        error,
        message,
    };
    return res.status(statusCode).json(response);
};
exports.sendErrorResponse = sendErrorResponse;
/* Send validation error response */
const sendValidationError = (res, message, statusCode = 400) => {
    return (0, exports.sendErrorResponse)(res, "Validation Error", message, statusCode);
};
exports.sendValidationError = sendValidationError;
/* Send authentication error response */
const sendAuthError = (res, message = "Authentication required", statusCode = 401) => {
    return (0, exports.sendErrorResponse)(res, "Authentication Error", message, statusCode);
};
exports.sendAuthError = sendAuthError;
/* Send authorization error response */
const sendAuthorizationError = (res, message = "Insufficient permissions", statusCode = 403) => {
    return (0, exports.sendErrorResponse)(res, "Authorization Error", message, statusCode);
};
exports.sendAuthorizationError = sendAuthorizationError;
/* Send not found error response */
const sendNotFoundError = (res, message = "Resource not found", statusCode = 404) => {
    return (0, exports.sendErrorResponse)(res, "Not Found", message, statusCode);
};
exports.sendNotFoundError = sendNotFoundError;
/* Send internal server error response */
const sendInternalError = (res, message = "Internal server error", statusCode = 500) => {
    return (0, exports.sendErrorResponse)(res, "Internal Server Error", message, statusCode);
};
exports.sendInternalError = sendInternalError;
/* Handle async route errors */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/* Global error handler middleware */
const globalErrorHandler = (error, req, res, next) => {
    console.error("Global error handler:", error);
    // Default error response
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal server error";
    (0, exports.sendErrorResponse)(res, "Server Error", message, statusCode);
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=responseUtils.js.map