import { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";
import { LoginRequest, RegisterRequest, ProfileUpdateRequest } from "../types/auth";

// =============================================================================
// SECURITY: Input Sanitization Configuration (OWASP Best Practice)
// =============================================================================

/**
 * DOMPurify configuration for strict text-only sanitization
 * - Strips ALL HTML tags (whitelist approach)
 * - Prevents XSS, script injection, event handlers
 * - Safe for use in text fields, names, emails, etc.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [], // Strip ALL HTML tags
  ALLOWED_ATTR: [], // Strip ALL attributes
  KEEP_CONTENT: true, // Keep text content after stripping tags
};

/**
 * Sanitize a string value to prevent XSS attacks
 * Uses DOMPurify with strict configuration (OWASP recommended)
 */
const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  
  // Step 1: DOMPurify sanitization (handles encoded attacks, nested tags, etc.)
  let sanitized = DOMPurify.sanitize(str, SANITIZE_CONFIG);
  
  // Step 2: Additional cleanup for edge cases
  sanitized = sanitized
    .trim()
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol (can embed scripts)
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers (onclick=, etc.)
  
  return sanitized;
};

/**
 * Deep sanitize an object recursively
 * Handles nested objects and arrays
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj; // Return numbers, booleans, etc. as-is
};


/* Validation middleware for login requests */
export const validateLoginRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password }: LoginRequest = req.body;

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


/* Validation middleware for registration requests */
export const validateRegisterRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    email,
    password,
    first_name,
    last_name,
    role = "student",
  }: RegisterRequest = req.body;

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


/* Validation middleware for profile update requests */
export const validateProfileUpdateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { first_name, last_name, profile_data }: ProfileUpdateRequest = req.body;

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


/* Validation middleware for role change requests */
export const validateRoleChangeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/* Sanitize input to prevent XSS attacks */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // SECURITY: Comprehensive input sanitization using DOMPurify (OWASP recommended)
  // Sanitizes ALL string fields in request body, not just specific ones
  
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
    console.log("🛡️ Input sanitized for request:", req.method, req.path);
  }
  
  // Note: req.query is read-only in Express, cannot be reassigned
  // Query params are sanitized by express-validator on routes that need it

  next();
};

/**
 * SECURITY: Strict input validation middleware
 * Rejects requests with unexpected fields (OWASP: Fail safely)
 */
export const validateExpectedFields = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }
    
    const unexpectedFields = Object.keys(req.body).filter(
      field => !allowedFields.includes(field)
    );
    
    if (unexpectedFields.length > 0) {
      console.warn(`⚠️ SECURITY: Unexpected fields in request:`, unexpectedFields, `Path: ${req.path}`);
      return res.status(400).json({
        error: "Invalid request",
        message: `Unexpected fields in request: ${unexpectedFields.join(', ')}`,
        allowedFields: allowedFields
      });
    }
    
    next();
  };
};

/**
 * SECURITY: Input length validation middleware
 * Prevents oversized inputs that could cause DoS
 */
export const validateInputLength = (maxLengths: Record<string, number>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }
    
    for (const [field, maxLength] of Object.entries(maxLengths)) {
      const value = req.body[field];
      if (value && typeof value === 'string' && value.length > maxLength) {
        console.warn(`⚠️ SECURITY: Field '${field}' exceeds max length (${value.length}/${maxLength})`);
        return res.status(400).json({
          error: "Input too long",
          message: `Field '${field}' exceeds maximum length of ${maxLength} characters`,
          field: field,
          maxLength: maxLength
        });
      }
    }
    
    next();
  };
};
