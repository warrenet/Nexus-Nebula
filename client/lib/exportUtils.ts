/**
 * Export utilities for mission trace data
 * Supports plaintext, markdown, and JSON formats
 */

import * as Clipboard from "expo-clipboard";
import { Platform } from "react-native";

export interface RedTeamFlag {
  flagId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categories: string[];
  explanation: string;
  source: string;
}

export interface AgentResponse {
  agentId: string;
  model: string;
  response: string;
  confidence: number;
  latencyMs: number;
}

export interface Iteration {
  iterationId: number;
  agentResponses: AgentResponse[];
  consensusScore: number;
  timestamp: string;
}

export interface Trace {
  traceId: string;
  timestamp: string;
  mission: string;
  iterations: Iteration[];
  branchScores: Record<string, number>;
  redTeamFlags: RedTeamFlag[];
  finalPosteriorWeights: Record<string, number>;
  synthesisResult: string;
  costEstimate: number;
  actualCost: number;
  durationMs: number;
  status: string;
  error?: string;
}

/**
 * Format trace as plaintext
 */
export function traceToPlaintext(trace: Trace): string {
  const lines: string[] = [];

  lines.push("═".repeat(60));
  lines.push("NEXUS NEBULA - MISSION TRACE");
  lines.push("═".repeat(60));
  lines.push("");
  lines.push(`Mission: ${trace.mission}`);
  lines.push(`Status: ${trace.status.toUpperCase()}`);
  lines.push(`Timestamp: ${new Date(trace.timestamp).toLocaleString()}`);
  lines.push(`Duration: ${(trace.durationMs / 1000).toFixed(2)}s`);
  lines.push(`Cost: $${trace.actualCost.toFixed(4)}`);
  lines.push("");

  // Synthesis Result
  lines.push("─".repeat(60));
  lines.push("SYNTHESIS RESULT");
  lines.push("─".repeat(60));
  lines.push(trace.synthesisResult || "No synthesis available");
  lines.push("");

  // Agent Weights
  if (Object.keys(trace.finalPosteriorWeights).length > 0) {
    lines.push("─".repeat(60));
    lines.push("AGENT WEIGHTS");
    lines.push("─".repeat(60));
    Object.entries(trace.finalPosteriorWeights)
      .sort(([, a], [, b]) => b - a)
      .forEach(([agentId, weight]) => {
        const bar = "█".repeat(Math.round(weight * 20));
        lines.push(
          `${agentId.padEnd(15)} ${bar} ${(weight * 100).toFixed(1)}%`,
        );
      });
    lines.push("");
  }

  // Safety Flags
  if (trace.redTeamFlags.length > 0) {
    lines.push("─".repeat(60));
    lines.push("SAFETY FLAGS");
    lines.push("─".repeat(60));
    trace.redTeamFlags.forEach((flag) => {
      lines.push(`[${flag.severity}] ${flag.explanation}`);
    });
    lines.push("");
  }

  // Iterations
  if (trace.iterations.length > 0) {
    lines.push("─".repeat(60));
    lines.push("ITERATION DETAILS");
    lines.push("─".repeat(60));
    trace.iterations.forEach((iteration) => {
      lines.push(
        `\nIteration ${iteration.iterationId} (Consensus: ${(iteration.consensusScore * 100).toFixed(1)}%)`,
      );
      iteration.agentResponses.forEach((agent) => {
        lines.push(
          `  • ${agent.agentId} (${agent.model}): ${agent.confidence.toFixed(2)} confidence, ${agent.latencyMs}ms`,
        );
      });
    });
    lines.push("");
  }

  lines.push("═".repeat(60));
  lines.push(`Trace ID: ${trace.traceId}`);
  lines.push("═".repeat(60));

  return lines.join("\n");
}

/**
 * Format trace as markdown
 */
