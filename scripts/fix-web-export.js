/**
 * Post-Export Script for Expo Web
 * Fixes the script tag to include type="module" which is required
 * for the bundled code that uses import.meta
 */

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("Error: dist/index.html not found. Run expo export first.");
  process.exit(1);
}

console.log("Fixing script tag to include type=module...");

let html = fs.readFileSync(indexPath, "utf-8");

// Fix script tags that load the bundle - add type="module"
// Match: <script src="/_expo/static/js/web/..." defer>
// Replace with: <script type="module" src="/_expo/static/js/web/..." defer>
html = html.replace(
  /<script\s+src="(\/_expo\/static\/js\/web\/[^"]+)"\s+defer>/g,
  '<script type="module" src="$1" defer>',
);

fs.writeFileSync(indexPath, html);

console.log('✅ Fixed: Added type="module" to script tag');
console.log("   Path:", indexPath);
