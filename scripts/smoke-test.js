#!/usr/bin/env node

/**
 * Nexus Nebula - Smoke Test
 * Confirms app boots and endpoints respond
 * Run with: npm run smoke-test
 */

const http = require("http");

const BASE_URL = process.env.SMOKE_TEST_URL || "http://localhost:5000";
const TIMEOUT_MS = 5000;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const CHECK = `${colors.green}✓${colors.reset}`;
const FAIL = `${colors.red}✗${colors.reset}`;

console.log(`\n${colors.cyan}🔥 Nexus Nebula Smoke Test${colors.reset}`);
console.log(`Testing: ${BASE_URL}\n`);

const tests = [
  { name: "Health check (root)", path: "/", expectedStatus: 200 },
  { name: "Metrics endpoint", path: "/metrics", expectedStatus: 200 },
  { name: "Traces list", path: "/api/traces", expectedStatus: 200 },
  { name: "Active swarms", path: "/api/swarms/active", expectedStatus: 200 },
  {
    name: "Invalid trace ID returns 404",
    path: "/api/mission/00000000-0000-0000-0000-000000000000",
    expectedStatus: 404,
  },
];

function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, BASE_URL);

    const req = http.get(url.toString(), { timeout: TIMEOUT_MS }, (res) => {
      if (res.statusCode === test.expectedStatus) {
        console.log(
          `${CHECK} ${test.name} - ${res.statusCode} (expected ${test.expectedStatus})`,
        );
        resolve(true);
      } else {
        console.log(
          `${FAIL} ${test.name} - ${res.statusCode} (expected ${test.expectedStatus})`,
        );
        resolve(false);
      }
    });

    req.on("error", (err) => {
      console.log(`${FAIL} ${test.name} - ${err.message}`);
      resolve(false);
    });

    req.on("timeout", () => {
      console.log(`${FAIL} ${test.name} - Timeout after ${TIMEOUT_MS}ms`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testEndpoint(test);
    if (success) passed++;
    else failed++;
  }

  console.log("\n" + "─".repeat(40) + "\n");
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log(`\n${colors.red}❌ Smoke test failed${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}✅ All smoke tests passed!${colors.reset}\n`);
    process.exit(0);
  }
}

runTests();
