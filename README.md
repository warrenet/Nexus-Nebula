# 🌌 Nexus Nebula: The Rogue Bayes Engine

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![PWA](https://img.shields.io/badge/PWA-Ready-green)

**A whimsical yet rigorous AI task orchestrator leveraging Bayesian swarm intelligence**

[Live Demo](https://nexus-nebula.vercel.app) • [Documentation](./SYSTEM_DESIGN.md) • [API Reference](#api-reference)

</div>

---

## ✨ Features

🧠 **Bayesian Swarm Orchestration** — Multiple AI agents work in parallel with dynamic confidence scoring

💰 **Budget-Aware Execution** — Preflight cost estimation with hard budget limits

🔍 **Full Observability** — Complete trace logging for every execution

🛡️ **Safety-First Design** — Integrated red team content flagging with severity levels

📱 **PWA Ready** — Install on mobile, works offline

🎨 **Liquid Glass UI** — Dark mode, frosted glass aesthetics with animated mesh gradients

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key

### Installation

```bash
# Clone the repository
git clone https://github.com/warrenet/Nexus-Nebula.git
cd Nexus-Nebula

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local

# Start development
npm run server:dev    # Terminal 1: Start backend
npm run expo:dev      # Terminal 2: Start frontend
```

### Production Build

```bash
# Build for web deployment
npx expo export -p web

# Deploy to Vercel
vercel --prod
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│          FRONTEND (Expo PWA + React Native)     │
│   Mission Tab │ Focus Tab │ Trace Tab           │
└────────────────────┬────────────────────────────┘
                     │ REST API + WebSocket
┌────────────────────┴────────────────────────────┐
│              BACKEND (Express.js)               │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Swarm    │ │ Red Team │ │ Trace Store  │   │
│  │  Manager   │ │ Safety   │ │   (JSON)     │   │
│  └────────────┘ └──────────┘ └──────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
           OpenRouter API Integration
```

---

## 📡 API Reference

### Execute Mission

```http
POST /api/mission/execute
Content-Type: application/json

{
  "mission": "Analyze the strategic implications of...",
  "swarmSize": 8,
  "maxBudget": 2.00
}
```

### Get Traces

```http
GET /api/traces?limit=10&offset=0
```

### Prometheus Metrics

```http
GET /metrics
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native + Expo SDK 54 |
| Styling | Liquid Glass UI with React Three Fiber |
| State | TanStack React Query |
| Backend | Express.js + TypeScript |
| AI Models | OpenRouter (Gemini, Claude, GPT-4) |
| Deployment | Vercel (PWA) |

---

## 🛡️ Security Features

- **CSP Headers** — Strict Content Security Policy
- **Rate Limiting** — Sliding window with IP tracking
- **Input Validation** — Zod schemas on all endpoints
- **Red Team Scanning** — Automated content safety checks
- **Budget Guards** — Hard limits prevent runaway costs

---

## 📊 Metrics & Observability

Prometheus-compatible metrics available at `/metrics`:

- `nexus_missions_total` — Total missions executed
- `nexus_swarm_agents_active` — Active agents
- `nexus_cost_total` — Cumulative API costs
- `nexus_red_team_flags_total` — Safety flags triggered

---

## 🤝 Contributing

Contributions welcome! Please read the [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) for architecture details.

---

## 📄 License

MIT © 2026 Warrenet

---

<div align="center">

**Built with 🧠 by the Nexus Nebula team**

</div>
