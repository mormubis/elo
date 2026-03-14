# `initial()` Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Add an `initial(games)` function implementing FIDE §8.2 initial rating
calculation for unrated players.

**Architecture:** Single new function in `src/index.ts` alongside the existing
five functions. Injects two hypothetical 1800-rated draws internally, computes
`Ra + dp` using the existing `DP_TABLE`, caps at 2200. Reuses the existing
`ResultAndOpponent` type. No shared helper extracted — `performance()` and
`initial()` stay independent.

**Tech Stack:** TypeScript (strict), Vitest, pnpm

---

### Task 1: Write failing tests for `initial()`

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add the import**

At the top of `src/__tests__/index.spec.ts`, add `initial` to the import:

```ts
import {
  delta,
  expected,
  initial,
  kFactor,
  performance,
  update,
} from '../index.js';
```

**Step 2: Add the test suite at the end of the file**

```ts
describe('initial', () => {
  it('throws RangeError for empty games array', () => {
    expect(() => initial([])).toThrow(RangeError);
  });

  it('injects two hypothetical 1800-rated draws', () => {
    // 5 wins against 1800-rated opponents
    // Without hypothetical opponents: p = 5/5 = 1.0, Ra = 1800, dp = 800 → 2600 (capped to 2200)
    // With hypothetical opponents: score = 5 + 1 = 6, games = 5 + 2 = 7
    // p = 6/7 ≈ 0.857 → index = 86 → dp = 309, Ra = (5*1800 + 2*1800)/7 = 1800
    // result = Math.min(Math.round(1800 + 309), 2200) = 2109
    const result = initial([
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
    ]);
    expect(result).toBe(2109);
  });

  it('caps the result at 2200', () => {
    // Many wins against high-rated opponents — without cap would exceed 2200
    const result = initial([
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
    ]);
    expect(result).toBe(2200);
  });

  it('returns Ra when p = 0.5 (all draws including hypothetical)', () => {
    // 2 draws against 1800. With 2 hypothetical 1800 draws:
    // score = 1 + 1 = 2, games = 4, p = 0.5, dp = 0
    // Ra = (1800 + 1800 + 1800 + 1800) / 4 = 1800
    // result = 1800
    const result = initial([
      { opponentRating: 1800, result: 0.5 },
      { opponentRating: 1800, result: 0.5 },
    ]);
    expect(result).toBe(1800);
  });

  it('pulls rating toward 1800 for strong results against weak opponents', () => {
    // 5 wins against 1000-rated opponents
    // Without hypothetical: Ra = 1000, p = 1.0, dp = 800 → 1800 (capped)
    // With hypothetical: Ra = (5*1000 + 2*1800)/7 ≈ 1228.57
    // score = 6, games = 7, p = 6/7 ≈ 0.857 → dp = 309
    // result = Math.round(1228.57 + 309) = 1538
    const result = initial([
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
    ]);
    expect(result).toBe(1538);
  });

  it('throws RangeError for invalid result values', () => {
    expect(() => initial([{ opponentRating: 1400, result: 0.3 as 0 }])).toThrow(
      RangeError,
    );
  });
});
```

**Step 3: Run the tests to confirm they fail**

```bash
pnpm test -- --reporter=verbose -t "initial"
```

Expected: All tests in the `initial` suite fail with an error like
`initial is not a function`.

---

### Task 2: Implement `initial()`

**Files:**

- Modify: `src/index.ts`

**Step 1: Add the function after `performance()`**

Insert the following before the `export type` block in `src/index.ts`:

```ts
/**
 * Calculates the initial rating of a previously unrated player.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.2
 * @param games - Array of games against rated opponents.
 * @returns The initial rating rounded to the nearest integer, capped at 2200.
 * @throws {RangeError} If the games array is empty or contains invalid result values.
 */
function initial(games: ResultAndOpponent[]): number {
  if (games.length === 0) {
    throw new RangeError('games must not be empty');
  }

  // §8.2.2: add two hypothetical opponents rated 1800, each counted as a draw
  const allGames: ResultAndOpponent[] = [
    ...games,
    { opponentRating: 1800, result: 0.5 },
    { opponentRating: 1800, result: 0.5 },
  ];

  const ra =
    allGames.reduce((sum, game) => sum + game.opponentRating, 0) /
    allGames.length;

  const score = allGames.reduce((sum, game) => sum + game.result, 0);
  const p = score / allGames.length;

  const index = Math.round(p * 100);
  const dp = DP_TABLE[index];

  if (dp === undefined) {
    throw new RangeError('result values must be 0, 0.5, or 1');
  }

  // §8.2.3: cap at 2200
  return Math.min(Math.round(ra + dp), 2200);
}
```

**Step 2: Add `initial` to the export statement**

Change:

```ts
export { delta, expected, kFactor, performance, update };
```

To:

```ts
export { delta, expected, initial, kFactor, performance, update };
```

**Step 3: Run the tests**

```bash
pnpm test -- --reporter=verbose -t "initial"
```

Expected: All tests in the `initial` suite pass.

**Step 4: Run the full test suite**

```bash
pnpm test
```

Expected: All tests pass, no regressions.

**Step 5: Commit**

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "feat: add initial() function implementing FIDE §8.2 initial rating"
```

---

### Task 3: Lint, type-check, and build

**Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors. Auto-fixes applied if needed; if files are modified, stage
and amend the previous commit or create a new one.

**Step 2: Run build**

```bash
pnpm build
```

Expected: Compiles without errors to `dist/`.

**Step 3: Commit lint/build fixes if needed**

If lint auto-fixed anything:

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "chore: apply lint fixes for initial()"
```

---

### Task 4: Update README

**Files:**

- Modify: `README.md`

**Step 1: Add `initial()` to the "Why this library?" bullet list**

After the `performance` bullet, add:

```markdown
- **Initial rating calculation** — computes a new player's first published
  rating (§8.2) using the FIDE hypothetical-opponent adjustment and 2200 cap. No
  other Elo library on npm implements this.
```

**Step 2: Add a usage example**

After the `performance` usage example, add:

````markdown
**Initial rating** — use `initial()` to calculate a new (unrated) player's first
FIDE rating. If their first event was a zero score, filter it out before calling
(§8.2.1):

```typescript
import { initial } from '@echecs/elo';

const rating = initial([
  { opponentRating: 1600, result: 1 },
  { opponentRating: 1500, result: 0.5 },
  { opponentRating: 1700, result: 0 },
  { opponentRating: 1600, result: 1 },
  { opponentRating: 1550, result: 1 },
]);
```
````

````

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document initial() in README"
````

---

### Task 5: Update CHANGELOG

**Files:**

- Modify: `CHANGELOG.md`

**Step 1: Add entry under `[Unreleased]`**

```markdown
## [Unreleased]

### Added

- `initial(games: ResultAndOpponent[])` function implementing FIDE §8.2 initial
  rating calculation for unrated players. Injects two hypothetical 1800-rated
  draws per the spec, caps result at 2200, and reuses the existing
  `ResultAndOpponent` type.
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add CHANGELOG entry for initial()"
```
