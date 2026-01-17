#!/usr/bin/env node

/**
 * Nexus Nebula - Doctor Script
 * Checks environment sanity before development
 * Run with: npm run doctor
 * Run with: npm run doctor -- --live  (checks running server health)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const CHECK = `${colors.green}✓${colors.reset}`;
const FAIL = `${colors.red}✗${colors.reset}`;
const WARN = `${colors.yellow}⚠${colors.reset}`;

const isLiveCheck = process.argv.includes("--live");
const HEALTH_TIMEOUT_MS = parseInt(
  process.env.HEALTH_TIMEOUT_MS || "30000",
  10,
);

console.log(`\n${colors.cyan}🩺 Nexus Nebula Doctor${colors.reset}\n`);
console.log(
  isLiveCheck
    ? "Checking server health...\n"
    : "Checking environment sanity...\n",
);

let hasErrors = false;
let hasWarnings = false;

// 1. Check Node version
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0], 10);
  if (major >= 18) {
    console.log(`${CHECK} Node.js version: ${version} (>= 18 required)`);
    return true;
  } else {
    console.log(`${FAIL} Node.js version: ${version} (>= 18 required)`);
    hasErrors = true;
    return false;
  }
}

// 2. Check npm version
function checkNpmVersion() {
  try {
    const version = execSync("npm --version", { encoding: "utf-8" }).trim();
    console.log(`${CHECK} npm version: ${version}`);
    return true;
  } catch {
    console.log(`${FAIL} npm not found`);
    hasErrors = true;
    return false;
  }
}

// 3. Check .env file
function checkEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  const envExamplePath = path.join(__dirname, "..", ".env.example");

  if (fs.existsSync(envPath)) {
    console.log(`${CHECK} .env file exists`);

    // Check for required vars
    const envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("OPENROUTER_API_KEY=")) {
      if (
        envContent.includes("OPENROUTER_API_KEY=your") ||
        envContent.includes("OPENROUTER_API_KEY=sk-or-")
      ) {
        console.log(`${CHECK} OPENROUTER_API_KEY is set`);
      } else {
        console.log(`${WARN} OPENROUTER_API_KEY may not be valid`);
        hasWarnings = true;
      }
    } else {
      console.log(`${FAIL} OPENROUTER_API_KEY not found in .env`);
      hasErrors = true;
    }
    return true;
  } else {
    console.log(`${WARN} .env file missing (copy from .env.example)`);
    hasWarnings = true;

    if (fs.existsSync(envExamplePath)) {
      console.log(`   Run: cp .env.example .env`);
    }
    return false;
  }
}

// 4. Check dependencies installed
function checkDependencies() {
  const nodeModulesPath = path.join(__dirname, "..", "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`${CHECK} node_modules exists`);
    return true;
  } else {
    console.log(`${FAIL} node_modules missing (run npm install)`);
    hasErrors = true;
    return false;
  }
}

// 5. Check TypeScript compiles
function checkTypeScript() {
  try {
    execSync("npm run check:types", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: path.join(__dirname, ".."),
    });
    console.log(`${CHECK} TypeScript compiles without errors`);
    return true;
  } catch (e) {
    console.log(`${FAIL} TypeScript compilation errors`);
    hasErrors = true;
    return false;
  }
}

// 6. Check if port 5000 is available
function checkPort5000() {
  try {
    execSync(
      process.platform === "win32"
        ? 'netstat -ano | findstr ":5000"'
        : "lsof -i :5000",
      { encoding: "utf-8", stdio: "pipe" },
    );
    console.log(`${WARN} Port 5000 is in use (server may fail to start)`);
    hasWarnings = true;
    return false;
  } catch {
    console.log(`${CHECK} Port 5000 is available`);
    return true;
  }
}

// 7. Check server health (live mode)
function checkServerHealth() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const maxRetries = Math.ceil(HEALTH_TIMEOUT_MS / 1000);
    let retries = 0;

    function attempt() {
      const req = http.get("http://127.0.0.1:5000/api/health", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              console.log(`${CHECK} Server health: ${json.status}`);
              console.log(`   Version: ${json.version}`);
              console.log(`   Timestamp: ${json.timestamp}`);
              resolve(true);
            } catch {
              retry();
            }
          } else {
            retry();
          }
        });
      });

      req.on("error", retry);
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      retries++;
      if (retries >= maxRetries) {
        console.log(
          `${FAIL} Server health check failed (timeout after ${HEALTH_TIMEOUT_MS}ms)`,
        );
        hasErrors = true;
        resolve(false);
        return;
      }
      console.log(`   ⏳ Waiting for server... (${retries}/${maxRetries})`);
      setTimeout(attempt, 1000);
    }

    attempt();
  });
}

// 8. Check metrics endpoint (live mode)
function checkMetrics() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:5000/metrics", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200 && data.includes("nexus_missions_total")) {
          console.log(`${CHECK} Metrics endpoint: Prometheus format`);
          resolve(true);
        } else {
          console.log(`${FAIL} Metrics endpoint: Invalid format`);
          hasErrors = true;
          resolve(false);
        }
      });
    });

    req.on("error", () => {
      console.log(`${FAIL} Metrics endpoint: Not reachable`);
      hasErrors = true;
      resolve(false);
    });
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`${FAIL} Metrics endpoint: Timeout`);
      hasErrors = true;
      resolve(false);
    });
  });
}

// Run checks
async function runChecks() {
  if (isLiveCheck) {
    // Live mode: check running server
    await checkServerHealth();
    await checkMetrics();
  } else {
    // Static mode: check environment
    checkNodeVersion();
    checkNpmVersion();
    checkEnvFile();
    checkDependencies();
    checkTypeScript();
    checkPort5000();
  }

  // Summary
  console.log("\n" + "─".repeat(40) + "\n");

  if (hasErrors) {
    console.log(
      `${colors.red}❌ Doctor found errors. Fix them before proceeding.${colors.reset}\n`,
    );
    process.exit(1);
  } else if (hasWarnings) {
    console.log(
      `${colors.yellow}⚠️  Doctor found warnings. You may proceed but check above.${colors.reset}\n`,
    );
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ All checks passed!${colors.reset}\n`);
    if (!isLiveCheck) {
      console.log("Quick start:");
      console.log("  npm run dev        # Start server + client");
      console.log("  npm run doctor -- --live  # Check running server\n");
    }
    process.exit(0);
  }
}

runChecks();
