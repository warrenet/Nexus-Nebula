import type { RedTeamFlag } from '../types';
import { randomUUID } from 'crypto';

const BANNED_PATTERNS = [
  { pattern: /\b(kill|murder|assassinate)\s+(someone|people|person|him|her|them)\b/gi, category: 'violence', severity: 'HIGH' as const },
  { pattern: /\b(make|create|build)\s+(a\s+)?(bomb|explosive|weapon)\b/gi, category: 'violence', severity: 'CRITICAL' as const },
  { pattern: /\b(hack|breach|exploit)\s+(into\s+)?(bank|government|security)\b/gi, category: 'illegal', severity: 'HIGH' as const },
  { pattern: /\b(steal|rob|theft)\s+(money|data|identity)\b/gi, category: 'illegal', severity: 'HIGH' as const },
  { pattern: /\b(ssn|social\s+security|credit\s+card\s+number|password)\s*[:=]\s*\d+/gi, category: 'pii', severity: 'MEDIUM' as const },
  { pattern: /\b(manipulate|deceive|trick)\s+(into\s+)?(giving|sending|transferring)\b/gi, category: 'manipulation', severity: 'MEDIUM' as const },
  { pattern: /\b(self-harm|suicide|end\s+my\s+life)\b/gi, category: 'harm', severity: 'CRITICAL' as const },
  { pattern: /\b(child|minor)\s+(abuse|exploitation|pornography)\b/gi, category: 'csam', severity: 'CRITICAL' as const },
];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  violence: 'Content related to violence or harm',
  illegal: 'Content related to illegal activities',
  pii: 'Personal identifiable information exposure',
  manipulation: 'Deceptive or manipulative content',
  harm: 'Self-harm or suicide related content',
  csam: 'Child safety violation',
};

export function scanContent(
  content: string,
  source: 'input' | 'output' | 'synthesis'
): RedTeamFlag[] {
  const flags: RedTeamFlag[] = [];

  for (const { pattern, category, severity } of BANNED_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      flags.push({
        flagId: randomUUID(),
        severity,
        categories: [category],
        explanation: `${CATEGORY_DESCRIPTIONS[category] || 'Flagged content'}: "${matches[0]}"`,
        source,
        content: matches[0],
      });
    }
  }

  return flags;
}

export function getHighestSeverity(flags: RedTeamFlag[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null {
  if (flags.length === 0) return null;
  
  const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  let highest = 0;
  
  for (const flag of flags) {
    const index = severityOrder.indexOf(flag.severity);
    if (index > highest) highest = index;
  }
  
  return severityOrder[highest];
}

export function shouldBlockExecution(flags: RedTeamFlag[]): boolean {
  const highest = getHighestSeverity(flags);
  return highest === 'CRITICAL' || highest === 'HIGH';
}

export function sanitizeForTrace(content: string): string {
  let sanitized = content;
  
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  sanitized = sanitized.replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CC_REDACTED]');
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  sanitized = sanitized.replace(/\b\d{10}\b/g, '[PHONE_REDACTED]');
  
  return sanitized;
}
