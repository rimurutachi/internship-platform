import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

// Validate required environment variables (skip strict check in test environment)
if (
  process.env.NODE_ENV !== "test" &&
  (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY)
) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY"
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/* Middleware for authentication and extract user info including its role. */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No token provided",
        message: "Authorization header with Bearer token is required",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid token",
        message: "Token is invalid or expired",
      });
    }

    // Decode JWT to extract app_metadata
    const decoded: any = jwt.decode(token);

    if (!decoded) {
      return res.status(401).json({
        error: "Invalid token.",
        message: "Token decoded failed.",
      });
    }

    // Extract role from app_metadata
    const role = decoded.app_metadata?.role || decoded.user_metadata?.role;

    if (!role) {
      // IF no role in JWT, fetch from database as fallback
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        return res.status(403).json({
          error: "Access denied.",
          message: "User role not found.",
        });
      }

      req.user = {
        id: user.id,
        email: user.email || "",
        role: userProfile.role,
      };
    } else {
      // Attach user info with role from JWT.
      req.user = {
        id: user.id,
        email: user.email || "",
        role: role,
      };
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      message: "Unable to verify authentication",
    });
  }
};

// Role-based Authentication
export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "User not authenticated",
          message: "Please authenticate first",
        });
      }

      const userRole = req.user.role;

      if (!userRole) {
        return res.status(404).json({
          error: "Access denied.",
          message: "User not found.",
        });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          message: `Access denied. Required roles: ${roles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        error: "Authorization failed",
        message: "Unable to verify user permissions",
      });
    }
  };
};
