import { Request, Response, NextFunction } from "express";
import { LoginRequest, RegisterRequest, ProfileUpdateRequest } from "../types/auth";


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
  const sanitizeString = (str: string): string => {
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
