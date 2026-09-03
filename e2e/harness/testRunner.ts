/**
 * Sprachweg E2E Test Suite - Core Test Runner & Assertion Library
 * Zero-dependency, ultra-fast, colorized test execution engine.
 */

export interface TestResult {
  suiteName: string;
  testName: string;
  tier: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteSummary {
  tier: string;
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
}

class TestContext {
  private currentTier: string = 'Tier 1';
  private currentSuite: string = '';
  private results: TestResult[] = [];
  private beforeAllHooks: Map<string, (() => void | Promise<void>)[]> = new Map();
  private afterAllHooks: Map<string, (() => void | Promise<void>)[]> = new Map();
  private beforeEachHooks: Map<string, (() => void | Promise<void>)[]> = new Map();
  private afterEachHooks: Map<string, (() => void | Promise<void>)[]> = new Map();
  private suites: { tier: string; name: string; fn: () => void | Promise<void> }[] = [];

  setTier(tier: string) {
    this.currentTier = tier;
  }

  getTier(): string {
    return this.currentTier;
  }

  registerSuite(name: string, fn: () => void | Promise<void>, tier?: string) {
    this.suites.push({
      tier: tier || this.currentTier,
      name,
      fn,
    });
  }

  addResult(result: TestResult) {
    this.results.push(result);
  }

  getResults(): TestResult[] {
    return this.results;
  }

  clear() {
    this.results = [];
    this.suites = [];
    this.beforeAllHooks.clear();
    this.afterAllHooks.clear();
    this.beforeEachHooks.clear();
    this.afterEachHooks.clear();
  }

