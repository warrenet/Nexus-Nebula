import * as fs from "fs";
import * as path from "path";
import type { Trace } from "../types";

const TRACES_DIR = path.resolve(process.cwd(), "backend", "traces");

function ensureTracesDir(): void {
  if (!fs.existsSync(TRACES_DIR)) {
    fs.mkdirSync(TRACES_DIR, { recursive: true });
  }
}

export function saveTrace(trace: Trace): void {
  ensureTracesDir();
  const filePath = path.join(TRACES_DIR, `${trace.traceId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(trace, null, 2), "utf-8");
}

export function getTrace(traceId: string): Trace | null {
  ensureTracesDir();
  const filePath = path.join(TRACES_DIR, `${traceId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Trace;
}

export function updateTrace(
  traceId: string,
  updates: Partial<Trace>,
): Trace | null {
  const existing = getTrace(traceId);
  if (!existing) return null;

  const updated = { ...existing, ...updates };
  saveTrace(updated);
  return updated;
}

export function listTraces(
  limit = 50,
  offset = 0,
): { traces: Trace[]; total: number } {
  ensureTracesDir();

  const files = fs
    .readdirSync(TRACES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(TRACES_DIR, a));
      const statB = fs.statSync(path.join(TRACES_DIR, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });

  const total = files.length;
  const paginatedFiles = files.slice(offset, offset + limit);

  const traces: Trace[] = [];
  for (const file of paginatedFiles) {
    const content = fs.readFileSync(path.join(TRACES_DIR, file), "utf-8");
    traces.push(JSON.parse(content) as Trace);
  }

  return { traces, total };
}

export function deleteTrace(traceId: string): boolean {
  const filePath = path.join(TRACES_DIR, `${traceId}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}
