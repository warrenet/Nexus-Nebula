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
import { swarmEventEmitter } from "./services/SwarmEventEmitter";
import { missionRateLimiter } from "./middleware/rateLimiter";
import {
  MissionRequestSchema,
  EstimateRequestSchema,
  TraceIdSchema,
  PaginationSchema,
  validateBody,
  validateParams,
  validateQuery,
} from "./validators";

const wsClients: Set<WebSocket> = new Set();

// Map to track active subscriptions for cleanup
const clientSubscriptions: Map<WebSocket, (() => void)[]> = new Map();

// Broadcast function available for future real-time push updates
// function broadcastSwarmUpdate(traceId: string): void { ... }

export async function registerRoutes(app: Express): Promise<Server> {
  // Import Smart Tiering for Task vs Mission classification
  const { classifyInput, executeLocalTask } = await import(
    "./services/smart_tiering"
  );

  app.post(
    "/api/mission/execute",
    missionRateLimiter,
    async (req: Request, res: Response) => {
      try {
        // Validate request body with Zod schema
        const validation = validateBody(MissionRequestSchema, req.body);
        if (!validation.success) {
          res.status(400).json({ error: validation.error });
          return;
        }
        const { mission, swarmSize, maxBudget } = validation.data;

        // Smart Tiering: Classify as Task (free) or Mission (Bayesian Swarm)
        const classification = classifyInput(mission);
        console.log(
          `Smart Tiering: ${classification.tier} (${(classification.confidence * 100).toFixed(0)}% - ${classification.reason})`,
        );

        if (classification.tier === "task" && classification.localHandler) {
          // Execute locally for $0 cost
          const content = req.body.content || mission;
          const result = executeLocalTask(mission, content);

          res.json({
            traceId: `task-${Date.now()}`,
            synthesis: result,
            iterations: [],
            cost: 0,
            durationMs: 10,
            redTeamFlags: [],
            tier: "task",
            tierReason: classification.reason,
          });
          return;
        }

        // Mission path: Use Bayesian Swarm
        const trace = await executeMission(mission, swarmSize, maxBudget);

        res.json({
          traceId: trace.traceId,
          synthesis: trace.synthesisResult,
          iterations: trace.iterations,
          cost: trace.actualCost,
          durationMs: trace.durationMs,
          redTeamFlags: trace.redTeamFlags,
          tier: "mission",
          tierReason: classification.reason,
        });
      } catch (error) {
        console.error("Mission execution error:", error);
        const message =
          error instanceof Error ? error.message : "Unknown error";

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
    },
  );

  app.post("/api/mission/estimate", (req: Request, res: Response) => {
    try {
      const validation = validateBody(EstimateRequestSchema, req.body);
      if (!validation.success) {
        res.status(400).json({ error: validation.error });
        return;
      }
      const { mission, swarmSize } = validation.data;

      const estimate = estimateCost(mission, swarmSize ?? 8);
      res.json(estimate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/mission/:traceId", (req: Request, res: Response) => {
    try {
      const paramValidation = validateParams(TraceIdSchema, req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: paramValidation.error });
        return;
      }
      const { traceId } = paramValidation.data;
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
      const paramValidation = validateParams(TraceIdSchema, req.params);
      if (!paramValidation.success) {
        res.status(400).json({ error: paramValidation.error });
        return;
      }
      const { traceId } = paramValidation.data;
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
            message:
              trace.status === "completed"
                ? "Mission complete!"
                : trace.error || "Unknown",
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
      const queryValidation = validateQuery(PaginationSchema, req.query);
      if (!queryValidation.success) {
        res.status(400).json({ error: queryValidation.error });
        return;
      }
      const { limit, offset } = queryValidation.data;

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
    clientSubscriptions.set(ws, []);
    console.log("WebSocket client connected");

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const subscriptions = clientSubscriptions.get(ws) || [];

        // Legacy status polling subscription
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

        // Real-time thought streaming subscription
        if (message.type === "stream_thoughts" && message.traceId) {
          const unsubscribe = swarmEventEmitter.subscribeToThoughts(
            message.traceId,
            (thought) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "agent_thought",
                    agentId: thought.agentId,
                    thoughtType: thought.type,
                    content: thought.content,
                    confidence: thought.confidence,
                    timestamp: thought.timestamp,
                  }),
                );
              }
            },
          );
          subscriptions.push(unsubscribe);
          clientSubscriptions.set(ws, subscriptions);
          console.log(
            `Client subscribed to thoughts for trace: ${message.traceId}`,
          );
        }

        // Real-time swarm event streaming
        if (message.type === "stream_events" && message.traceId) {
          const unsubscribe = swarmEventEmitter.subscribeToTrace(
            message.traceId,
            (event) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: "swarm_event",
                    eventType: event.type,
                    data: event.data,
                    timestamp: event.timestamp,
                  }),
                );
              }
            },
          );
          subscriptions.push(unsubscribe);
          clientSubscriptions.set(ws, subscriptions);
          console.log(
            `Client subscribed to events for trace: ${message.traceId}`,
          );
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      // Cleanup all subscriptions for this client
      const subscriptions = clientSubscriptions.get(ws) || [];
      for (const unsubscribe of subscriptions) {
        unsubscribe();
      }
      clientSubscriptions.delete(ws);
      wsClients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
      const subscriptions = clientSubscriptions.get(ws) || [];
      for (const unsubscribe of subscriptions) {
        unsubscribe();
      }
      clientSubscriptions.delete(ws);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
