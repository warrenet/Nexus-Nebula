import { randomUUID } from "crypto";
import type {
  SwarmConfig,
  AgentResponse,
  Iteration,
  Trace,
  CostEstimate,
  OpenRouterRequest,
  OpenRouterResponse,
  SwarmStatus,
  SwarmAgent,
  RedTeamFlag,
} from "../types";
import { scanContent, shouldBlockExecution, sanitizeForTrace } from "./redteam";
import { saveTrace } from "./trace_store";
import {
  incrementMissionsTotal,
  incrementMissionsSuccess,
  incrementMissionsFailed,
  setSwarmAgentsActive,
  addCost,
  incrementRedTeamFlags,
  recordRequestDuration,
} from "./metrics";
import { swarmEventEmitter } from "./SwarmEventEmitter";

const DEFAULT_CONFIG: SwarmConfig = {
  startAgents: 8,
  expandAgents: 12,
  maxAgents: 20,
  freeModel: "google/gemini-2.0-flash-exp:free",
  synthesisModel: "anthropic/claude-3.5-sonnet",
  fallbackModel: "openai/gpt-4o",
  maxBudget: 2.0,
  throttleMs: 6000,
  maxRetries: 5,
  baseBackoffMs: 1000,
  maxBackoffMs: 32000,
};

// Multi-turn critique configuration (2026 Sovereign Calibration)
const CONSENSUS_THRESHOLD = 0.92; // Sweet spot for speed vs rigor
const MAX_CRITIQUE_ITERATIONS = 5;
const REVIEWER_MODEL = "anthropic/claude-3.5-sonnet";

// Guardian Agent configuration - prevents hallucination loops and budget bleeding
const MIN_CONSENSUS_IMPROVEMENT = 0.02; // Minimum improvement required per iteration
const GUARDIAN_PATIENCE = 2; // Number of stagnant iterations before graceful fail

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "google/gemini-2.0-flash-exp:free": { input: 0, output: 0 },
  "anthropic/claude-3.5-sonnet": { input: 0.003, output: 0.015 },
  "openai/gpt-4o": { input: 0.005, output: 0.015 },
};

const activeSwarms: Map<string, SwarmStatus> = new Map();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateCost(
  mission: string,
  swarmSize: number,
  config: SwarmConfig = DEFAULT_CONFIG,
): CostEstimate {
  const systemPrompt = `You are a Bayesian reasoning agent in a swarm. Analyze the mission and provide your perspective with a confidence score (0-1).`;
  const inputTokens = estimateTokens(systemPrompt + mission);
  const expectedOutputTokens = 500;

  const swarmModelCost = MODEL_COSTS[config.freeModel] || {
    input: 0,
    output: 0,
  };
  const synthesisModelCost =
    MODEL_COSTS[config.synthesisModel] ||
    MODEL_COSTS["anthropic/claude-3.5-sonnet"];

  const swarmCost =
    swarmSize *
    ((inputTokens * swarmModelCost.input) / 1000 +
      (expectedOutputTokens * swarmModelCost.output) / 1000);

  const synthesisInputTokens = inputTokens + swarmSize * expectedOutputTokens;
  const synthesisOutputTokens = 1000;
  const synthesisCost =
    (synthesisInputTokens * synthesisModelCost.input) / 1000 +
    (synthesisOutputTokens * synthesisModelCost.output) / 1000;

  const totalCost = swarmCost + synthesisCost;

  return {
    inputTokens,
    expectedOutputTokens,
    swarmCost,
    synthesisCost,
    totalCost,
    withinBudget: totalCost <= config.maxBudget,
  };
}

