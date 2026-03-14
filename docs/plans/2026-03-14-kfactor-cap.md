# K-Factor Cap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Implement the FIDE §8.3.3 K-factor cap by adding an optional
`gamesInPeriod` field to `KFactorOptions`, capping the returned K when
`K × n > 700`.

**Architecture:** Single change to `kFactor()` in `src/index.ts` — add
`gamesInPeriod` to `KFactorOptions`, apply cap after base K is determined, widen
return type from `10 | 20 | 40` to `number`. `PlayerOptions` inherits the field
automatically since it mirrors `KFactorOptions`. No changes to `update()`,
`delta()`, or any other function.

**Tech Stack:** TypeScript (strict), Vitest, pnpm

---

### Task 1: Write failing tests for the K-factor cap

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add new test cases to the existing `kFactor` describe block**

In `src/__tests__/index.spec.ts`, find the `describe('kFactor', ...)` block and
append these cases inside it:

```ts
it('returns uncapped K when gamesInPeriod is below threshold', () => {
  // K=40, n=17: 40 × 17 = 680 ≤ 700 → no cap
  expect(kFactor({ gamesInPeriod: 17, rating: 1400 })).toBe(40);
  // K=20, n=35: 20 × 35 = 700 ≤ 700 → no cap
  expect(kFactor({ gamesInPeriod: 35, gamesPlayed: 31, rating: 1400 })).toBe(
    20,
  );
  // K=10, n=70: 10 × 70 = 700 ≤ 700 → no cap
  expect(
    kFactor({ everHigher2400: true, gamesInPeriod: 70, rating: 2300 }),
  ).toBe(10);
});

it('returns capped K when gamesInPeriod exceeds threshold', () => {
  // K=40, n=18: floor(700/18) = 38
  expect(kFactor({ gamesInPeriod: 18, rating: 1400 })).toBe(38);
  // K=20, n=36: floor(700/36) = 19
  expect(kFactor({ gamesInPeriod: 36, gamesPlayed: 31, rating: 1400 })).toBe(
    19,
  );
  // K=10, n=71: floor(700/71) = 9
  expect(
    kFactor({ everHigher2400: true, gamesInPeriod: 71, rating: 2300 }),
  ).toBe(9);
});

it('throws RangeError when gamesInPeriod is less than 1', () => {
  expect(() => kFactor({ gamesInPeriod: 0, rating: 1400 })).toThrow(RangeError);
  expect(() => kFactor({ gamesInPeriod: -1, rating: 1400 })).toThrow(
    RangeError,
  );
});
```

Also add a test to the `FIDE Rules` describe block to verify `update()` applies
the capped K:

```ts
it('K-factor cap applied via gamesInPeriod in update()', () => {
  // K=40 normally for new player, but capped to 38 with 18 games in period
  // Expected win prob for equal ratings = 0.5
  // delta = floor(700/18) * (1 - 0.5) = 38 * 0.5 = 19 → rounded = 19
  const [a, b] = update(
    { gamesInPeriod: 18, gamesPlayed: 0, rating: 1400 },
    1400,
    1,
  );
  expect(a).toBe(1419);
  expect(b).toBe(1390); // opponent not capped: K=20, delta = 20 * (0 - 0.5) = -10
});
```

**Step 2: Run the tests to confirm they fail**

```bash
pnpm test -- --reporter=verbose -t "kFactor"
```

Expected: The three new `kFactor` tests fail. The existing tests still pass.

---

### Task 2: Implement the K-factor cap

**Files:**

- Modify: `src/index.ts`

**Step 1: Add `gamesInPeriod` to `KFactorOptions`**

Find the `KFactorOptions` interface and add the new field in alphabetical order:

```ts
interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  gamesInPeriod?: number;
  gamesPlayed?: number;
  rating: number;
}
```

**Step 2: Update `kFactor()` signature and body**

Find the `kFactor` function. Update the destructured parameter to include
`gamesInPeriod`, add the `RangeError` guard, widen the return type to `number`,
and apply the cap at the end.

Change the function signature from:

```ts
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  gamesPlayed = 32,
  rating,
}: KFactorOptions): 10 | 20 | 40 {
```

To:

```ts
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  gamesInPeriod,
  gamesPlayed = 32,
  rating,
}: KFactorOptions): number {
```

Add the `RangeError` guard as the very first statement in the function body
(before any existing logic):

```ts
if (gamesInPeriod !== undefined && gamesInPeriod < 1) {
  throw new RangeError('gamesInPeriod must be at least 1');
}
```

Then, at the end of the function, replace the three `return` statements with a
pattern that stores the result in a variable `k` and applies the cap before
returning. The full updated function body:

