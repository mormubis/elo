# Design: `performance` Rating Function

**Date:** 2026-02-20 **Status:** Approved

---

## Overview

Add a `performance` function that calculates a player's performance rating over
a series of games, following FIDE Rating Regulations §8.2.3 (effective 1 March
2024).

Reference: https://handbook.fide.com/chapter/B022024

---

## API

```ts
interface ResultAndOpponent {
  opponentRating: number;
  result: Result; // 0 | 0.5 | 1
}

function performance(games: ResultAndOpponent[]): number;
```

- `games` — array of game results, each pairing an opponent's rating with the
  player's result from that game.
- Returns the performance rating as a rounded integer.
- `ResultAndOpponent` is exported as a named type alongside the existing types.
- `performance` is added to the named exports in `src/index.ts`.

---

## Algorithm

Implements FIDE §8.2.3: `Ru = Ra + dp`, rounded to the nearest integer.

1. Throw a `RangeError` if `games` is empty (undefined result).
2. Compute `Ra` = average of all `opponentRating` values.
3. Compute `p` = total score / number of games.
4. Round `p` to the nearest 0.01, then multiply by 100 to get an integer index
   in the range 0–100.
5. Look up `dp` in `DP_TABLE` using that index.
6. Return `Math.round(Ra + dp)`.

---

## Data: DP_TABLE

A module-level constant `DP_TABLE: Record<number, number>` with 101 entries,
keyed by `p * 100` (integer 0–100). Values are copied verbatim from FIDE §8.1.1.

```
p=0   → dp=-800    p=50  → dp=0     p=100 → dp=800
p=1   → dp=-677    p=51  → dp=7     ...
...
```

This is a fixed FIDE-defined spec artifact and lives as a constant in
`src/index.ts` alongside the existing code.

---

## Edge Cases

| Case                   | Behaviour                                       |
| ---------------------- | ----------------------------------------------- |
| Empty `games` array    | Throw `RangeError('games must not be empty')`   |
| `p = 0.0` (all losses) | `dp = -800` per FIDE table — returns `Ra - 800` |
| `p = 1.0` (all wins)   | `dp = 800` per FIDE table — returns `Ra + 800`  |

---

## Placement

Everything lives in `src/index.ts`, consistent with the single-file library
architecture. No new files are created.

---

## Testing

Tests live in `src/__tests__/index.spec.ts` in a new `describe('performance')`
block. Cases:

- Empty array throws `RangeError`.
- `p = 0.5` (all draws) → result equals `Ra` (dp = 0).
- `p = 0.0` (all losses) → result equals `Ra - 800`.
- `p = 1.0` (all wins) → result equals `Ra + 800`.
- Mixed results cross-checked against the FIDE online calculator at
  https://ratings.fide.com/calc.phtml?page=change.