async function callOpenRouter(
  request: OpenRouterRequest,
  retryCount = 0,
  config: SwarmConfig = DEFAULT_CONFIG,
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DEV_DOMAIN
            ? `https://${process.env.REPLIT_DEV_DOMAIN}`
            : "https://nexus-nebula.replit.app",
          "X-Title": "Nexus Nebula: The Rogue Bayes Engine",
        },
        body: JSON.stringify(request),
      },
    );

    if (response.status === 429) {
      if (retryCount >= config.maxRetries) {
        throw new Error("Rate limit exceeded after max retries");
      }
      const backoffMs = Math.min(
        config.baseBackoffMs * Math.pow(2, retryCount),
        config.maxBackoffMs,
      );
      console.log(
        `Rate limited, backing off for ${backoffMs}ms (retry ${retryCount + 1})`,
      );
      await sleep(backoffMs);
      return callOpenRouter(request, retryCount + 1, config);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorText}`,
      );
    }

    return (await response.json()) as OpenRouterResponse;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Rate limit")) {
      throw error;
    }
    if (retryCount < config.maxRetries) {
      const backoffMs = config.baseBackoffMs * Math.pow(2, retryCount);
      console.log(`Request failed, retrying in ${backoffMs}ms: ${error}`);
      await sleep(backoffMs);
      return callOpenRouter(request, retryCount + 1, config);
    }
    throw error;
  }
}

async function runSwarmAgent(
  agentId: string,
  mission: string,
  traceId: string,
  config: SwarmConfig = DEFAULT_CONFIG,
): Promise<AgentResponse> {
  const startTime = Date.now();

  const systemPrompt = `You are Agent ${agentId} in a Bayesian reasoning swarm called "Nexus Nebula".
Your task is to analyze the mission from your unique perspective and provide insights.

IMPORTANT: End your response with a confidence score in this exact format:
[CONFIDENCE: X.XX]

Where X.XX is a number between 0.00 and 1.00 representing how confident you are in your analysis.

Be concise but thorough. Explore angles that other agents might miss.`;

  try {
    const response = await callOpenRouter(
      {
        model: config.freeModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: mission },
        ],
        temperature: 0.8 + Math.random() * 0.4,
        max_tokens: 600,
      },
      0,
      config,
    );

    const content = response.choices[0]?.message?.content || "";
    const confidenceMatch = content.match(/\[CONFIDENCE:\s*([\d.]+)\]/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;

    const latencyMs = Date.now() - startTime;

    return {
      agentId,
      model: config.freeModel,
      response: content.replace(/\[CONFIDENCE:\s*[\d.]+\]/gi, "").trim(),
      confidence: Math.min(1, Math.max(0, confidence)),
      latencyMs,
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      agentId,
      model: config.freeModel,
      response: "",
      confidence: 0,
      latencyMs,
      tokens: { input: 0, output: 0 },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runSynthesis(
  mission: string,
  agentResponses: AgentResponse[],
  posteriorWeights: Record<string, number>,
  config: SwarmConfig = DEFAULT_CONFIG,
): Promise<{ content: string; tokens: { input: number; output: number } }> {
  const weightedResponses = agentResponses
    .filter((r) => !r.error)
    .map((r) => {
      const weight = posteriorWeights[r.agentId] || 0;
      return `[Agent ${r.agentId}] (Weight: ${weight.toFixed(3)}, Confidence: ${r.confidence.toFixed(2)})\n${r.response}`;
    })
    .join("\n\n---\n\n");

  const synthesisPrompt = `You are the Final Synthesis Agent for Nexus Nebula: The Rogue Bayes Engine.

You have received weighted responses from a swarm of Bayesian reasoning agents. Your task is to synthesize their insights into a coherent, high-quality response.

ORIGINAL MISSION:
${mission}

SWARM RESPONSES (weighted by posterior probability):
${weightedResponses}

SYNTHESIS INSTRUCTIONS:
1. Analyze all swarm responses, giving more weight to higher-weighted agents
2. Identify common themes and unique insights
3. Synthesize a coherent, comprehensive response
4. Be concise but thorough
5. If there are conflicting views, acknowledge them and provide reasoning for your synthesis

