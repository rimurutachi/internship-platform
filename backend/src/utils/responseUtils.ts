import { Response } from "express";
import { ErrorResponse, SuccessResponse } from "../types/auth";


/* Send standardized success response */
export const sendSuccessResponse = (
  res: Response,
  message: string,
  data?: any,
  statusCode: number = 200
) => {
  const response: SuccessResponse = {
    success: true,
    message,
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};


/* Send standardized error response */
export const sendErrorResponse = (
  res: Response,
  error: string,
  message: string,
  statusCode: number = 400
) => {
  const response: ErrorResponse = {
    error,
    message,
  };

  return res.status(statusCode).json(response);
};


/* Send validation error response */
export const sendValidationError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  return sendErrorResponse(res, "Validation Error", message, statusCode);
};


/* Send authentication error response */
export const sendAuthError = (
  res: Response,
  message: string = "Authentication required",
  statusCode: number = 401
) => {
  return sendErrorResponse(res, "Authentication Error", message, statusCode);
};


/* Send authorization error response */
export const sendAuthorizationError = (
  res: Response,
  message: string = "Insufficient permissions",
  statusCode: number = 403
) => {
  return sendErrorResponse(res, "Authorization Error", message, statusCode);
};


/* Send not found error response */
export const sendNotFoundError = (
  res: Response,
  message: string = "Resource not found",
  statusCode: number = 404
) => {
  return sendErrorResponse(res, "Not Found", message, statusCode);
};


/* Send internal server error response */
export const sendInternalError = (
  res: Response,
  message: string = "Internal server error",
  statusCode: number = 500
) => {
  return sendErrorResponse(res, "Internal Server Error", message, statusCode);
};


/* Handle async route errors */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


/* Global error handler middleware */
export const globalErrorHandler = (
  error: any,
  req: any,
  res: Response,
  next: any
) => {
  console.error("Global error handler:", error);

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  sendErrorResponse(res, "Server Error", message, statusCode);
};
