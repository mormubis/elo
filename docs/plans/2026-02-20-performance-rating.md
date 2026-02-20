# Performance Rating Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Add a `performance(games: ResultAndOpponent[]): number` function that
calculates a player's FIDE performance rating (§8.2.3) from an array of game
results.

**Architecture:** Single new function and one new interface added to
`src/index.ts`. A 101-entry `DP_TABLE` constant (FIDE §8.1.1) drives the dp
lookup. Tests go in the existing `src/__tests__/index.spec.ts` file.

**Tech Stack:** TypeScript (strict, NodeNext), Vitest for tests, pnpm for
scripts.

---

### Task 1: Add the `DP_TABLE` constant and `ResultAndOpponent` interface

**Files:**

- Modify: `src/index.ts`

**Step 1: Add `ResultAndOpponent` interface and `DP_TABLE` after the existing
types/constants**

Insert after the `const MAX_DIFF = 400;` line in `src/index.ts`:

```ts
interface ResultAndOpponent {
  opponentRating: number;
  result: Result;
}

// @see https://handbook.fide.com/chapter/B022024 Section 8.1.1
// Key = Math.round(p * 100), value = dp
const DP_TABLE: Record<number, number> = {
  0: -800,
  1: -677,
  2: -589,
  3: -538,
  4: -501,
  5: -470,
  6: -444,
  7: -422,
  8: -401,
  9: -383,
  10: -366,
  11: -351,
  12: -336,
  13: -322,
  14: -309,
  15: -296,
  16: -284,
  17: -273,
  18: -262,
  19: -251,
  20: -240,
  21: -230,
  22: -220,
  23: -211,
  24: -202,
  25: -193,
  26: -184,
  27: -175,
  28: -166,
  29: -158,
  30: -149,
  31: -141,
  32: -133,
  33: -125,
  34: -117,
  35: -110,
  36: -102,
  37: -95,
  38: -87,
  39: -80,
  40: -72,
  41: -65,
  42: -57,
  43: -50,
  44: -43,
  45: -36,
  46: -29,
  47: -21,
  48: -14,
  49: -7,
  50: 0,
  51: 7,
  52: 14,
  53: 21,
  54: 29,
  55: 36,
  56: 43,
  57: 50,
  58: 57,
  59: 65,
  60: 72,
  61: 80,
  62: 87,
  63: 95,
  64: 102,
  65: 110,
  66: 117,
  67: 125,
  68: 133,
  69: 141,
  70: 149,
  71: 158,
  72: 166,
  73: 175,
  74: 184,
  75: 193,
  76: 202,
  77: 211,
  78: 220,
  79: 230,
  80: 240,
  81: 251,
  82: 262,
  83: 273,
  84: 284,
  85: 296,
  86: 309,
  87: 322,
  88: 336,
  89: 351,
  90: 366,
  91: 383,
  92: 401,
  93: 422,
  94: 444,
  95: 470,
  96: 501,
  97: 538,
  98: 589,
  99: 677,
  100: 800,
};
```

Note: `sort-keys` ESLint rule is enforced — the keys above are already in
ascending numeric order, which satisfies it.

**Step 2: Run lint to verify no issues**

```bash
pnpm lint
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add ResultAndOpponent interface and DP_TABLE constant"
```

---

### Task 2: Write failing tests for `performance`

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add import for `performance` at the top of the test file**

Change the existing import line:

```ts
import { delta, expected, kFactor, update } from '../index.js';
```

to:

```ts
import { delta, expected, kFactor, performance, update } from '../index.js';
```

**Step 2: Add a `describe('performance')` block at the end of the test file**