Provide your synthesis now:`;

  let model = config.synthesisModel;
  try {
    const response = await callOpenRouter(
      {
        model,
        messages: [{ role: "user", content: synthesisPrompt }],
        temperature: 0.7,
        max_tokens: 1500,
      },
      0,
      config,
    );

    return {
      content: response.choices[0]?.message?.content || "Synthesis failed",
      tokens: {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    console.log(
      `Synthesis failed with ${model}, trying fallback: ${config.fallbackModel}`,
    );
    model = config.fallbackModel;
    try {
      const response = await callOpenRouter(
        {
          model,
          messages: [{ role: "user", content: synthesisPrompt }],
          temperature: 0.7,
          max_tokens: 1500,
        },
        0,
        config,
      );

      return {
        content: response.choices[0]?.message?.content || "Synthesis failed",
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
        },
      };
    } catch (fallbackError) {
      throw new Error(
        `Both synthesis models failed: ${error}, ${fallbackError}`,
      );
    }
  }
}

/**
 * Run a critique round where the Reviewer model cross-examines agent responses
 * and refines their confidence scores based on logical consistency and coverage.
 */
async function runCritiqueRound(
  mission: string,
  agentResponses: AgentResponse[],
  critiqueIteration: number,
  traceId: string,
  config: SwarmConfig = DEFAULT_CONFIG,
): Promise<{
  critiquedResponses: AgentResponse[];
  consensusScore: number;
  critiqueTokens: { input: number; output: number };
}> {
  swarmEventEmitter.emitSwarmEvent({
    traceId,
    type: "critique_start",
    data: { iteration: critiqueIteration, agentCount: agentResponses.length },
    timestamp: Date.now(),
  });

  const responseSummaries = agentResponses
    .filter((r) => !r.error)
    .map(
      (r) =>
        `[${r.agentId}] (Confidence: ${r.confidence.toFixed(2)})\n${r.response.substring(0, 500)}${r.response.length > 500 ? "..." : ""}`,
    )
    .join("\n\n---\n\n");

  const critiquePrompt = `You are the Bayesian Reviewer for "Nexus Nebula: The Rogue Bayes Engine".

MISSION: ${mission}

SWARM RESPONSES (Critique Round ${critiqueIteration}):
${responseSummaries}

ANALYZE each response for:
1. Logical consistency - Does the reasoning hold?
2. Coverage - Are there blind spots or missing angles?
3. Originality - Does it add unique value beyond other responses?
4. Accuracy - Are claims well-supported?

For EACH agent, provide a refined confidence score (0.00-1.00) and brief justification.

FORMAT YOUR RESPONSE EXACTLY AS:
[AGENT_ID]: [NEW_SCORE] | [ONE_LINE_JUSTIFICATION]

Example:
agent-1: 0.85 | Strong logical flow but misses edge case X
agent-2: 0.72 | Good coverage but some circular reasoning

After all agents, provide:
[CONSENSUS]: [SCORE] | [OVERALL_ASSESSMENT]