```ts
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  gamesInPeriod,
  gamesPlayed = 32,
  rating,
}: KFactorOptions): number {
  if (gamesInPeriod !== undefined && gamesInPeriod < 1) {
    throw new RangeError('gamesInPeriod must be at least 1');
  }

  let k: number;

  if (gameType === 'blitz' || gameType === 'rapid') {
    k = 20;
  } else if (gamesPlayed <= 30 || (age < 18 && rating < 2300)) {
    k = 40;
  } else if (rating < 2400 && !everHigher2400) {
    k = 20;
  } else {
    k = 10;
  }

  if (gamesInPeriod !== undefined && k * gamesInPeriod > 700) {
    k = Math.floor(700 / gamesInPeriod);
  }

  return k;
}
```

**Step 3: Add `gamesInPeriod` to `PlayerOptions`**

`PlayerOptions` is used by `update()` and passes relevant fields to `kFactor()`.
Add the new field in alphabetical order:

```ts
interface PlayerOptions {
  age?: number;
  everHigher2400?: boolean;
  gamesInPeriod?: number;
  gamesPlayed?: number;
  k?: number;
  rating: number;
}
```

**Step 4: Thread `gamesInPeriod` through `update()`**

In `update()`, find where `kFactor` is called for each player and add
`gamesInPeriod`:

```ts
const [kA, kB] = [
  playerA.k ??
    kFactor({
      age: playerA.age,
      everHigher2400: playerA.everHigher2400,
      gameType: game.gameType,
      gamesInPeriod: playerA.gamesInPeriod,
      gamesPlayed: playerA.gamesPlayed,
      rating: playerA.rating,
    }),
  playerB.k ??
    kFactor({
      age: playerB.age,
      everHigher2400: playerB.everHigher2400,
      gameType: game.gameType,
      gamesInPeriod: playerB.gamesInPeriod,
      gamesPlayed: playerB.gamesPlayed,
      rating: playerB.rating,
    }),
];
```

**Step 5: Run the tests**

```bash
pnpm test -- --reporter=verbose -t "kFactor"
```

Expected: All `kFactor` tests pass.

**Step 6: Run the full test suite**

```bash
pnpm test
```

Expected: All tests pass, no regressions.

**Step 7: Commit**

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "feat!: add gamesInPeriod to kFactor() implementing FIDE §8.3.3 K-factor cap"
```

---

### Task 3: Lint, type-check, and build

**Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors. If auto-fixes are applied, stage and commit them.

**Step 2: Run build**

```bash
pnpm build
```

Expected: Compiles without errors to `dist/`.

**Step 3: Commit lint/build fixes if needed**

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "chore: apply lint fixes for gamesInPeriod"
```

---

### Task 4: Update README

**Files:**

- Modify: `README.md`

**Step 1: Add K-factor cap to the "Why this library?" bullet list**

Find the existing K-factor bullet:

```markdown
- **FIDE K-factor rules** — K=40 for new players (≤ 30 games) and juniors (age <
  18, rating < 2300), K=10 for players who have ever reached 2400, K=20 for
  everyone else. No configuration needed.
```

Replace it with:

```markdown
- **FIDE K-factor rules** — K=40 for new players (≤ 30 games) and juniors (age <
  18, rating < 2300), K=10 for players who have ever reached 2400, K=20 for
  everyone else. Includes the §8.3.3 per-period cap: if K × n > 700, K is
  reduced so the total change stays within bounds.
```

**Step 2: Add a usage example**

After the existing game options example, add:

```markdown
**K-factor cap** — pass `gamesInPeriod` when a player has played many games in
the current rating period and the §8.3.3 cap applies:

\`\`\`typescript import { update } from '@echecs/elo';

// New player (K=40) playing their 18th game in a period — K is capped to 38
const [newRatingA, newRatingB] = update( { gamesInPeriod: 18, gamesPlayed: 0,
rating: 1400 }, 1400, 1, ); // → [1419, 1390] \`\`\`
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document gamesInPeriod and K-factor cap in README"
```

---

### Task 5: Update CHANGELOG and bump version

**Files:**

- Modify: `CHANGELOG.md`
- Modify: `package.json`

**Step 1: Bump version in `package.json`**

Change `"version": "2.3.0"` to `"version": "3.0.0"`.

**Step 2: Update CHANGELOG**

Replace the `## [Unreleased]` section and add a new version entry:

```markdown
## [Unreleased]

## [3.0.0] - 2026-03-14

### Added

- `gamesInPeriod` option in `KFactorOptions` and `PlayerOptions` — when
  provided, applies the FIDE §8.3.3 K-factor cap: if `K × n > 700`, K is reduced
  to `Math.floor(700 / n)`. Throws `RangeError` if `gamesInPeriod < 1`.

### Changed

- `kFactor()` return type widened from `10 | 20 | 40` to `number` to accommodate
  capped values.
```

Also add the version link at the bottom of the file alongside the others:

```markdown
[Unreleased]: https://github.com/mormubis/elo/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/mormubis/elo/compare/v2.3.0...v3.0.0
[2.3.0]: https://github.com/mormubis/elo/compare/v2.2.1...v2.3.0
```

(Replace the existing `[Unreleased]` and `[2.3.0]` link lines.)

**Step 3: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 3.0.0"
```
