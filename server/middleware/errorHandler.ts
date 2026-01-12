/**
 * Centralized Error Handler Middleware
 * Provides structured error responses with error codes
 */

import type { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  traceId?: string;
}

// Error codes for structured responses
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  BUDGET_EXCEEDED: "BUDGET_EXCEEDED",
  SAFETY_BLOCKED: "SAFETY_BLOCKED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Create an API error with status code and error code
 */
export function createApiError(
  message: string,
  statusCode: number,
  code: string,
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
export function errorHandler(
  err: ApiError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const timestamp = new Date().toISOString();
  const apiError = err as ApiError;

  // Determine status code
  let statusCode = apiError.statusCode || 500;
  let code = apiError.code || ErrorCodes.INTERNAL_ERROR;

  // Map known error patterns to codes
  const message = apiError.message || "Internal Server Error";
  if (message.includes("blocked by safety")) {
    statusCode = 403;
    code = ErrorCodes.SAFETY_BLOCKED;
  } else if (message.includes("exceeds budget")) {
    statusCode = 402;
    code = ErrorCodes.BUDGET_EXCEEDED;
  } else if (message.includes("Rate limit") || message.includes("Too many")) {
    statusCode = 429;
    code = ErrorCodes.RATE_LIMITED;
  }

  // Log error with timestamp (don't expose stack in production)
  if (process.env.NODE_ENV === "production") {
    console.error(`[${timestamp}] ${code}: ${message}`);
  } else {
    console.error(`[${timestamp}] ${code}: ${message}`, err.stack);
  }

  const response: ErrorResponse = {
    error: message,
    code,
  };

  res.status(statusCode).json(response);
}
