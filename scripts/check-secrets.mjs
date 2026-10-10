import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".pytest_cache",
  ".venv",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const ignoredExtensions = new Set([
  ".joblib",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".zip",
]);
const credentialPattern = /(?:AQ\.[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|\b\d{6,12}:[A-Za-z0-9_-]{30,})/u;
const findings = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
      continue;
    }

    if (!entry.isFile() || ignoredExtensions.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    if (entry.name.startsWith(".env") && entry.name !== ".env.example") {
      continue;
    }

    const metadata = await stat(path);
    if (metadata.size > 2_000_000) continue;

    const content = await readFile(path, "utf8");
    if (credentialPattern.test(content)) {
      findings.push(relative(root, path));
    }
  }
}

await visit(root);

if (findings.length) {
  console.error("Credential-shaped value found in:");
  for (const path of findings) console.error(`- ${path}`);
  process.exitCode = 1;
} else {
  console.log("No credential-shaped values found in project files.");
}
