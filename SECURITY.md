# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to the repository owner
3. Include steps to reproduce the vulnerability
4. Allow 48 hours for initial response

## Trust Boundaries

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (Untrusted)                    │
│  - Expo/React Native app                                 │
│  - All user input is untrusted                          │
│  - No secrets stored in client bundles                  │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS
                          │ Rate Limited
                          ▼
┌──────────────────────────────────────────────────────────┐
│                    SERVER (Trusted)                      │
│  - Express.js with validation middleware                 │
│  - Zod validates ALL request bodies                     │
│  - Rate limiting per IP                                  │
│  - CSP headers enforced                                  │
│  - XSS input sanitization                               │
└─────────────────────────┬────────────────────────────────┘
                          │ Authenticated
                          ▼
┌──────────────────────────────────────────────────────────┐
│               EXTERNAL APIs (Semi-Trusted)               │
│  - OpenRouter API (requires API key)                    │
│  - All responses are validated and sanitized            │
│  - Red team scanning on AI outputs                      │
└──────────────────────────────────────────────────────────┘
```

## Security Controls

### Input Validation

- **Zod schemas** validate all API request bodies
- **XSS patterns** detected and rejected (see `server/validators.ts`)
- **Max length limits** on all string inputs (10,000 chars)

### Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Mission execution: 10 requests per 15 minutes per IP
- See `server/middleware/rateLimiter.ts`

### Content Security Policy

Headers set in `vercel.json`:

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
- `connect-src 'self' https://openrouter.ai wss: ws:`
- `frame-ancestors 'none'`

### AI Content Safety

- Red team scanner checks all AI outputs (`server/services/redteam.ts`)
- Severity levels: LOW, MEDIUM, HIGH, CRITICAL
- HIGH+ severity blocks execution

### Secret Management

- All secrets via environment variables
- Never committed to repo (check `.gitignore`)
- Required: `OPENROUTER_API_KEY`

## Verification

Run security-related tests:

```bash
npm test -- --grep "security\|validation\|rate"
```

Check CSP headers:

```bash
curl -I https://nexus-nebula-one.vercel.app | grep -i security
```
