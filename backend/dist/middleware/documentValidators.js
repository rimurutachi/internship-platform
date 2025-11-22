"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateArchive = exports.validateBatchAccess = exports.validateCreateDocument = exports.validatePagination = exports.validateUploadVersion = exports.validateUpdateAccessLevel = exports.validateGrantAccess = void 0;
// Document validation middleware
const express_validator_1 = require("express-validator");
/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: errors.array()
        });
    }
    next();
};
/**
 * Validate grant access request
 */
exports.validateGrantAccess = [
    (0, express_validator_1.body)('user_id')
        .notEmpty()
        .withMessage('User ID is required')
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    (0, express_validator_1.body)('access_type')
        .notEmpty()
        .withMessage('Access type is required')
        .isIn(['view', 'edit', 'admin'])
        .withMessage('Access type must be one of: view, edit, admin'),
    handleValidationErrors
];
/**
 * Validate update access level request
 */
exports.validateUpdateAccessLevel = [
    (0, express_validator_1.body)('access_level')
        .notEmpty()
        .withMessage('Access level is required')
        .isIn(['public', 'restricted', 'private'])
        .withMessage('Access level must be one of: public, restricted, private'),
    handleValidationErrors
];
/**
 * Validate upload version request
 */
exports.validateUploadVersion = [
    (0, express_validator_1.body)('change_log')
        .optional()
        .isString()
        .withMessage('Change log must be a string')
        .isLength({ max: 1000 })
        .withMessage('Change log must not exceed 1000 characters'),
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'File is required',
                code: 'MISSING_FILE'
            });
        }
        next();
    },
    handleValidationErrors
];
/**
 * Validate pagination parameters
 */
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort_by')
        .optional()
        .isIn(['name', 'created_at', 'updated_at', 'total_views', 'shared_with_count'])
        .withMessage('Invalid sort field'),
    (0, express_validator_1.query)('sort_order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    (0, express_validator_1.query)('access_level')
        .optional()
        .isIn(['public', 'restricted', 'private'])
        .withMessage('Invalid access level'),
    (0, express_validator_1.query)('is_archived')
        .optional()
        .isBoolean()
        .withMessage('is_archived must be a boolean'),
    handleValidationErrors
];
/**
 * Validate create document request
 */
exports.validateCreateDocument = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Document name is required')
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
    (0, express_validator_1.body)('category')
        .optional()
        .isString()
        .withMessage('Category must be a string')
        .isLength({ max: 100 })
        .withMessage('Category must not exceed 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    (0, express_validator_1.body)('access_level')
        .optional()
        .isIn(['public', 'restricted', 'private'])
        .withMessage('Access level must be one of: public, restricted, private'),
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'File is required',
                code: 'MISSING_FILE'
            });
        }
        next();
    },
    handleValidationErrors
];
/**
 * Validate batch access update request
 */
exports.validateBatchAccess = [
    (0, express_validator_1.body)('user_access_list')
        .notEmpty()
        .withMessage('User access list is required')
        .isArray()
        .withMessage('User access list must be an array'),
    (0, express_validator_1.body)('user_access_list.*.user_id')
        .notEmpty()
        .withMessage('Each item must have a user_id')
        .isUUID()
        .withMessage('User ID must be a valid UUID'),
    (0, express_validator_1.body)('user_access_list.*.access_type')
        .notEmpty()
        .withMessage('Each item must have an access_type')
        .isIn(['view', 'edit', 'admin'])
        .withMessage('Access type must be one of: view, edit, admin'),
    handleValidationErrors
];
/**
 * Validate archive document request
 */
exports.validateArchive = [
    (0, express_validator_1.body)('is_archived')
        .optional()
        .isBoolean()
        .withMessage('is_archived must be a boolean'),
    handleValidationErrors
];
//# sourceMappingURL=documentValidators.js.map