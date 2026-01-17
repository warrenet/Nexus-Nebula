/**
 * Wait for Health Check
 * Polls the server health endpoint until it responds or times out.
 */

const http = require("http");

const MAX_RETRIES = 30;
const DELAY_MS = 1000;
const HEALTH_URL = "http://127.0.0.1:5000/api/health";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(retries = 0) {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log("✅ Server healthy!");
            console.log(`   Status: ${json.status}`);
            console.log(`   Version: ${json.version}`);
            console.log(`   Time: ${json.timestamp}`);
            resolve(true);
          } catch {
            retry(retries, resolve);
          }
        } else {
          retry(retries, resolve);
        }
      });
    });

    req.on("error", () => retry(retries, resolve));
    req.setTimeout(2000, () => {
      req.destroy();
      retry(retries, resolve);
    });
  });
}

async function retry(retries, resolve) {
  if (retries >= MAX_RETRIES) {
    console.error("❌ Server failed to start within 30 seconds");
    process.exit(1);
  }
  console.log(`⏳ Waiting for server... (${retries + 1}/${MAX_RETRIES})`);
  await sleep(DELAY_MS);
  checkHealth(retries + 1).then(resolve);
}

console.log("🔍 Checking server health at", HEALTH_URL);
checkHealth();
