export type ModelTier = "free" | "balanced" | "premium";

export interface SwarmConfig {
  startAgents: number;
  expandAgents: number;
  maxAgents: number;
  freeModel: string;
  synthesisModel: string;
  fallbackModel: string;
  maxBudget: number;
  throttleMs: number;
  maxRetries: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
}

export interface AgentResponse {
  agentId: string;
  model: string;
  response: string;
  confidence: number;
  latencyMs: number;
  tokens: {
    input: number;
    output: number;
  };
  error?: string;
}

export interface Iteration {
  iterationId: number;
  agentResponses: AgentResponse[];
  consensusScore: number;
  timestamp: string;
}

export interface RedTeamFlag {
  flagId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  categories: string[];
  explanation: string;
  source: "input" | "output" | "synthesis";
  content: string;
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
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
}

export interface MissionRequest {
  mission: string;
  swarmSize?: number;
  maxBudget?: number;
  modelTier?: ModelTier;
}

export interface MissionResponse {
  traceId: string;
  synthesis: string;
  iterations: Iteration[];
  cost: number;
  durationMs: number;
  redTeamFlags: RedTeamFlag[];
}

export interface CostEstimate {
  inputTokens: number;
  expectedOutputTokens: number;
  swarmCost: number;
  synthesisCost: number;
  totalCost: number;
  withinBudget: boolean;
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SwarmAgent {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  confidence?: number;
  response?: string;
  latencyMs?: number;
}

export interface SwarmStatus {
  traceId: string;
  status: "pending" | "running" | "synthesizing" | "completed" | "failed";
  agents: SwarmAgent[];
  currentIteration: number;
  progress: number;
  message: string;
}

export interface MetricsData {
  missionsTotal: number;
  missionsSuccess: number;
  missionsFailed: number;
  swarmAgentsActive: number;
  costTotal: number;
  redTeamFlagsTotal: number;
  requestDurations: number[];
}
