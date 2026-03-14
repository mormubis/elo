# FIDE Compliance Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Fix two FIDE compliance bugs in `@echecs/elo` v3.1.0: the §8.3.1
rating-difference cap exemption for 2650+ players, and §8.3.4 rounding away from
zero.

**Architecture:** Both fixes are pure internal changes to `src/index.ts`. No new
exports, no API surface changes. A new private constant (`HIGH_RATED_THRESHOLD`)
and a new private helper function (`roundHalfAwayFromZero`) are added. Tests go
in the existing `src/__tests__/index.spec.ts`.

**Tech Stack:** TypeScript (strict), Vitest, pnpm, ESLint + Prettier via
`pnpm lint` / `pnpm test`.

**Design doc:** `docs/plans/2026-03-15-fide-compliance-fixes-design.md`

---

## Useful commands

```bash
pnpm test                          # run all tests once
pnpm test -- --reporter=verbose -t "expected"   # run matching tests
pnpm lint                          # ESLint + tsc (auto-fixes style)
pnpm build                         # compile to dist/
```

---

### Task 1: Fix §8.3.1 — cap exemption for 2650+ players in `expected()`

**Files:**

- Modify: `src/index.ts` (constants block ~line 33, `expected()` ~line 70)
- Test: `src/__tests__/index.spec.ts`

**Background:** FIDE §8.3.1 (effective 1 October 2025) says the 400-point cap
only applies to players rated below 2650. Players rated 2650 or above always use
the actual rating difference. The current code clamps unconditionally.

---

**Step 1: Write the failing tests**

Open `src/__tests__/index.spec.ts` and add these cases inside the existing
`describe('expected', ...)` block (or create one if absent). Place them after
the existing tests for that function.

```ts
// §8.3.1: cap does NOT apply when either player is rated >= 2650
it('does not cap the difference when player A is rated >= 2650', () => {
  // 500-point diff; without cap: 1 / (1 + 10^(500/400)) ≈ 0.0563
  // with cap:    1 / (1 + 10^(400/400)) = 1 / 11 ≈ 0.0909
  expect(expected(2700, 2200)).toBeCloseTo(
    1 / (1 + Math.pow(10, -500 / 400)),
    5,
  );
});

it('does not cap the difference when player B is rated >= 2650', () => {
  expect(expected(2200, 2700)).toBeCloseTo(
    1 / (1 + Math.pow(10, 500 / 400)),
    5,
  );
});

it('still caps the difference when both players are rated below 2650', () => {
  // 500-point diff, both below 2650: clamped to 400
  expect(expected(2649, 2100)).toBeCloseTo(
    1 / (1 + Math.pow(10, 400 / 400)),
    5,
  );
});
```

**Step 2: Run tests to verify they fail**

```bash
pnpm test -- --reporter=verbose -t "does not cap"
```

