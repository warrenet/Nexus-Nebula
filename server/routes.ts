import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import {
  executeMission,
  estimateCost,
  getSwarmStatus,
  getAllActiveSwarms,
} from "./services/swarm_manager";
import { getTrace, listTraces } from "./services/trace_store";
import { formatPrometheusMetrics } from "./services/metrics";
import type { MissionRequest } from "./types";

const wsClients: Set<WebSocket> = new Set();

function broadcastSwarmUpdate(traceId: string): void {
  const status = getSwarmStatus(traceId);
  if (!status) return;

  const message = JSON.stringify({
    type: "swarm_update",
    data: status,
  });

  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/mission/execute", async (req: Request, res: Response) => {
    try {
      const { mission, swarmSize, maxBudget } = req.body as MissionRequest;

      if (!mission || typeof mission !== "string" || mission.trim().length === 0) {
        res.status(400).json({ error: "Mission is required" });
        return;
      }

      if (mission.length > 10000) {
        res.status(400).json({ error: "Mission exceeds maximum length of 10000 characters" });
        return;
      }

      const trace = await executeMission(mission, swarmSize, maxBudget);

      res.json({
        traceId: trace.traceId,
        synthesis: trace.synthesisResult,
        iterations: trace.iterations,
        cost: trace.actualCost,
        durationMs: trace.durationMs,
        redTeamFlags: trace.redTeamFlags,
      });
    } catch (error) {
      console.error("Mission execution error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      
      if (message.includes("blocked by safety")) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes("exceeds budget")) {
        res.status(402).json({ error: message });
        return;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/mission/estimate", (req: Request, res: Response) => {
    try {
      const { mission, swarmSize } = req.body as { mission: string; swarmSize?: number };

      if (!mission || typeof mission !== "string") {
        res.status(400).json({ error: "Mission is required" });
        return;
      }

      const estimate = estimateCost(mission, swarmSize ?? 8);
      res.json(estimate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/mission/:traceId", (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      const trace = getTrace(traceId);

      if (!trace) {
        res.status(404).json({ error: "Trace not found" });
        return;
      }

      res.json(trace);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/mission/:traceId/status", (req: Request, res: Response) => {
    try {
      const { traceId } = req.params;
      const status = getSwarmStatus(traceId);

      if (!status) {
        const trace = getTrace(traceId);
        if (trace) {
          res.json({
            traceId: trace.traceId,
            status: trace.status,
            agents: [],
            currentIteration: trace.iterations.length,
            progress: trace.status === "completed" ? 100 : 0,
            message: trace.status === "completed" ? "Mission complete!" : trace.error || "Unknown",
          });
          return;
        }
        res.status(404).json({ error: "Mission not found" });
        return;
      }

      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/traces", (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = listTraces(limit, offset);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/swarms/active", (_req: Request, res: Response) => {
    try {
      const swarms = getAllActiveSwarms();
      res.json(swarms);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/metrics", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(formatPrometheusMetrics());
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    wsClients.add(ws);
    console.log("WebSocket client connected");

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "subscribe" && message.traceId) {
          const intervalId = setInterval(() => {
            const status = getSwarmStatus(message.traceId);
            if (status) {
              ws.send(JSON.stringify({ type: "swarm_update", data: status }));
              if (status.status === "completed" || status.status === "failed") {
                clearInterval(intervalId);
              }
            } else {
              clearInterval(intervalId);
            }
          }, 500);

          ws.on("close", () => clearInterval(intervalId));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      wsClients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
