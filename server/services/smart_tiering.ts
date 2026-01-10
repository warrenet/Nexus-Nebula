/**
 * Smart Tiering Service - 2026 Sovereign Specification
 * 
 * Implements Task vs Mission logic:
 * - Simple tasks (text cleans) use local regex/edge logic ($0 cost)
 * - Complex missions trigger the Bayesian Swarm ($1.25 cap)
 */

// Patterns that indicate simple "Task" operations (free, local processing)
const SIMPLE_TASK_PATTERNS = [
    // Text cleaning operations
    /^(clean|format|fix|correct)\s+(text|grammar|spelling|punctuation)/i,
    /^remove\s+(extra\s+)?(spaces|whitespace|newlines)/i,
    /^(capitalize|lowercase|uppercase)/i,
    /^trim\s+(text|spaces)/i,

    // Simple transformations
    /^convert\s+to\s+(json|csv|xml|yaml|markdown)/i,
    /^extract\s+(email|phone|url|link)s?/i,
    /^count\s+(words|characters|lines)/i,
    /^sort\s+(alphabetically|numerically|by date)/i,

    // Formatting operations
    /^format\s+(code|json|xml|html|css)/i,
    /^indent\s+(code|text)/i,
    /^wrap\s+(text|lines)/i,
];

// Words indicating complex "Mission" operations (requires Bayesian Swarm)
const MISSION_INDICATORS = [
    'analyze', 'synthesize', 'create', 'design', 'architect',
    'research', 'investigate', 'explore', 'evaluate', 'assess',
    'optimize', 'improve', 'enhance', 'refactor', 'rewrite',
    'explain', 'teach', 'summarize', 'compare', 'contrast',
    'debug', 'troubleshoot', 'diagnose', 'solve', 'fix bug',
    'generate', 'write', 'compose', 'draft', 'develop',
    'plan', 'strategy', 'recommend', 'suggest', 'advise',
];

// Minimum complexity thresholds
const MIN_MISSION_WORD_COUNT = 15;
const MIN_MISSION_CHAR_COUNT = 80;

export interface TieringResult {
    tier: 'task' | 'mission';
    confidence: number;
    reason: string;
    localHandler?: string;
}

/**
 * Determines if input is a simple Task or complex Mission
 */
export function classifyInput(input: string): TieringResult {
    const normalizedInput = input.toLowerCase().trim();
    const wordCount = input.split(/\s+/).length;
    const charCount = input.length;

    // Check for simple task patterns first (free path)
    for (const pattern of SIMPLE_TASK_PATTERNS) {
        if (pattern.test(normalizedInput)) {
            const handlerName = getLocalHandler(normalizedInput);
            return {
                tier: 'task',
                confidence: 0.95,
                reason: `Matched simple task pattern: local processing`,
                localHandler: handlerName,
            };
        }
    }

    // Check length thresholds - short inputs are likely tasks
    if (wordCount < 5 && charCount < 40) {
        return {
            tier: 'task',
            confidence: 0.7,
            reason: 'Input too short for complex mission',
        };
    }

    // Check for mission indicators
    const missionIndicatorCount = MISSION_INDICATORS.filter(
        indicator => normalizedInput.includes(indicator)
    ).length;

    if (missionIndicatorCount >= 2) {
        return {
            tier: 'mission',
            confidence: 0.9,
            reason: `Contains ${missionIndicatorCount} mission indicators`,
        };
    }

    if (missionIndicatorCount === 1 && wordCount >= MIN_MISSION_WORD_COUNT) {
        return {
            tier: 'mission',
            confidence: 0.8,
            reason: 'Complex query with mission indicator',
        };
    }

    // Length-based classification
    if (wordCount >= MIN_MISSION_WORD_COUNT || charCount >= MIN_MISSION_CHAR_COUNT) {
        return {
            tier: 'mission',
            confidence: 0.75,
            reason: 'Query complexity exceeds task threshold',
        };
    }

    // Default to task for borderline cases (save user money)
    return {
        tier: 'task',
        confidence: 0.6,
        reason: 'Defaulting to task tier (edge processing)',
    };
}

/**
 * Gets the appropriate local handler for a task
 */
function getLocalHandler(input: string): string {
    if (/clean|format|fix|correct/.test(input)) return 'textCleaner';
    if (/remove|trim/.test(input)) return 'whitespaceHandler';
    if (/capitalize|lowercase|uppercase/.test(input)) return 'caseTransformer';
    if (/convert/.test(input)) return 'formatConverter';
    if (/extract/.test(input)) return 'patternExtractor';
    if (/count/.test(input)) return 'counter';
    if (/sort/.test(input)) return 'sorter';
    return 'genericHandler';
}

/**
 * Execute a simple task locally (no API cost)
 */
export function executeLocalTask(input: string, content: string): string {
    const classification = classifyInput(input);

    switch (classification.localHandler) {
        case 'textCleaner':
            return content
                .replace(/\s+/g, ' ')
                .replace(/[""]/g, '"')
                .replace(/['']/g, "'")
                .trim();

        case 'whitespaceHandler':
            return content.replace(/\s+/g, ' ').trim();

        case 'caseTransformer':
            if (/uppercase/i.test(input)) return content.toUpperCase();
            if (/lowercase/i.test(input)) return content.toLowerCase();
            // Capitalize first letter of each sentence
            return content.replace(/(^\w|[.!?]\s+\w)/g, c => c.toUpperCase());

        case 'counter':
            const words = content.split(/\s+/).filter(Boolean).length;
            const chars = content.length;
            const lines = content.split('\n').length;
            return `Words: ${words}, Characters: ${chars}, Lines: ${lines}`;

        default:
            return content;
    }
}

/**
 * Get cost estimate based on tier
 */
export function getTierCostEstimate(tier: 'task' | 'mission'): { min: number; max: number } {
    if (tier === 'task') {
        return { min: 0, max: 0 };
    }
    return { min: 0.05, max: 1.25 }; // $1.25 cap per sovereign spec
}
