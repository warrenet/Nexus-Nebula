# Nexus Nebula: The Rogue Bayes Engine

## Overview

Nexus Nebula is a Bayesian swarm intelligence task orchestrator that deploys multiple AI agents in parallel to synthesize high-quality reasoning chains. The system combines whimsical "Liquid Glass" aesthetics with rigorous computational methodology, featuring budget-aware execution, full trace logging, and integrated safety content flagging.

The application is a mobile-first Progressive Web App built with Expo (React Native) for the frontend and Express.js for the backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81.5, configured as a PWA with single-page output
- **Navigation**: React Navigation with native stack and bottom tab navigators
- **State Management**: TanStack React Query for server state
- **UI Pattern**: "Liquid Glass 2.0" dark theme with frosted glass morphism effects using expo-blur and expo-linear-gradient
- **Animations**: React Native Reanimated for performant gesture and animation handling
- **Path Aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`

### Mobile Tab Structure
Three bottom tabs for the mobile interface:
1. **Mission Tab** - Input and execute AI tasks with cost estimation
2. **Focus Tab** - Real-time swarm agent status and progress monitoring
3. **Trace Tab** - Visual reasoning chain explorer with iteration history

### Backend Architecture
- **Framework**: Express.js with TypeScript, compiled via tsx for development and esbuild for production
- **Real-time Communication**: WebSocket server (ws) for live swarm status updates
- **API Design**: RESTful endpoints under `/api/` prefix with Prometheus metrics at `/metrics`

### Core Services
1. **Swarm Manager** (`server/services/swarm_manager.ts`): Orchestrates parallel AI agents with tiered model architecture
   - Tier 1: Free swarm agents (8-20 instances) using Gemini Flash
   - Tier 2: Synthesis agent using Claude 3.5 Sonnet with GPT-4o fallback
2. **Red Team** (`server/services/redteam.ts`): Content safety scanning with severity-based flagging
3. **Trace Store** (`server/services/trace_store.ts`): File-based JSON storage for execution traces in `backend/traces/`
4. **Metrics** (`server/services/metrics.ts`): Prometheus-compatible metrics collection

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM (schema in `shared/schema.ts`)
- **Trace Storage**: Local filesystem JSON files for AI execution traces
- **In-Memory**: MemStorage class for user data (currently not using database)

### Build Pipeline
- **Development**: Parallel Expo dev server and Express API with proxy middleware
- **Production**: Static Expo build served by Express, with esbuild-compiled server

## External Dependencies

### AI/LLM Services
- **OpenRouter API**: Primary gateway for AI model access (requires `OPENROUTER_API_KEY`)
  - Google Gemini 2.0 Flash (free tier) for swarm agents
  - Anthropic Claude 3.5 Sonnet for synthesis
  - OpenAI GPT-4o as fallback

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable, managed with Drizzle ORM and drizzle-kit for migrations

### Key npm Dependencies
- `expo-blur`, `expo-glass-effect`, `expo-linear-gradient` - Glass morphism UI effects
- `react-native-reanimated`, `react-native-gesture-handler` - Animations and gestures
- `@tanstack/react-query` - API state management
- `drizzle-orm`, `drizzle-zod` - Database ORM with Zod schema validation
- `ws` - WebSocket server for real-time updates
- `pg` - PostgreSQL client

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - API key for AI model access
- `EXPO_PUBLIC_DOMAIN` - Public domain for API requests
- `REPLIT_DEV_DOMAIN` - Development domain (Replit-specific)

## Recent Changes (Jan 2026)

### Frontend Implementation
- Created complete 3-tab mobile interface with Liquid Glass 2.0 design
- **MissionScreen**: Glass textarea, cost estimation, pulse animation on execute button
- **FocusScreen**: Swarm agent cards with shimmer effects, progress bar, real-time status
- **TraceScreen**: Timeline view with expandable trace details, posterior weight visualization
- **GlassCard component**: Reusable glass morphism container with BlurView on iOS
- **Theme colors**: Dark mode (#0a0a0f background), purple/blue gradients, glass borders

### Animation Fixes
- Added proper cleanup for Animated.loop effects to prevent memory leaks
- Both pulse and shimmer animations now stop correctly on state changes

### Assets Generated
- empty-mission.png, swarm-active.png, empty-trace.png for empty states