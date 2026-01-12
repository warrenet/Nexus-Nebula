/**
 * Zod Validators for API Input Sanitization
 * Provides type-safe validation for all API endpoints
 */

import { z } from "zod";

// Common XSS patterns to reject
const XSS_PATTERNS = /<script|javascript:|on\w+\s*=/i;

// Mission execution request schema
export const MissionRequestSchema = z.object({
  mission: z
    .string()
    .min(1, "Mission is required")
    .max(10000, "Mission exceeds maximum length of 10000 characters")
    .refine((val) => !XSS_PATTERNS.test(val), {
      message: "Mission contains potentially unsafe content",
    }),
  swarmSize: z.number().int().min(1).max(20).optional().default(8),
  maxBudget: z.number().min(0.01).max(5.0).optional().default(1.25),
});

export type ValidatedMissionRequest = z.infer<typeof MissionRequestSchema>;

// Cost estimation request schema
export const EstimateRequestSchema = z.object({
  mission: z
    .string()
    .min(1, "Mission is required")
    .max(10000, "Mission exceeds maximum length"),
  swarmSize: z.number().int().min(1).max(20).optional().default(8),
});

export type ValidatedEstimateRequest = z.infer<typeof EstimateRequestSchema>;

// Trace ID parameter schema (UUID format)
export const TraceIdSchema = z.object({
  traceId: z.string().uuid("Invalid trace ID format"),
});

export type ValidatedTraceId = z.infer<typeof TraceIdSchema>;

// Pagination query schema
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type ValidatedPagination = z.infer<typeof PaginationSchema>;

/**
 * Validate request body and return structured result
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return {
      success: false,
      error: firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`
        : "Validation failed",
    };
  }
  return { success: true, data: result.data };
}

/**
 * Validate query params and return structured result
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  query: unknown,
): { success: true; data: T } | { success: false; error: string } {
  return validateBody(schema, query);
}

/**
 * Validate URL params and return structured result
 */
export function validateParams<T>(
  schema: z.ZodSchema<T>,
  params: unknown,
): { success: true; data: T } | { success: false; error: string } {
  return validateBody(schema, params);
}
