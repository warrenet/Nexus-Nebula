#!/usr/bin/env node

/**
 * Nexus Nebula - Doctor Script
 * Checks environment sanity before development
 * Run with: npm run doctor
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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

console.log(`\n${colors.cyan}🩺 Nexus Nebula Doctor${colors.reset}\n`);
console.log("Checking environment sanity...\n");

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

// Run all checks
checkNodeVersion();
checkNpmVersion();
checkEnvFile();
checkDependencies();
checkTypeScript();
checkPort5000();

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
  console.log(
    `${colors.green}✅ All checks passed! Ready for development.${colors.reset}\n`,
  );
  console.log("Quick start:");
  console.log("  npm run dev        # Start server + client");
  console.log("  npm run server:dev # Start server only");
  console.log("  npm run expo:dev   # Start Expo client\n");
  process.exit(0);
}
