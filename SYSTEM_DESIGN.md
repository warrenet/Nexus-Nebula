# Nexus Nebula: The Rogue Bayes Engine

## System Design Document

**Public Identity**: Nexus Nebula: The Rogue Bayes Engine — Warrenet's Whimsy Engine  
**Technical Identity**: Hierarchical Bayesian Chain-of-Thought Synthesis — Warrenet Edition  
**Version**: 1.0.0  
**Last Updated**: 2026-01-09

---

## 1. Executive Summary

Nexus Nebula is a whimsical yet rigorous task orchestrator that leverages Bayesian swarm intelligence to synthesize high-quality reasoning chains. The system deploys multiple AI agents in parallel, aggregates their outputs using Bayesian posterior weighting, and produces a final synthesis through a senior reviewer model.

### Core Capabilities
- **Bayesian Swarm Orchestration**: Multiple AI agents working in parallel with dynamic confidence scoring
- **Budget-Aware Execution**: Preflight cost estimation with hard budget limits
- **Full Observability**: Complete trace logging for every execution
- **Safety-First Design**: Integrated red team content flagging
- **Liquid Glass UI**: Dark mode, frosted glass aesthetics with animated mesh gradients

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Expo PWA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Mission    │  │    Focus     │  │    Trace     │           │
│  │    Tab       │  │     Tab      │  │     Tab      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                    Liquid Glass 2.0 UI                           │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + WebSocket
┌────────────────────────────┴────────────────────────────────────┐
│                      BACKEND (Express.js)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API Layer (/api)                       │   │
│  │   POST /api/mission/execute                               │   │
│  │   GET  /api/mission/:traceId                              │   │
│  │   GET  /api/traces                                        │   │
│  │   GET  /metrics (Prometheus)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                   Services Layer                           │  │
│  │  ┌────────────────┐ ┌────────────────┐ ┌───────────────┐  │  │
│  │  │ Swarm Manager  │ │   Red Team     │ │ Trace Store   │  │  │
│  │  │   - Budget     │ │   - Safety     │ │   - JSON      │  │  │
│  │  │   - Throttle   │ │   - Flagging   │ │   - Persist   │  │  │
│  │  │   - Backoff    │ │                │ │               │  │  │
│  │  └────────────────┘ └────────────────┘ └───────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                   OpenRouter Integration                   │  │
│  │   - google/gemini-2.0-flash-exp:free (Swarm Agents)       │  │
│  │   - anthropic/claude-3-5-sonnet (Final Synthesis)         │  │
│  │   - openai/gpt-4o (Fallback)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  backend/traces │
                    │   (JSON Files)  │
                    └─────────────────┘
```

---

## 3. Component Specifications

### 3.1 Swarm Manager (`backend/swarm_manager.ts`)

The brain of the system - orchestrates parallel AI agent execution.

**Configuration**:
- **Swarm Tiers**: Start with 8 agents, expand to 12, cap at 20
- **Free Model**: `google/gemini-2.0-flash-exp:free`
- **Synthesis Model**: `anthropic/claude-3-5-sonnet` (fallback: `openai/gpt-4o`)
- **Budget Limit**: $1.25 per request
- **Throttle**: 6-second delay for free models
- **Retry Strategy**: Exponential backoff for 429 errors (base: 1s, max: 32s)

**Execution Flow**:
1. Receive mission input
2. Run preflight cost estimation
3. Spawn swarm agents (parallel execution with throttling)
4. Collect responses and calculate Bayesian posterior weights
5. Pass weighted results to synthesis model
6. Return final output with full trace

### 3.2 Red Team Service (`backend/services/redteam.ts`)

Safety layer that scans all inputs and outputs for harmful content.

**Flagging Categories**:
- Violence and harm
- Illegal activities
- Personal information exposure
- Manipulation/deception patterns

**Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL

### 3.3 Trace Store (`backend/services/trace_store.ts`)

Persistent logging for observability and Antigravity handoff.

**Trace Structure**:
```typescript
interface Trace {
  traceId: string;
  timestamp: string;
  mission: string;
  iterations: Iteration[];
  branch_scores: Record<string, number>;
  red_team_flags: RedTeamFlag[];
  final_posterior_weights: Record<string, number>;
  synthesis_result: string;
  cost_estimate: number;
  actual_cost: number;
  duration_ms: number;
}
```

### 3.4 Metrics Endpoint (`/metrics`)

Prometheus-compatible metrics for monitoring.

**Exposed Metrics**:
- `nexus_missions_total` - Total missions executed
- `nexus_swarm_agents_active` - Currently active swarm agents
- `nexus_cost_total` - Cumulative API costs
- `nexus_red_team_flags_total` - Safety flags triggered
- `nexus_request_duration_seconds` - Request latency histogram

---

## 4. API Specification

### POST /api/mission/execute
Execute a new mission through the swarm.

**Request**:
```json
{
  "mission": "string (required)",
  "swarm_size": "number (optional, default: 8)",
  "max_budget": "number (optional, default: 1.25)"
}
```

**Response**:
```json
{
  "traceId": "string",
  "synthesis": "string",
  "iterations": [...],
  "cost": "number",
  "duration_ms": "number",
  "red_team_flags": [...]
}
```

### GET /api/mission/:traceId
Retrieve a specific mission trace.

### GET /api/traces
List all available traces (paginated).

### GET /metrics
Prometheus metrics endpoint.

---

## 5. UI/UX Specification

### Layout Strategy
- **Desktop**: Side-by-side dual pane (Input | Trace)
- **Mobile**: Bottom-sheet tab navigation (3 tabs)

### Tabs
1. **Mission**: Input textarea, budget indicator, execute button
2. **Focus**: Active swarm agents, confidence scores, progress
3. **Trace**: Timeline visualization, expandable nodes, JSON viewer

### Aesthetic: Liquid Glass 2.0
- Dark mode (#0a0a0f background)
- Backdrop blur (24px)
- Animated SVG mesh gradients
- 1px specular highlights
- Spring animations for node-based logic

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter`: Execute mission

---

## 6. Security Considerations

1. **API Key Protection**: OpenRouter key stored in environment variables only
2. **Content Safety**: All I/O passes through red team service
3. **Budget Guard**: Hard limit prevents runaway costs
4. **Trace Sanitization**: PII scrubbed before persistence

---

## 7. Deployment Notes

- Express backend runs on port 5000
- Expo frontend accessible via PWA on port 8081
- Traces persisted to `backend/traces/` directory
- Service worker provides offline resilience for PWA

---

## 8. Antigravity Handoff Checklist

- [ ] All traces contain complete iteration data
- [ ] Red team flags are logged with severity
- [ ] Posterior weights are calculated and stored
- [ ] Cost tracking is accurate
- [ ] Metrics endpoint is exposed
- [ ] TypeScript strict mode enabled
- [ ] No `any` types in codebase