export function traceToMarkdown(trace: Trace): string {
  const lines: string[] = [];

  lines.push("# 🚀 Nexus Nebula Mission Trace");
  lines.push("");
  lines.push("## Mission Overview");
  lines.push("");
  lines.push(`> ${trace.mission}`);
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push(
    `| **Status** | ${trace.status === "completed" ? "✅ Completed" : trace.status === "failed" ? "❌ Failed" : "⚠️ " + trace.status} |`,
  );
  lines.push(
    `| **Timestamp** | ${new Date(trace.timestamp).toLocaleString()} |`,
  );
  lines.push(`| **Duration** | ${(trace.durationMs / 1000).toFixed(2)}s |`);
  lines.push(`| **Cost** | $${trace.actualCost.toFixed(4)} |`);
  lines.push(
    `| **Agents** | ${trace.iterations[0]?.agentResponses.length || 0} |`,
  );
  lines.push(`| **Iterations** | ${trace.iterations.length} |`);
  lines.push("");

  // Synthesis Result
  lines.push("## 🧠 Synthesis Result");
  lines.push("");
  lines.push("```");
  lines.push(trace.synthesisResult || "No synthesis available");
  lines.push("```");
  lines.push("");

  // Agent Weights
  if (Object.keys(trace.finalPosteriorWeights).length > 0) {
    lines.push("## 📊 Agent Weights");
    lines.push("");
    lines.push("| Agent | Weight |");
    lines.push("|-------|--------|");
    Object.entries(trace.finalPosteriorWeights)
      .sort(([, a], [, b]) => b - a)
      .forEach(([agentId, weight]) => {
        const bar =
          "█".repeat(Math.round(weight * 10)) +
          "░".repeat(10 - Math.round(weight * 10));
        lines.push(`| ${agentId} | ${bar} ${(weight * 100).toFixed(1)}% |`);
      });
    lines.push("");
  }

  // Safety Flags
  if (trace.redTeamFlags.length > 0) {
    lines.push("## ⚠️ Safety Flags");
    lines.push("");
    trace.redTeamFlags.forEach((flag) => {
      const icon =
        flag.severity === "CRITICAL"
          ? "🔴"
          : flag.severity === "HIGH"
            ? "🟠"
            : flag.severity === "MEDIUM"
              ? "🟡"
              : "🟢";
      lines.push(`- ${icon} **${flag.severity}**: ${flag.explanation}`);
    });
    lines.push("");
  }

  // Iterations
  if (trace.iterations.length > 0) {
    lines.push("## 🔄 Iteration Details");
    lines.push("");
    trace.iterations.forEach((iteration) => {
      lines.push(`### Iteration ${iteration.iterationId}`);
      lines.push("");
      lines.push(
        `**Consensus Score:** ${(iteration.consensusScore * 100).toFixed(1)}%`,
      );
      lines.push("");
      lines.push("| Agent | Model | Confidence | Latency |");
      lines.push("|-------|-------|------------|---------|");
      iteration.agentResponses.forEach((agent) => {
        lines.push(
          `| ${agent.agentId} | \`${agent.model.split("/").pop()}\` | ${(agent.confidence * 100).toFixed(1)}% | ${agent.latencyMs}ms |`,
        );
      });
      lines.push("");
    });
  }

  lines.push("---");
  lines.push(`*Trace ID: \`${trace.traceId}\`*`);

  return lines.join("\n");
}

/**
 * Format trace as JSON (prettified)
 */
export function traceToJSON(trace: Trace): string {
  return JSON.stringify(trace, null, 2);
}

export type ExportFormat = "plaintext" | "markdown" | "json";

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(content);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Download file (web uses blob download, native falls back to clipboard)
 */
export async function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      // Web: Create blob and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } else {
      // Native: Fall back to clipboard copy since file system may not be available
      const success = await copyToClipboard(content);
      if (success) {
        console.log(
          `Content copied to clipboard (file download not available on this platform)`,
        );
      }
      return success;
    }
  } catch (error) {
    console.error("Failed to download file:", error);
    return false;
  }
}

/**
 * Export a trace in the specified format
 */
export async function exportTrace(
  trace: Trace,
  format: ExportFormat,
  action: "copy" | "download",
): Promise<{ success: boolean; message: string }> {
  let content: string;
  let filename: string;
  let mimeType: string;

  switch (format) {
    case "plaintext":
      content = traceToPlaintext(trace);
      filename = `nexus-trace-${trace.traceId.slice(0, 8)}.txt`;
      mimeType = "text/plain";
      break;
    case "markdown":
      content = traceToMarkdown(trace);
      filename = `nexus-trace-${trace.traceId.slice(0, 8)}.md`;
      mimeType = "text/markdown";
      break;
    case "json":
      content = traceToJSON(trace);
      filename = `nexus-trace-${trace.traceId.slice(0, 8)}.json`;
      mimeType = "application/json";
      break;
  }

  if (action === "copy") {
    const success = await copyToClipboard(content);
    return {
      success,
      message: success
        ? `Copied ${format} to clipboard`
        : "Failed to copy to clipboard",
    };
  } else {
    const success = await downloadFile(content, filename, mimeType);
    const isWeb = Platform.OS === "web";
    return {
      success,
      message: success
        ? isWeb
          ? `Downloaded ${filename}`
          : `Copied to clipboard (download not available)`
        : "Failed to download file",
    };
  }
}
