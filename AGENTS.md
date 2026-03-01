# AGENTS.md — Nexus Nebula
*Deploy to: project root of Nexus Nebula repo*
*Last updated: S76 | 2026-02-28*

---

## What This Is

Nexus Nebula is a Bayesian swarm intelligence web app — multiple Gemini agent instances run in parallel, their outputs synthesized by Claude into a unified response. Deployed at nexus-nebula-one.vercel.app. v1.0.0.

---

## System Architecture

```
Browser client (React + Vite)
    ↓
API layer
    ↓
Gemini swarm (parallel agent instances)
    ↓
Claude synthesis layer
    ↓
Response to client
```

---

## Stack

- **Frontend:** React + Vite + TypeScript
- **Deployment:** Vercel
- **AI:** Gemini (swarm) + Claude (synthesis)

---

## Rules

**Before declaring done:**
1. Run `npm run build` — zero TypeScript errors, zero build failures
2. Run `npm test` (if tests exist)
3. Verify no broken imports: `npx tsc --noEmit`
4. Check Vercel preview deploy builds cleanly

**Never:**
- Change the public component API without explicit instruction
- Add server-side state — this is a stateless frontend architecture
- Introduce new dependencies without explicit approval (keep bundle size in check)
- Break the swarm coordination logic without a full test pass

**Always:**
- Create rollback tag before major changes: `git tag pre-codex-$(date +%s)`
- Keep TypeScript strict mode satisfied
- No `any` types without explicit justification

---

## Commit Message Format

```
fix: <description>
feat: <description>
refactor: <description>
```

---

## Test Command

```bash
npm run build     # must succeed
npx tsc --noEmit  # zero errors
npm test          # if test suite exists
```

---

## Coding Standards

- TypeScript strict mode — no implicit `any`
- React functional components only — no class components
- Props typed explicitly — no implicit prop types
- No direct DOM manipulation — React state + effects only
- Async patterns: `async/await` throughout, no `.then()` chains

---

## Protected Files

- `vercel.json` — deployment config (do not modify without explicit instruction)
- `.env` / API key config — never touch, never log

---

*This file is read by Codex before every task. Keep it current.*