```ts
describe('performance', () => {
  it('throws RangeError for empty games array', () => {
    expect(() => performance([])).toThrow(RangeError);
  });

  it('returns Ra when p = 0.5 (all draws)', () => {
    // dp = 0 at p=0.5, so result = Ra
    const result = performance([
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1600, result: 0.5 },
    ]);
    expect(result).toBe(1500); // Ra = (1400+1600)/2 = 1500, dp = 0
  });

  it('returns Ra - 800 when p = 0 (all losses)', () => {
    const result = performance([
      { opponentRating: 1400, result: 0 },
      { opponentRating: 1600, result: 0 },
    ]);
    expect(result).toBe(700); // Ra = 1500, dp = -800
  });

  it('returns Ra + 800 when p = 1 (all wins)', () => {
    const result = performance([
      { opponentRating: 1400, result: 1 },
      { opponentRating: 1600, result: 1 },
    ]);
    expect(result).toBe(2300); // Ra = 1500, dp = 800
  });

  // Cross-checked against https://ratings.fide.com/calc.phtml?page=change
  it('matches FIDE calculator for mixed results', () => {
    // 3 wins, 1 draw, 1 loss against 1600-rated opponents
    // score = 3.5/5 = 0.70, Ra = 1600, dp = 149 → 1749
    const result = performance([
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 0.5 },
      { opponentRating: 1600, result: 0 },
    ]);
    expect(result).toBe(1749);
  });

  it('handles a single game win', () => {
    // score = 1/1 = 1.0, Ra = 1400, dp = 800 → 2200
    const result = performance([{ opponentRating: 1400, result: 1 }]);
    expect(result).toBe(2200);
  });

  it('rounds to nearest integer', () => {
    // Ra = 1433.33... → should round correctly
    const result = performance([
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1500, result: 0.5 },
    ]);
    // Ra = (1400+1400+1500)/3 = 1433.33, p=0.5, dp=0 → Math.round(1433.33) = 1433
    expect(result).toBe(1433);
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
pnpm test -- --reporter=verbose -t "performance"
```

Expected: all `performance` tests fail with something like
`"performance is not a function"`.

**Step 4: Commit the failing tests**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: add failing tests for performance function"
```

---

### Task 3: Implement the `performance` function

**Files:**

- Modify: `src/index.ts`

**Step 1: Add the `performance` function after the `update` function**

```ts
/**
 * Calculates the performance rating of a player over a series of games.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.2.3
 * @param games - Array of games, each containing the opponent's rating and the result.
 * @returns The performance rating rounded to the nearest integer.
 * @throws {RangeError} If the games array is empty.
 */
function performance(games: ResultAndOpponent[]): number {
  if (games.length === 0) {
    throw new RangeError('games must not be empty');
  }

  const ra =
    games.reduce((sum, game) => sum + game.opponentRating, 0) / games.length;

  const score = games.reduce((sum, game) => sum + game.result, 0);
  const p = score / games.length;

  const index = Math.round(p * 100);
  const dp = DP_TABLE[index] ?? 0;

  return Math.round(ra + dp);
}
```

**Step 2: Add `ResultAndOpponent` and `performance` to the exports at the bottom
of `src/index.ts`**

Change:

```ts
export type { Result, KFactorOptions, UpdateOptions };
export { delta, expected, kFactor, update };
```

to:

```ts
export type { KFactorOptions, Result, ResultAndOpponent, UpdateOptions };
export { delta, expected, kFactor, performance, update };
```

Note: both export lines must remain sorted alphabetically (ESLint `sort-keys`
and `sort-imports` rules).

**Step 3: Run the tests**

```bash
pnpm test -- --reporter=verbose -t "performance"
```

Expected: all `performance` tests pass.

**Step 4: Run the full test suite to check for regressions**

```bash
pnpm test
```

Expected: all tests pass.

**Step 5: Run lint**

```bash
pnpm lint
```

Expected: no errors or warnings.

**Step 6: Commit**

```bash
git add src/index.ts
git commit -m "feat: add performance rating function (FIDE §8.2.3)"
```

---

### Task 4: Full pre-PR verification

**Step 1: Run the complete check**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: all three pass with no errors.

**Step 2: Push**

```bash
git push
```
