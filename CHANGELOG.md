# Changelog

All notable changes to Nexus Nebula will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Vitest test framework with 15 critical path tests
- GitHub Actions CI pipeline (typecheck, lint, test, build)
- Husky pre-commit hooks with lint-staged
- GlowButton component with haptic feedback and gradient glow
- Inter font via Google Fonts for modern typography
- CODEOWNERS file for review discipline
- PR template with quality checklist
- Issue templates (bug report, feature request)
- Dependabot configuration for dependency updates
- Doctor script for environment sanity checks
- Smoke test script for deployment verification
- SECURITY.md with trust boundaries documentation
- This CHANGELOG.md file

### Changed

- Wired Zod validators to all API routes (previously unused)
- Updated production URL to nexus-nebula-one.vercel.app
- Improved theme typography with Inter font priority

### Fixed

- Server error handler no longer throws after response (crash bug)
- Fixed lint/formatting issues across codebase

### Security

- All 5 API endpoints now validate input with Zod schemas
- CSP headers enforced via vercel.json
- Rate limiting active on all routes (stricter on /api/mission/execute)

## [1.0.0] - 2026-01-15

### Added

- Initial release of Nexus Nebula
- Bayesian swarm orchestration with multi-agent AI
- React Native + Expo frontend with PWA support
- Express.js backend with WebSocket real-time updates
- Smart tiering (free local tasks vs paid swarm missions)
- Cost estimation and budget controls
- Full trace logging and observability
- Red team content safety scanning
- GPU-accelerated nebula particle background
- Decision tree visualization with ReactFlow