Expected: two tests FAIL (values don't match because cap is still applied).

**Step 3: Implement the fix in `src/index.ts`**

Add `HIGH_RATED_THRESHOLD` alongside `MAX_DIFF`:

```ts
const MAX_DIFF = 400;
const HIGH_RATED_THRESHOLD = 2650;
```

Update the `expected()` function body:

```ts
function expected(a: number, b: number): number {
  // @see https://handbook.fide.com/chapter/B022024
  // Section 8.3.1 (effective 1 October 2025)
  // For players rated below 2650, a difference of more than 400 points is
  // counted as 400 points. For players rated 2650 and above, the actual
  // difference is used.
  const diff =
    a >= HIGH_RATED_THRESHOLD || b >= HIGH_RATED_THRESHOLD
      ? b - a
      : Math.min(Math.max(b - a, -MAX_DIFF), MAX_DIFF);

  return 1 / (1 + Math.pow(10, diff / 400));
}
```

**Step 4: Run tests to verify they pass**

```bash
pnpm test -- --reporter=verbose -t "expected"
```

Expected: all `expected` tests PASS.

**Step 5: Run lint to catch any style issues**

```bash
pnpm lint
```

Expected: no errors. If `sort-keys` or import order warnings appear, fix them
(constants must be sorted alphabetically — `HIGH_RATED_THRESHOLD` comes before
`MAX_DIFF` alphabetically, so place it first, or check the existing order and
match it).

**Step 6: Commit**

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "fix: exempt 2650+ rated players from 400-point cap per FIDE §8.3.1"
```

---

### Task 2: Fix §8.3.4 — round half away from zero in `update()`

**Files:**

- Modify: `src/index.ts` (`update()` ~line 134)
- Test: `src/__tests__/index.spec.ts`

**Background:** FIDE §8.3.4 requires rounding to the nearest whole number with
0.5 rounded away from zero. JavaScript's `Math.round(-0.5)` returns 0 (toward
+∞), not −1. The current `update()` uses `Math.round`, so a −0.5 delta
incorrectly produces 0 instead of −1.

---

**Step 1: Find a game configuration that produces a ±0.5 delta**

A delta of exactly 0.5 occurs when `k * (result - expectedScore) = 0.5`. With
K=10 and `result=1`: we need `expectedScore = 0.95`, i.e. the opponent is 400
points weaker → ratings like 2800 vs 2400. Verify:

```
expected(2800, 2400) = 1 / (1 + 10^(400/400)) = 1/11 ≈ 0.0909
```

Wait — that's player A's score probability. For a +0.5 delta on player A (K=10,
win): `10 * (1 - p) = 0.5` → `p = 0.95`. `expected(a, b) = 0.95` →
`b - a = -400` → player A is 400 points stronger.

With the 2650 exemption now in place, use ratings below 2650 to keep the old cap
behaviour: player A=2400 (K=10, `everHigher2400: true`), player B=2000.
`expected(2400, 2000)` → diff clamped to 400 → `1/(1+10) ≈ 0.0909`. Not 0.95.

Instead, find it analytically. With K=20 and result=0 (loss):
`20 * (0 - p) = -0.5` → `p = 0.025` → `1/(1+10^(d/400)) = 0.025` →
`10^(d/400) = 39` → `d = 400 * log10(39) ≈ 638`. Ratings are clamped to 400
diff, so at max diff: `p = 1/(1+10) ≈ 0.0909`. Delta =
`20 * (0 - 0.0909) ≈ -1.818`. Not ±0.5.

Use K=10, result=1 (win): `10 * (1 - p) = 0.5` → `p = 0.95`. For
`expected(a, b) = 0.95`: diff = b − a = −400 (capped). So player A needs to be
400+ stronger. Example: A=2800 rated ≥2650, B=2200. With the 2650 cap-exemption
fix: `expected(2800, 2200)` = `1/(1+10^(-600/400))` ≈ 0.9823. Delta =
`10 * (1 - 0.9823)` ≈ 0.177. Not 0.5.

The cleanest approach: pass an explicit `k` override and craft the expected
probability precisely. Use player A with `k: 10`, rating=1000; player B
rating=1000. `expected(1000, 1000) = 0.5`. Delta = `10 * (1 - 0.5) = 5.0`. Not
helpful.

**Simplest approach for the test:** use `k: 2` and `expected = 0.75` so
`delta = 2 * (1 - 0.75) = 0.5`. We need `expected(a, b) = 0.75` →
`1/(1+10^(d/400)) = 0.75` → `10^(d/400) = 1/3` → `d = -400*log10(3) ≈ -190.85`.
Round to ratings: A=1591, B=1400. Check: `expected(1591, 1400)` → diff =
1400-1591 = -191 → `1/(1+10^(-191/400))` ≈ 0.750. Close enough for a
`toBeCloseTo` test.

Actually, the cleanest and most direct test is to pass `k: 1` and arrange
result=1 with `expected≈0.5` so `delta=0.5`. Use equal ratings (1400 vs 1400):
`expected(1400,1400)=0.5`. `k=1`, result=1: `delta=1*(1-0.5)=0.5`. Rating change
= `1400 + 0.5 = 1400.5` → should round to **1401** (away from zero). Currently
`Math.round(1400.5) = 1401` — this case passes already!

For the **negative** case: `k=1`, result=0, equal ratings:
`delta = 1*(0-0.5) = -0.5`. Rating change = `1400 + (-0.5) = 1399.5`.
`Math.round(1399.5) = 1400` (JS rounds toward +∞). Should be **1399** (away from
zero). This is the failing case.

**Step 1: Write the failing test**

Add inside the existing `describe('update', ...)` block:

```ts
// §8.3.4: 0.5 must round away from zero
it('rounds a -0.5 delta away from zero (loss with K=1 at equal ratings)', () => {
  // k=1, equal ratings, result=0 (loss):
  // delta = 1 * (0 - 0.5) = -0.5  →  1400 + (-0.5) = 1399.5  →  should be 1399
  const [a] = update({ k: 1, rating: 1400 }, { k: 1, rating: 1400 }, 0);
  expect(a).toBe(1399);
});

it('rounds a +0.5 delta away from zero (win with K=1 at equal ratings)', () => {
  // k=1, equal ratings, result=1 (win):
  // delta = 1 * (1 - 0.5) = 0.5  →  1400 + 0.5 = 1400.5  →  should be 1401
  const [a] = update({ k: 1, rating: 1400 }, { k: 1, rating: 1400 }, 1);
  expect(a).toBe(1401);
});
```

**Step 2: Run tests to verify the negative case fails**

```bash
pnpm test -- --reporter=verbose -t "rounds a"
```

Expected: the `-0.5` test FAILS (produces 1400 instead of 1399). The `+0.5` test
may already pass.

**Step 3: Add `roundHalfAwayFromZero` helper and update `update()`**

In `src/index.ts`, add the private helper before `update()` (keep alphabetical
order of function declarations if any — place it near `delta` or before
`update`):

```ts
/**
 * Rounds a number to the nearest integer, with 0.5 rounded away from zero.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.3.4
 */
function roundHalfAwayFromZero(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x));
}
```

Replace the two `Math.round(...)` calls inside `update()`:

```ts
return [
  roundHalfAwayFromZero(playerA.rating + delta(game.result, oddsA, kA)),
  roundHalfAwayFromZero(playerB.rating + delta(1 - game.result, oddsB, kB)),
];
```

**Step 4: Run all tests**

```bash
pnpm test
```

Expected: all tests PASS.

**Step 5: Run lint**

```bash
pnpm lint
```

Expected: no errors or warnings.

**Step 6: Commit**

```bash
git add src/index.ts src/__tests__/index.spec.ts
git commit -m "fix: round rating changes away from zero per FIDE §8.3.4"
```

---

### Task 3: Update documentation

**Files:**

- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`

