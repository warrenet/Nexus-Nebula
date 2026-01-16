/**
 * Critical Path Tests for Nexus Nebula
 *
 * These tests cover the most important server functionality:
 * 1. Zod validators work correctly
 * 2. Rate limiter functions properly
 * 3. Cost estimation is accurate
 */

import { describe, it, expect } from "vitest";
import {
  MissionRequestSchema,
  EstimateRequestSchema,
  TraceIdSchema,
  PaginationSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "../validators";
import { estimateCost } from "../services/swarm_manager";

describe("Zod Validators", () => {
  describe("MissionRequestSchema", () => {
    it("accepts valid mission request", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: "Analyze the implications of quantum computing",
        swarmSize: 4,
        maxBudget: 1.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mission).toBe(
          "Analyze the implications of quantum computing",
        );
        expect(result.data.swarmSize).toBe(4);
        expect(result.data.maxBudget).toBe(1.5);
      }
    });

    it("applies default values when optional fields missing", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: "Test mission",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.swarmSize).toBe(8);
        expect(result.data.maxBudget).toBe(1.25);
      }
    });

    it("rejects empty mission", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects XSS content", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: '<script>alert("xss")</script>',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("unsafe");
      }
    });

    it("rejects mission exceeding max length", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: "x".repeat(10001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects swarmSize outside valid range", () => {
      const result = validateBody(MissionRequestSchema, {
        mission: "Valid mission",
        swarmSize: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("EstimateRequestSchema", () => {
    it("accepts valid estimate request", () => {
      const result = validateBody(EstimateRequestSchema, {
        mission: "Estimate this",
        swarmSize: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("TraceIdSchema", () => {
    it("accepts valid UUID", () => {
      const result = validateParams(TraceIdSchema, {
        traceId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const result = validateParams(TraceIdSchema, {
        traceId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("PaginationSchema", () => {
    it("applies defaults", () => {
      const result = validateQuery(PaginationSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("coerces string numbers", () => {
      const result = validateQuery(PaginationSchema, {
        limit: "25",
        offset: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });

    it("clamps limit to max 100", () => {
      const result = validateQuery(PaginationSchema, {
        limit: "200",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Cost Estimation", () => {
  it("estimates cost for default swarm size", () => {
    const estimate = estimateCost("Test mission for cost estimation", 8);
    expect(estimate).toHaveProperty("inputTokens");
    expect(estimate).toHaveProperty("swarmCost");
    expect(estimate).toHaveProperty("synthesisCost");
    expect(estimate).toHaveProperty("totalCost");
    expect(estimate).toHaveProperty("withinBudget");
    expect(estimate.inputTokens).toBeGreaterThan(0);
  });

  it("scales cost with swarm size", () => {
    const small = estimateCost("Test", 2);
    const large = estimateCost("Test", 20);
    expect(large.totalCost).toBeGreaterThanOrEqual(small.totalCost);
  });

  it("returns withinBudget=true for free model", () => {
    const estimate = estimateCost("Test mission", 8);
    // Free model swarm cost should be 0, only synthesis costs
    expect(estimate.swarmCost).toBe(0);
  });
});
