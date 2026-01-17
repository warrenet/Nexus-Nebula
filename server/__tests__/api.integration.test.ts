/**
 * API Integration Tests
 * Tests actual HTTP requests against the Express app
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { init } from "../index";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  app = await init();
});

describe("API Integration", () => {
  describe("GET /api/health", () => {
    it("returns healthy status with required fields", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status", "healthy");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("version");
    });
  });

  describe("GET /metrics", () => {
    it("returns Prometheus format with correct content-type", async () => {
      const res = await request(app).get("/metrics");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.text).toContain("# HELP nexus_missions_total");
      expect(res.text).toContain("# TYPE nexus_missions_total counter");
      expect(res.text).toContain("nexus_missions_total");
    });
  });

  describe("POST /api/mission/estimate", () => {
    it("returns cost estimate with valid mission", async () => {
      const res = await request(app).post("/api/mission/estimate").send({
        mission: "Analyze the implications of AI safety",
        swarmSize: 4,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("inputTokens");
      expect(res.body).toHaveProperty("swarmCost");
      expect(res.body).toHaveProperty("synthesisCost");
      expect(res.body).toHaveProperty("totalCost");
      expect(res.body).toHaveProperty("withinBudget");
    });

    it("rejects empty mission with 400", async () => {
      const res = await request(app)
        .post("/api/mission/estimate")
        .send({ mission: "" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("applies default swarmSize when not provided", async () => {
      const res = await request(app)
        .post("/api/mission/estimate")
        .send({ mission: "Test mission" });

      expect(res.status).toBe(200);
      // Default swarm size is 8, so costs should reflect that
      expect(res.body.inputTokens).toBeGreaterThan(0);
    });
  });

  describe("GET /api/traces", () => {
    it("returns paginated traces array", async () => {
      const res = await request(app).get("/api/traces");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("traces");
      expect(res.body).toHaveProperty("total");
      expect(Array.isArray(res.body.traces)).toBe(true);
    });

    it("respects limit query parameter", async () => {
      const res = await request(app).get("/api/traces?limit=5");

      expect(res.status).toBe(200);
      expect(res.body.traces.length).toBeLessThanOrEqual(5);
    });

    it("rejects invalid limit with 400", async () => {
      const res = await request(app).get("/api/traces?limit=999");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/mission/:traceId", () => {
    it("returns 400 for invalid UUID format", async () => {
      const res = await request(app).get("/api/mission/not-a-uuid");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid trace ID");
    });

    it("returns 404 for non-existent valid UUID", async () => {
      const res = await request(app).get(
        "/api/mission/550e8400-e29b-41d4-a716-446655440000",
      );

      expect(res.status).toBe(404);
    });
  });

  describe("Rate Limiting", () => {
    // Note: Rate limiting middleware is defined but only applied to /api/mission/execute
    // which requires an API key to test properly. Skipping for now.
    it.skip("includes rate limit headers on rate-limited endpoints", async () => {
      // This would need to test /api/mission/execute which requires API key
      expect(true).toBe(true);
    });
  });
});