  getSuites() {
    return this.suites;
  }
}

export const globalTestContext = new TestContext();

let activeSuite = '';
let activeTier = 'Tier 1';
let activeTestsInSuite: { name: string; fn: () => void | Promise<void> }[] = [];

export function describe(name: string, fn: () => void | Promise<void>, tier?: string) {
  const currentActiveSuite = name;
  const currentActiveTier = tier || globalTestContext.getTier();

  globalTestContext.registerSuite(
    name,
    async () => {
      activeSuite = currentActiveSuite;
      activeTier = currentActiveTier;
      activeTestsInSuite = [];
      await fn();
      for (const t of activeTestsInSuite) {
        const start = performance.now();
        try {
          await t.fn();
          const duration = performance.now() - start;
          globalTestContext.addResult({
            suiteName: currentActiveSuite,
            testName: t.name,
            tier: currentActiveTier,
            passed: true,
            durationMs: duration,
          });
        } catch (err: any) {
          const duration = performance.now() - start;
          globalTestContext.addResult({
            suiteName: currentActiveSuite,
            testName: t.name,
            tier: currentActiveTier,
            passed: false,
            durationMs: duration,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    },
    tier
  );
}

export function it(name: string, fn: () => void | Promise<void>) {
  activeTestsInSuite.push({ name, fn });
}

export const test = it;

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) return true;
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export class MatcherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MatcherError';
  }
}

export interface Matchers<T> {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toContain(expected: any): void;
  toMatch(regex: RegExp | string): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toHaveLength(expected: number): void;
  toThrow(expectedMessageOrRegex?: string | RegExp): void;
  not: Matchers<T>;
}

export function expect<T>(actual: T): Matchers<T> {
  const createMatcher = (isNot: boolean = false): Matchers<T> => ({
    toBe(expected: any) {
      const pass = actual === expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(
          `Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be' : 'to be'} ${JSON.stringify(expected)}`
        );
      }
    },
    toEqual(expected: any) {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new MatcherError(
          `Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to equal' : 'to equal'} ${JSON.stringify(expected)}`
        );
      }
    },
    toBeCloseTo(expected: number, precision: number = 2) {
      if (typeof actual !== 'number') {
        throw new MatcherError(`Expected actual value ${actual} to be a number`);
      }
      const diff = Math.abs(actual - expected);
      const tolerance = Math.pow(10, -precision) / 2;
      const pass = diff < tolerance;
      if (isNot ? pass : !pass) {
        throw new MatcherError(
          `Expected ${actual} ${isNot ? 'NOT to be close to' : 'to be close to'} ${expected} (diff: ${diff}, tol: ${tolerance})`
        );
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number') throw new MatcherError(`Expected number, got ${typeof actual}`);
      const pass = actual > expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${actual} ${isNot ? 'NOT to be >' : 'to be >'} ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number') throw new MatcherError(`Expected number, got ${typeof actual}`);
      const pass = actual >= expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${actual} ${isNot ? 'NOT to be >=' : 'to be >='} ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (typeof actual !== 'number') throw new MatcherError(`Expected number, got ${typeof actual}`);
      const pass = actual < expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${actual} ${isNot ? 'NOT to be <' : 'to be <'} ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number') throw new MatcherError(`Expected number, got ${typeof actual}`);
      const pass = actual <= expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${actual} ${isNot ? 'NOT to be <=' : 'to be <='} ${expected}`);
      }
    },
    toContain(expected: any) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(expected));
      } else if (Array.isArray(actual)) {
        pass = actual.some(item => deepEqual(item, expected));
      } else if (actual instanceof Set || actual instanceof Map) {
        pass = actual.has(expected);
      }
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to contain' : 'to contain'} ${JSON.stringify(expected)}`);
      }
    },
    toMatch(regex: RegExp | string) {
      const reg = typeof regex === 'string' ? new RegExp(regex) : regex;
      const pass = reg.test(String(actual));
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected "${actual}" ${isNot ? 'NOT to match' : 'to match'} ${regex}`);
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected value ${isNot ? 'NOT to be defined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected value ${isNot ? 'NOT to be undefined' : 'to be undefined'}`);
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected value ${isNot ? 'NOT to be null' : 'to be null'}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be truthy' : 'to be truthy'}`);
      }
    },
    toBeFalsy() {
      const pass = !Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected ${JSON.stringify(actual)} ${isNot ? 'NOT to be falsy' : 'to be falsy'}`);
      }
    },
    toHaveLength(expected: number) {
      const len = (actual as any)?.length ?? (actual as any)?.size;
      const pass = len === expected;
      if (isNot ? pass : !pass) {
        throw new MatcherError(`Expected length ${isNot ? 'NOT to be' : 'to be'} ${expected}, got ${len}`);
      }
    },
    toThrow(expectedMessageOrRegex?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new MatcherError(`Expected a function to test for throws, got ${typeof actual}`);
      }
      let threw = false;
      let caughtError: any = null;
      try {
        (actual as any)();
      } catch (e) {
        threw = true;
        caughtError = e;
      }
      if (isNot ? threw : !threw) {
        throw new MatcherError(`Expected function ${isNot ? 'NOT to throw' : 'to throw'}`);
      }
      if (threw && expectedMessageOrRegex && !isNot) {
        const msg = caughtError?.message || String(caughtError);
        if (typeof expectedMessageOrRegex === 'string') {
          if (!msg.includes(expectedMessageOrRegex)) {
            throw new MatcherError(`Expected throw message to contain "${expectedMessageOrRegex}", got "${msg}"`);
          }
        } else if (!expectedMessageOrRegex.test(msg)) {
          throw new MatcherError(`Expected throw message to match ${expectedMessageOrRegex}, got "${msg}"`);
        }
      }
    },
    get not() {
      return createMatcher(true);
    },
  });

  return createMatcher(false);
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

export async function runAllSuites(): Promise<{ total: number; passed: number; failed: number; exitCode: number }> {
  const suites = globalTestContext.getSuites();
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}         SPRACHWEG DUAL-TRACK E2E TEST SUITE RUNNER                     ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  const startTime = performance.now();

  for (const suite of suites) {
    console.log(`${colors.bold}${colors.blue}▶ [${suite.tier}] ${suite.name}${colors.reset}`);
    await suite.fn();
    const suiteResults = globalTestContext.getResults().filter(r => r.suiteName === suite.name && r.tier === suite.tier);
    for (const res of suiteResults) {
      if (res.passed) {
        console.log(`  ${colors.green}✔ PASS${colors.reset} ${res.testName} ${colors.gray}(${res.durationMs.toFixed(2)}ms)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✖ FAIL${colors.reset} ${res.testName} ${colors.gray}(${res.durationMs.toFixed(2)}ms)${colors.reset}`);
        if (res.error) {
          console.log(`    ${colors.red}Error: ${res.error.message}${colors.reset}`);
          if (res.error.stack) {
            const stackLines = res.error.stack.split('\n').slice(1, 3).map(l => `      ${l}`).join('\n');
            console.log(`${colors.gray}${stackLines}${colors.reset}`);
          }
        }
      }
    }
    console.log();
  }

  const totalDuration = performance.now() - startTime;
  const allResults = globalTestContext.getResults();
  const total = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;

  // Group by Tier
  const tierMap = new Map<string, { total: number; passed: number; failed: number }>();
  for (const r of allResults) {
    const stat = tierMap.get(r.tier) || { total: 0, passed: 0, failed: 0 };
    stat.total++;
    if (r.passed) stat.passed++;
    else stat.failed++;
    tierMap.set(r.tier, stat);
  }

  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}SUMMARY BY TIER:${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}------------------------------------------------------------------------${colors.reset}`);
  for (const [tier, stat] of tierMap.entries()) {
    const tierColor = stat.failed === 0 ? colors.green : colors.red;
    console.log(
      `  ${tier.padEnd(20)} : ${tierColor}${stat.passed}/${stat.total} Passed${colors.reset} ${stat.failed > 0 ? `(${stat.failed} Failed)` : ''}`
    );
  }
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(
    `${colors.bold}TOTAL EXECUTION:${colors.reset} ${total} tests executed in ${totalDuration.toFixed(2)}ms | ${colors.green}${passed} Passed${colors.reset} | ${failed > 0 ? `${colors.red}${failed} Failed${colors.reset}` : `${colors.green}0 Failed${colors.reset}`}`
  );
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  return {
    total,
    passed,
    failed,
    exitCode: failed === 0 ? 0 : 1,
  };
}