**Step 1: Update README.md**

Find the bullet that mentions the 400-point cap:

```md
- **400-point rating difference cap** — rating differences above 400 are clamped
  before calculating win probability, as required by FIDE §8.3.1. Most libraries
  skip this.
```

Replace it with:

```md
- **400-point rating difference cap** — rating differences above 400 are clamped
  before calculating win probability, as required by FIDE §8.3.1. Players rated
  2650 or above are exempt from this cap (§8.3.1, effective 1 October 2025).
  Most libraries skip both rules.
```

**Step 2: Update CHANGELOG.md**

Add a new `[3.1.0]` section after `## [Unreleased]` and before `## [3.0.0]`:

```md
## [3.1.0] - 2026-03-15

### Fixed

- `expected()`: players rated 2650 or above are no longer subject to the
  400-point rating difference cap, per FIDE §8.3.1 (effective 1 October 2025).
- `update()`: rating changes of exactly ±0.5 now round away from zero (e.g. −0.5
  → −1), as required by FIDE §8.3.4.
```

Also update the diff links at the bottom of `CHANGELOG.md`. Add:

```md
[3.1.0]: https://github.com/mormubis/elo/compare/v3.0.0...v3.1.0
```

And update the `[Unreleased]` link:

```md
[Unreleased]: https://github.com/mormubis/elo/compare/v3.1.0...HEAD
```

**Step 3: Bump version in `package.json`**

Change `"version": "3.0.0"` to `"version": "3.1.0"`.

**Step 4: Run full pre-PR check**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: all pass, no errors.

**Step 5: Commit**

```bash
git add README.md CHANGELOG.md package.json
git commit -m "chore: bump version to 3.1.0; update README and CHANGELOG"
```

---

## Done

All three tasks complete. The branch is ready for review / merge to `main`.
