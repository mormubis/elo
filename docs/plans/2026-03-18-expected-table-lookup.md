# expected() Table Lookup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Replace the continuous formula in `expected()` with the official FIDE
§8.1.2 discrete lookup table, add a blitz/rapid K-factor source comment, and add
an integration test for the 2650+ cap exemption through `update()`.

**Architecture:** Replace `1 / (1 + 10^(D/400))` with a 50-entry lookup table
(`PD_TABLE`) mapping rating-difference ranges to `[PD_H, PD_L]` pairs. For
differences > 735 (only possible with the 2650+ exemption), fall back to the
formula. Store both H and L values to avoid floating-point precision issues from
`1 - pdH`.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Add the PD_TABLE constant

**Files:**

- Modify: `src/index.ts:33-34` (add new constant after existing constants)

**Step 1: Add the PD_TABLE constant**

Add this constant after `MAX_DIFF` in `src/index.ts`:

```typescript
// @see https://handbook.fide.com/chapter/B022024 Section 8.1.2
// Each entry is [maxDiff, PD_H, PD_L] where maxDiff is the upper bound of the
// rating-difference range, PD_H is the scoring probability for the higher-rated
// player, and PD_L is the scoring probability for the lower-rated player.
const PD_TABLE: readonly [number, number, number][] = [
  [3, 0.5, 0.5],
  [10, 0.51, 0.49],
  [17, 0.52, 0.48],
  [25, 0.53, 0.47],
  [32, 0.54, 0.46],
  [39, 0.55, 0.45],
  [46, 0.56, 0.44],
  [53, 0.57, 0.43],
  [61, 0.58, 0.42],
  [68, 0.59, 0.41],
  [76, 0.6, 0.4],
  [83, 0.61, 0.39],
  [91, 0.62, 0.38],
  [98, 0.63, 0.37],
  [106, 0.64, 0.36],
  [113, 0.65, 0.35],
  [121, 0.66, 0.34],
  [129, 0.67, 0.33],
  [137, 0.68, 0.32],
  [145, 0.69, 0.31],
  [153, 0.7, 0.3],
  [162, 0.71, 0.29],
  [170, 0.72, 0.28],
  [179, 0.73, 0.27],
  [188, 0.74, 0.26],
  [197, 0.75, 0.25],
  [206, 0.76, 0.24],
  [215, 0.77, 0.23],
  [225, 0.78, 0.22],
  [235, 0.79, 0.21],
  [245, 0.8, 0.2],
  [256, 0.81, 0.19],
  [267, 0.82, 0.18],
  [278, 0.83, 0.17],
  [290, 0.84, 0.16],
  [302, 0.85, 0.15],
  [315, 0.86, 0.14],
  [328, 0.87, 0.13],
  [344, 0.88, 0.12],
  [357, 0.89, 0.11],
  [374, 0.9, 0.1],
  [391, 0.91, 0.09],
  [411, 0.92, 0.08],
  [432, 0.93, 0.07],
  [456, 0.94, 0.06],
  [484, 0.95, 0.05],
  [517, 0.96, 0.04],
  [559, 0.97, 0.03],
  [619, 0.98, 0.02],
  [735, 0.99, 0.01],
];
```

**Step 2: Run lint to verify no issues**

Run: `pnpm run lint`

Expected: PASS (no errors, constant is used in next task)

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add FIDE §8.1.2 PD_TABLE constant"
```

---

### Task 2: Write failing tests for table-based expected()

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Update existing expected() tests to use exact table values**

In the `ELO Rank tests` describe block, update these tests:

```typescript
it('should calculate expected properly', function () {
  // §8.1.2: diff 200, range 198-206, PD_L = 0.24
  expect(expected(1200, 1400)).toBe(0.24);
});

it('Expect 50/50 chance for equal ranks', function () {
  // §8.1.2: diff 0, range 0-3, PD_H = 0.50
  expect(expected(1000, 1000)).toBe(0.5);
});

it('should be almost 100% chance for 0 rank', function () {
  // diff 1000, capped to 400. §8.1.2: range 392-411, PD_H = 0.92
  expect(expected(1000, 0)).toBe(0.92);
});
```

In the `FIDE Rules` describe block, update the 400-point cap test:

```typescript
it('400-point cap: differences above 400 are treated as 400', () => {
  const capped = expected(1000, 1401);
  const maxDiff = expected(1000, 1400);
  // Both should give same result: diff capped to 400, range 392-411, PD_L = 0.08
  expect(capped).toBe(maxDiff);
  expect(capped).toBe(0.08);
});
```

Update the 2650+ exemption tests to use exact table values:

```typescript
it('does not cap the difference when player A is rated >= 2650', () => {
  // diff 500, range 485-517, PD_H = 0.96
  expect(expected(2700, 2200)).toBe(0.96);
});

it('does not cap the difference when player B is rated >= 2650', () => {
  // diff 500, range 485-517, PD_L = 0.04
  expect(expected(2200, 2700)).toBe(0.04);
});

it('still caps the difference when both players are rated below 2650', () => {
  // diff 549, capped to 400. range 392-411, PD_H = 0.92
  expect(expected(2649, 2100)).toBe(0.92);
});

it('does not cap the difference when player A is rated exactly 2650', () => {
  // diff 550, NO cap. range 518-559, PD_H = 0.97
  expect(expected(2650, 2100)).toBe(0.97);
});

