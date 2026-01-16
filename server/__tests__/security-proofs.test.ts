/**
 * Security Proof Tests
 * Verifies security claims made in README/SECURITY.md are actually enforced
 */

import { describe, it, expect } from "vitest";
import { MissionRequestSchema, TraceIdSchema } from "../validators";

describe("Security Proofs", () => {
  describe("Zod Validation (All Endpoints)", () => {
    it("rejects mission with missing required fields", () => {
      const result = MissionRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("rejects mission with XSS payload", () => {
      const result = MissionRequestSchema.safeParse({
        mission: '<script>alert("xss")</script>',
        swarmSize: 3,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // The validator uses "potentially unsafe content" message
        expect(result.error.issues[0].message).toContain("unsafe");
      }
    });

    it("rejects mission with javascript: protocol", () => {
      const result = MissionRequestSchema.safeParse({
        mission: "javascript:alert(1)",
        swarmSize: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects oversized mission (>10000 chars)", () => {
      const result = MissionRequestSchema.safeParse({
        mission: "x".repeat(10001),
        swarmSize: 3,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid trace ID format", () => {
      const result = TraceIdSchema.safeParse({ traceId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("accepts valid trace ID (UUID)", () => {
      const result = TraceIdSchema.safeParse({
        traceId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid mission", () => {
      const result = MissionRequestSchema.safeParse({
        mission: "Analyze the best approach for solving this problem",
        swarmSize: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("CSP Headers (vercel.json)", () => {
    it("CSP config exists and has required directives", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const vercelPath = path.join(__dirname, "../../vercel.json");
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));

      // Find CSP header
      const headers = vercelConfig.headers || [];
      const globalHeaders = headers.find(
        (h: { source: string }) => h.source === "/(.*)",
      );
      expect(globalHeaders).toBeDefined();

      const cspHeader = globalHeaders?.headers?.find(
        (h: { key: string }) => h.key === "Content-Security-Policy",
      );
      expect(cspHeader).toBeDefined();
      expect(cspHeader.value).toContain("default-src");
      expect(cspHeader.value).toContain("frame-ancestors 'none'");
    });

    it("X-Frame-Options DENY is set", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const vercelPath = path.join(__dirname, "../../vercel.json");
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));

      const headers = vercelConfig.headers || [];
      const globalHeaders = headers.find(
        (h: { source: string }) => h.source === "/(.*)",
      );

      const xFrameHeader = globalHeaders?.headers?.find(
        (h: { key: string }) => h.key === "X-Frame-Options",
      );
      expect(xFrameHeader).toBeDefined();
      expect(xFrameHeader.value).toBe("DENY");
    });
  });

  describe("Rate Limiting (middleware config)", () => {
    it("rate limiter module exports correctly", async () => {
      const { rateLimiter } = await import("../middleware/rateLimiter");
      expect(typeof rateLimiter).toBe("function");

      // Create a limiter and verify it's a function (middleware)
      const limiter = rateLimiter({ windowMs: 1000, maxRequests: 10 });
      expect(typeof limiter).toBe("function");
    });
  });

  describe("Secrets Protection", () => {
    it("no secrets in client-side constants", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const themeFile = fs.readFileSync(
        path.join(__dirname, "../../client/constants/theme.ts"),
        "utf-8",
      );

      // Should not contain API keys or secrets
      expect(themeFile).not.toMatch(/sk-or-[a-zA-Z0-9]{10,}/);
      expect(themeFile).not.toMatch(/api_key\s*[:=]/i);
      expect(themeFile).not.toMatch(/secret\s*[:=]/i);
    });
  });
});