Where CONSENSUS score is 0.00-1.00 indicating overall swarm agreement level.`;

  try {
    const response = await callOpenRouter(
      {
        model: REVIEWER_MODEL,
        messages: [{ role: "user", content: critiquePrompt }],
        temperature: 0.4,
        max_tokens: 800,
      },
      0,
      config,
    );

    const critiqueContent = response.choices[0]?.message?.content || "";
    const critiqueTokens = {
      input: response.usage?.prompt_tokens || 0,
      output: response.usage?.completion_tokens || 0,
    };

    // Stream the critique as a "thought"
    swarmEventEmitter.emitThought({
      agentId: "reviewer",
      traceId,
      type: "critique",
      content: critiqueContent,
      timestamp: Date.now(),
    });

    // Parse refined confidence scores
    const critiquedResponses = agentResponses.map((agent) => {
      const pattern = new RegExp(`${agent.agentId}:\\s*([\\d.]+)`, "i");
      const match = critiqueContent.match(pattern);
      const refinedConfidence = match ? parseFloat(match[1]) : agent.confidence;

      return {
        ...agent,
        confidence: Math.min(1, Math.max(0, refinedConfidence)),
      };
    });

    // Extract consensus score
    const consensusMatch = critiqueContent.match(/\[CONSENSUS\]:\s*([\d.]+)/i);
    const consensusScore = consensusMatch ? parseFloat(consensusMatch[1]) : 0;

    swarmEventEmitter.emitSwarmEvent({
      traceId,
      type: "critique_complete",
      data: { iteration: critiqueIteration, consensusScore },
      timestamp: Date.now(),
    });

    return {
      critiquedResponses,
      consensusScore: Math.min(1, Math.max(0, consensusScore)),
      critiqueTokens,
    };
  } catch (error) {
    console.error("Critique round failed:", error);
    // Fallback: calculate consensus from existing confidences
    const avgConfidence =
      agentResponses.reduce((sum, r) => sum + r.confidence, 0) /
      agentResponses.length;
    return {
      critiquedResponses: agentResponses,
      consensusScore: avgConfidence,
      critiqueTokens: { input: 0, output: 0 },
    };
  }
}

function calculatePosteriorWeights(
  responses: AgentResponse[],
): Record<string, number> {
  const validResponses = responses.filter((r) => !r.error && r.confidence > 0);
  if (validResponses.length === 0) {
    return {};
  }

  const totalConfidence = validResponses.reduce(
    (sum, r) => sum + r.confidence,
    0,
  );
  const weights: Record<string, number> = {};

  for (const response of validResponses) {
    const baseWeight = response.confidence / totalConfidence;
    const latencyFactor = 1 / (1 + response.latencyMs / 10000);
    weights[response.agentId] = baseWeight * (0.8 + 0.2 * latencyFactor);
  }

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  for (const agentId of Object.keys(weights)) {
    weights[agentId] = weights[agentId] / totalWeight;
  }

  return weights;
}

function calculateActualCost(
  agentResponses: AgentResponse[],
  synthesisTokens: { input: number; output: number },
  config: SwarmConfig = DEFAULT_CONFIG,
): number {
  let totalCost = 0;

  const swarmCost = MODEL_COSTS[config.freeModel] || { input: 0, output: 0 };
  for (const response of agentResponses) {
    totalCost +=
      (response.tokens.input * swarmCost.input) / 1000 +
      (response.tokens.output * swarmCost.output) / 1000;
  }

  const synthesisCost =
    MODEL_COSTS[config.synthesisModel] ||
    MODEL_COSTS["anthropic/claude-3.5-sonnet"];
  totalCost +=
    (synthesisTokens.input * synthesisCost.input) / 1000 +
    (synthesisTokens.output * synthesisCost.output) / 1000;

  return totalCost;
}

export function getSwarmStatus(traceId: string): SwarmStatus | null {
  return activeSwarms.get(traceId) || null;
}

export function getAllActiveSwarms(): SwarmStatus[] {
  return Array.from(activeSwarms.values());
}

export async function executeMission(
  mission: string,
  swarmSize?: number,
  maxBudget?: number,
): Promise<Trace> {
  const config: SwarmConfig = {
    ...DEFAULT_CONFIG,
    maxBudget: maxBudget ?? DEFAULT_CONFIG.maxBudget,
  };

  const agentCount = Math.min(
    Math.max(swarmSize ?? config.startAgents, 1),
    config.maxAgents,
  );

  const traceId = randomUUID();
  const startTime = Date.now();

  incrementMissionsTotal();

  const inputFlags = scanContent(mission, "input");
  if (inputFlags.length > 0) {
    incrementRedTeamFlags(inputFlags.length);
  }

  if (shouldBlockExecution(inputFlags)) {
    const trace: Trace = {
      traceId,
      timestamp: new Date().toISOString(),
      mission: sanitizeForTrace(mission),
      iterations: [],
      branchScores: {},
      redTeamFlags: inputFlags,
      finalPosteriorWeights: {},
      synthesisResult: "",
      costEstimate: 0,
      actualCost: 0,
      durationMs: Date.now() - startTime,
      status: "failed",
      error: "Mission blocked by safety system",
    };
    saveTrace(trace);
    incrementMissionsFailed();
    throw new Error(
      "Mission blocked by safety system due to content policy violation",
    );
  }

  const costEstimate = estimateCost(mission, agentCount, config);
  if (!costEstimate.withinBudget) {
    throw new Error(
      `Estimated cost $${costEstimate.totalCost.toFixed(4)} exceeds budget limit $${config.maxBudget}`,
    );
  }

  const trace: Trace = {
    traceId,
    timestamp: new Date().toISOString(),
    mission: sanitizeForTrace(mission),
    iterations: [],
    branchScores: {},
    redTeamFlags: inputFlags,
    finalPosteriorWeights: {},
    synthesisResult: "",
    costEstimate: costEstimate.totalCost,
    actualCost: 0,
    durationMs: 0,
    status: "running",
  };
  saveTrace(trace);

  const agents: SwarmAgent[] = [];
  for (let i = 0; i < agentCount; i++) {
    agents.push({
      id: `agent-${i + 1}`,
      status: "pending",
      model: config.freeModel,
    });
  }

  const swarmStatus: SwarmStatus = {
    traceId,
    status: "running",
    agents,
    currentIteration: 1,
    progress: 0,
    message: "Initializing swarm agents...",
  };
  activeSwarms.set(traceId, swarmStatus);
  setSwarmAgentsActive(activeSwarms.size);

  try {
    const agentPromises: Promise<AgentResponse>[] = [];

    for (let i = 0; i < agentCount; i++) {
      const agentId = `agent-${i + 1}`;

      swarmStatus.agents[i].status = "running";

      const delayedPromise = (async () => {
        if (i > 0) {
          await sleep(config.throttleMs * i);
        }
        const result = await runSwarmAgent(agentId, mission, traceId, config);

        const agentIndex = swarmStatus.agents.findIndex(
          (a) => a.id === agentId,
        );
        if (agentIndex !== -1) {
          swarmStatus.agents[agentIndex].status = result.error
            ? "failed"
            : "completed";
          swarmStatus.agents[agentIndex].confidence = result.confidence;
          swarmStatus.agents[agentIndex].latencyMs = result.latencyMs;
        }

        swarmStatus.progress = Math.floor(
          (swarmStatus.agents.filter(
            (a) => a.status === "completed" || a.status === "failed",
          ).length /
            agentCount) *
            80,
        );
        swarmStatus.message = `Processing agent ${i + 1} of ${agentCount}...`;

        return result;
      })();

      agentPromises.push(delayedPromise);
    }

    const agentResponses = await Promise.all(agentPromises);

    const outputFlags: RedTeamFlag[] = [];
    for (const response of agentResponses) {
      if (response.response) {
        const flags = scanContent(response.response, "output");
        outputFlags.push(...flags);
      }
    }
    if (outputFlags.length > 0) {
      incrementRedTeamFlags(outputFlags.length);
      trace.redTeamFlags.push(...outputFlags);
    }

    // Multi-turn critique loop - cross-examine until consensus threshold or max iterations
    let currentResponses = agentResponses;
    let consensusScore = 0;
    let critiqueIteration = 0;
    let totalCritiqueTokens = { input: 0, output: 0 };

    // Guardian Agent tracking - prevents hallucination loops and budget bleeding
    let previousConsensusScore = 0;
    let stagnantIterations = 0;
    let _guardianTriggered = false;

    swarmEventEmitter.emitSwarmEvent({
      traceId,
      type: "consensus_update",
      data: { iteration: 0, consensusScore: 0, threshold: CONSENSUS_THRESHOLD },
      timestamp: Date.now(),
    });

    while (
      consensusScore < CONSENSUS_THRESHOLD &&
      critiqueIteration < MAX_CRITIQUE_ITERATIONS
    ) {
      critiqueIteration++;
      swarmStatus.message = `Critique round ${critiqueIteration}/${MAX_CRITIQUE_ITERATIONS}...`;
      swarmStatus.progress =
        60 + Math.floor((critiqueIteration / MAX_CRITIQUE_ITERATIONS) * 20);

      const critiqueResult = await runCritiqueRound(
        mission,
        currentResponses,
        critiqueIteration,
        traceId,
        config,
      );

      currentResponses = critiqueResult.critiquedResponses;
      consensusScore = critiqueResult.consensusScore;
      totalCritiqueTokens.input += critiqueResult.critiqueTokens.input;
      totalCritiqueTokens.output += critiqueResult.critiqueTokens.output;

      // Guardian Agent: Check for stagnation (no meaningful improvement)
      const improvement = consensusScore - previousConsensusScore;
      if (improvement < MIN_CONSENSUS_IMPROVEMENT && critiqueIteration > 1) {
        stagnantIterations++;
        console.log(
          `Guardian Agent: Stagnant iteration ${stagnantIterations}/${GUARDIAN_PATIENCE} (improvement: ${improvement.toFixed(4)})`,
        );

        if (stagnantIterations >= GUARDIAN_PATIENCE) {
          console.log(
            `Guardian Agent: Triggering graceful fail - hallucination loop detected. Saving budget.`,
          );
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _guardianTriggered = true;
          swarmEventEmitter.emitSwarmEvent({
            traceId,
            type: "consensus_update",
            data: {
              iteration: critiqueIteration,
              consensusScore,
              threshold: CONSENSUS_THRESHOLD,
              guardianFail: true,
            },
            timestamp: Date.now(),
          });
          break; // Exit early to save budget
        }
      } else {
        stagnantIterations = 0; // Reset if we made progress
      }
      previousConsensusScore = consensusScore;

      // Store this iteration in the trace
      const posteriorWeights = calculatePosteriorWeights(currentResponses);
      const iteration: Iteration = {
        iterationId: critiqueIteration,
        agentResponses: currentResponses,
        consensusScore,
        timestamp: new Date().toISOString(),
      };
      trace.iterations.push(iteration);
      trace.finalPosteriorWeights = posteriorWeights;

      swarmEventEmitter.emitSwarmEvent({
        traceId,
        type: "consensus_update",
        data: {
          iteration: critiqueIteration,
          consensusScore,
          threshold: CONSENSUS_THRESHOLD,
        },
        timestamp: Date.now(),
      });

      console.log(
        `Critique round ${critiqueIteration}: consensus = ${consensusScore.toFixed(3)}`,
      );

      if (consensusScore >= CONSENSUS_THRESHOLD) {
        console.log(
          `Consensus threshold ${CONSENSUS_THRESHOLD} reached after ${critiqueIteration} rounds`,
        );
        break;
      }
    }

    const finalPosteriorWeights = calculatePosteriorWeights(currentResponses);
    trace.finalPosteriorWeights = finalPosteriorWeights;

    swarmStatus.status = "synthesizing";
    swarmStatus.progress = 85;
    swarmStatus.message = "Synthesizing swarm insights...";

    const synthesis = await runSynthesis(
      mission,
      currentResponses,
      finalPosteriorWeights,
      config,
    );

    const synthesisFlags = scanContent(synthesis.content, "synthesis");
    if (synthesisFlags.length > 0) {
      incrementRedTeamFlags(synthesisFlags.length);
      trace.redTeamFlags.push(...synthesisFlags);
    }

    // Include critique tokens in cost calculation
    const combinedSynthesisTokens = {
      input: synthesis.tokens.input + totalCritiqueTokens.input,
      output: synthesis.tokens.output + totalCritiqueTokens.output,
    };
    const actualCost = calculateActualCost(
      currentResponses,
      combinedSynthesisTokens,
      config,
    );
    addCost(actualCost);

    trace.synthesisResult = sanitizeForTrace(synthesis.content);
    trace.actualCost = actualCost;
    trace.durationMs = Date.now() - startTime;
    trace.status = "completed";

    saveTrace(trace);
    recordRequestDuration(trace.durationMs);
    incrementMissionsSuccess();

    swarmStatus.status = "completed";
    swarmStatus.progress = 100;
    swarmStatus.message = "Mission complete!";

    setTimeout(() => {
      activeSwarms.delete(traceId);
      setSwarmAgentsActive(activeSwarms.size);
    }, 30000);

    return trace;
  } catch (error) {
    trace.status = "failed";
    trace.error = error instanceof Error ? error.message : "Unknown error";
    trace.durationMs = Date.now() - startTime;
    saveTrace(trace);

    swarmStatus.status = "failed";
    swarmStatus.message = trace.error;

    incrementMissionsFailed();
    activeSwarms.delete(traceId);
    setSwarmAgentsActive(activeSwarms.size);

    throw error;
  }
}
