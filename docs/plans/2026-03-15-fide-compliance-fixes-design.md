# Design: FIDE Compliance Fixes — v3.1.0

**Date:** 2026-03-15 **Status:** Approved **Version bump:** 3.0.0 → 3.1.0 (minor
— behavior change)

## Overview

Two FIDE compliance bugs are present in the current codebase:

1. `expected()` applies the 400-point rating difference cap unconditionally,
   violating the §8.3.1 amendment effective 1 October 2025 that exempts players
   rated 2650 or above.
2. `update()` uses `Math.round`, which rounds 0.5 toward +∞ in JavaScript,
   violating §8.3.4 which requires 0.5 to be rounded away from zero.

Both fixes are internal-only. No public API changes, no new exports.

---

## Fix 1 — `expected()`: §8.3.1 cap exemption for 2650+ players

### Regulation

> FIDE §8.3.1 (effective 1 October 2025): "A difference in rating of more than
> 400 points shall be counted for rating purposes as though it were a difference
> of 400 points for players rated below 2650. For players rated 2650 and above,
> the difference between ratings shall be used in all cases."

### Current behaviour

`expected(a, b)` always clamps the rating difference to ±400 regardless of
either player's rating. This under-estimates win probability for very high-rated
players facing much weaker opponents.

### Fix

Add a `HIGH_RATED_THRESHOLD = 2650` constant alongside `MAX_DIFF`. In
`expected(a, b)`, skip the clamp when **either** player is rated ≥2650:

```ts
const HIGH_RATED_THRESHOLD = 2650;

function expected(a: number, b: number): number {
  const diff =
    a >= HIGH_RATED_THRESHOLD || b >= HIGH_RATED_THRESHOLD
      ? b - a
      : Math.min(Math.max(b - a, -MAX_DIFF), MAX_DIFF);

  return 1 / (1 + Math.pow(10, diff / 400));
}
```

**Rationale for "either player" interpretation:** The regulation is per-player.
A 2650+ player is always exempt from the cap regardless of their opponent's
rating. If we required both players to be ≥2650 to skip the cap, a 2650-rated
player would be incorrectly capped when facing a weaker opponent.

### JSDoc update

Add `@see` comment referencing §8.3.1 and document the 2650 threshold.

---

## Fix 2 — `update()`: §8.3.4 rounding away from zero

### Regulation

> FIDE §8.3.4: "The Rating Change for a Rating Period is rounded to the nearest
> whole number. 0.5 is rounded away from zero."

### Current behaviour

`update()` uses `Math.round(...)`. In JavaScript, `Math.round(-0.5)` returns `0`
(rounds toward +∞), not `-1`. A player who should lose 1 point loses 0.

### Fix

Add a private `roundHalfAwayFromZero` helper and use it in place of `Math.round`
in `update()`:

```ts
function roundHalfAwayFromZero(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x));
}
```

Replace both `Math.round(...)` calls in `update()`:

```ts
return [
  roundHalfAwayFromZero(playerA.rating + delta(game.result, oddsA, kA)),
  roundHalfAwayFromZero(playerB.rating + delta(1 - game.result, oddsB, kB)),
];
```

### JSDoc update

Add `@see` comment on `update()` referencing §8.3.4 and note the rounding
convention.

---

## Tests

New test cases to add in `src/__tests__/index.spec.ts`:

### `expected()`

- `expected(2700, 2200)` — 500-point difference, 2700-rated player: cap should
  NOT apply, result should differ from the clamped value.
- `expected(2200, 2700)` — same matchup from the other side.
- `expected(2649, 2200)` — just below threshold: cap still applies (boundary).

### `update()`

- A game where the computed delta is exactly `+0.5` → should round to `+1`.
- A game where the computed delta is exactly `−0.5` → should round to `−1`
  (currently rounds to `0`).

---

## Documentation changes

| File           | Change                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/index.ts` | Update JSDoc on `expected()` and `update()`; add `HIGH_RATED_THRESHOLD` constant with `@see §8.3.1` comment |
| `README.md`    | Update §8.3.1 bullet to mention the 2650 exemption                                                          |
| `CHANGELOG.md` | Add `[3.1.0]` entry with two `Fixed` items citing §8.3.1 and §8.3.4                                         |
| `package.json` | Bump version `3.0.0` → `3.1.0`                                                                              |

---

## Out of scope

- Input validation for `expected()`, `delta()`, `update()`, `performance()`
- `initial()` minimum-games and 1400-floor enforcement (§7.1.4)
- Any new exported functions or types
