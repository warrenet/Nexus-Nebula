import * as fs from "fs";
import * as path from "path";
import type { Trace } from "../types";

const TRACES_DIR = path.resolve(process.cwd(), "backend", "traces");
const MEMORY_STORE = new Map<string, Trace>();
let shouldUseMemory = false;

function ensureTracesDir(): boolean {
  if (shouldUseMemory) return false;
  try {
    if (!fs.existsSync(TRACES_DIR)) {
      fs.mkdirSync(TRACES_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    if (!shouldUseMemory) {
      console.warn(
        "Could not create traces dir, falling back to in-memory store:",
        error,
      );
      shouldUseMemory = true;
    }
    return false;
  }
}

export function saveTrace(trace: Trace): void {
  MEMORY_STORE.set(trace.traceId, trace);

  if (ensureTracesDir()) {
    try {
      const filePath = path.join(TRACES_DIR, `${trace.traceId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(trace, null, 2), "utf-8");
    } catch (error) {
      console.warn(`Failed to write trace ${trace.traceId} to disk:`, error);
      shouldUseMemory = true;
    }
  }
}

export function getTrace(traceId: string): Trace | null {
  if (MEMORY_STORE.has(traceId)) {
    return MEMORY_STORE.get(traceId) || null;
  }

  if (ensureTracesDir()) {
    const filePath = path.join(TRACES_DIR, `${traceId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const trace = JSON.parse(content) as Trace;
      MEMORY_STORE.set(trace.traceId, trace); // Hydrate cache
      return trace;
    } catch (e) {
      console.error(`Error reading trace ${traceId}:`, e);
    }
  }
  return null;
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
  // Combine memory and disk (deduplicated)
  const allTraces = new Map<string, Trace>(MEMORY_STORE);

  if (ensureTracesDir()) {
    try {
      const files = fs
        .readdirSync(TRACES_DIR)
        .filter((f) => f.endsWith(".json"));

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(TRACES_DIR, file), "utf-8");
          const trace = JSON.parse(content) as Trace;
          // Disk overwrites memory if newer? Or memory is fresher?
          // Usually memory is fresher. Only add if not in memory.
          if (!allTraces.has(trace.traceId)) {
            allTraces.set(trace.traceId, trace);
          }
        } catch {
          // Ignore corrupted files
        }
      }
    } catch {
      // Directory read failed
      shouldUseMemory = true;
    }
  }

  const sortedTraces = Array.from(allTraces.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    traces: sortedTraces.slice(offset, offset + limit),
    total: sortedTraces.length,
  };
}

export function deleteTrace(traceId: string): boolean {
  let deleted = false;
  if (MEMORY_STORE.has(traceId)) {
    MEMORY_STORE.delete(traceId);
    deleted = true;
  }

  if (ensureTracesDir()) {
    const filePath = path.join(TRACES_DIR, `${traceId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        deleted = true;
      } catch (e) {
        console.error("Failed to delete trace file:", e);
      }
    }
  }
  return deleted;
}