it('does not cap the difference when player B is rated exactly 2650', () => {
  // diff 550, NO cap. range 518-559, PD_L = 0.03
  expect(expected(2100, 2650)).toBe(0.03);
});
```

**Step 2: Add new test for formula fallback when diff > 735**

Add to the `FIDE Rules` describe block:

```typescript
it('falls back to formula for differences > 735 (2650+ exemption)', () => {
  // diff 1000, exceeds table. Use formula: 1 / (1 + 10^(1000/400))
  const result = expected(3200, 2200);
  expect(result).toBeCloseTo(1 / (1 + Math.pow(10, -1000 / 400)), 5);
});
```

**Step 3: Run tests to verify they fail**

Run: `pnpm run test`

Expected: FAIL — existing expected() uses continuous formula, not table values

**Step 4: Commit failing tests**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: update expected() tests for FIDE §8.1.2 table values"
```

---

### Task 3: Implement table-based expected()

**Files:**

- Modify: `src/index.ts` (the `expected` function, lines 71-83)

**Step 1: Rewrite expected() to use PD_TABLE**

Replace the `expected` function body:

```typescript
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

  const absDiff = Math.abs(diff);

  // §8.1.2: For differences beyond the table (> 735), which can only occur
  // via the 2650+ exemption, fall back to the continuous formula.
  if (absDiff > 735) {
    return 1 / (1 + Math.pow(10, diff / 400));
  }

  // §8.1.2: Look up the scoring probability from the FIDE table.
  for (const [maxDiff, pdH, pdL] of PD_TABLE) {
    if (absDiff <= maxDiff) {
      // diff <= 0 means player A is higher-rated or equal → return PD_H
      // diff > 0 means player A is lower-rated → return PD_L
      return diff <= 0 ? pdH : pdL;
    }
  }

  // Should not be reached for valid inputs within the table range,
  // but handles the edge case defensively.
  return diff <= 0 ? 1 : 0;
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm run test`

Expected: PASS — all tests should now pass with table-based values

**Step 3: Run lint**

Run: `pnpm run lint`

Expected: PASS

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat!: switch expected() to FIDE §8.1.2 table lookup

BREAKING CHANGE: expected() now returns discrete values from the official
FIDE table (0.50, 0.51, ..., 1.00) instead of continuous formula values.
For rating differences > 735 (only possible with the 2650+ exemption),
the continuous formula is used as a fallback."
```

---

### Task 4: Add blitz/rapid K-factor source comment

**Files:**

- Modify: `src/index.ts` (the `kFactor` function, line 113)

**Step 1: Add the source comment**

Add a comment above the `if (gameType === 'blitz' || gameType === 'rapid')`
line:

```typescript
  // K=20 for blitz and rapid games per FIDE Rapid & Blitz rating regulations
  // (separate from standard §8.3.3). These regulations mirror the standard
  // K-factor structure but fix K=20 regardless of rating or experience.
  if (gameType === 'blitz' || gameType === 'rapid') {
```

**Step 2: Run lint**

Run: `pnpm run lint`

Expected: PASS

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "docs: cite FIDE source for blitz/rapid K=20 in kFactor()"
```

---

### Task 5: Add integration test for 2650+ exemption through update()

**Files:**

- Modify: `src/__tests__/index.spec.ts`

**Step 1: Add the integration test**

Add to the `FIDE Rules` describe block, after the existing 2650+ exemption
tests:

```typescript
it('2650+ cap exemption propagates through update()', () => {
  // 2700 vs 2200: diff 500, no cap (2700 >= 2650)
  // §8.1.2: range 485-517, PD_H = 0.96 for the 2700-rated player
  // Both K=10 (rating >= 2400)
  // delta_A = 10 * (1 - 0.96) = 0.4 → rounds to 0
  // delta_B = 10 * (0 - 0.04) = -0.4 → rounds to 0
  const [a, b] = update(2700, 2200, 1);
  expect(a).toBe(2700);
  expect(b).toBe(2200);

  // Compare with what a capped result would give:
  // If capped to 400: range 392-411, PD_H = 0.92
  // delta_A = 10 * (1 - 0.92) = 0.8 → rounds to 1
  // delta_B = 10 * (0 - 0.08) = -0.8 → rounds to -1
  // → [2701, 2199] — different from [2700, 2200]
  // This confirms the cap exemption matters in practice.
});
```

**Step 2: Run tests to verify they pass**

Run: `pnpm run test`

Expected: PASS

**Step 3: Commit**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: add integration test for 2650+ cap exemption through update()"
```

---

### Task 6: Update version and changelog

**Files:**

- Modify: `package.json` (version field)
- Modify: `CHANGELOG.md`

**Step 1: Bump version to 4.0.0**

In `package.json`, change `"version": "3.1.0"` to `"version": "4.0.0"`.

**Step 2: Update CHANGELOG.md**

Add under the `## [Unreleased]` section (or replace it):

```markdown
## [4.0.0] - 2026-03-18

### Changed

- **BREAKING:** `expected()` now uses the official FIDE §8.1.2 discrete lookup
  table instead of the continuous formula. Return values are now discrete (0.50,
  0.51, ..., 1.00) matching FIDE exactly. For rating differences > 735 (only
  possible via the 2650+ cap exemption), the continuous formula is used as a
  fallback.

### Added

- Source comment in `kFactor()` citing FIDE Rapid & Blitz regulations for K=20.
- Integration test confirming the 2650+ cap exemption propagates through
  `update()`.
```

**Step 3: Run full pre-PR check**

Run: `pnpm run lint && pnpm run test && pnpm run build`

Expected: All PASS

**Step 4: Commit**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 4.0.0; update CHANGELOG"
```
