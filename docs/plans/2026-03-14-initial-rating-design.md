# Design: `initial()` — FIDE §8.2 Initial Rating

**Date:** 2026-03-14  
**Status:** Approved

## Context

The library implements FIDE rating rules and currently exports five functions:
`delta`, `expected`, `kFactor`, `performance`, `update`. The `performance()`
function (§8.2.3) computes a tournament performance rating for a rated player.

There is no function for computing the first published rating of an unrated
player (§8.2), which uses a different formula. This is a genuine FIDE compliance
gap.

## What We Are Building

A new exported function `initial(games)` that implements FIDE §8.2 — the formula
for assigning a first rating to a previously unrated player.

## Why Not Extend `performance()`

Both functions share `Ra + dp` arithmetic but serve different purposes and apply
different rules:

|                        | `performance()`                                   | `initial()`                                              |
| ---------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Purpose                | Evaluate tournament performance of a rated player | Assign first rating to unrated player                    |
| FIDE section           | §8.2.3                                            | §8.2                                                     |
| Hypothetical opponents | No                                                | Yes — two 1800-rated draws injected                      |
| Rating cap             | No                                                | 2200                                                     |
| Caller responsibility  | None                                              | Filter out zero-score first event if applicable (§8.2.1) |

Conflating them in one function with a flag would obscure intent and make both
harder to document and test.

## Function Signature

```ts
function initial(games: ResultAndOpponent[]): number;
```

Reuses the existing `ResultAndOpponent` type — no new types are needed.

Returns the initial rating as an integer.

## Algorithm

1. Throw `RangeError` if `games` is empty.
2. Inject two hypothetical opponents internally:
   `{ opponentRating: 1800, result: 0.5 }` × 2 (§8.2.2).
3. Compute `Ra` = average opponent rating across all games (real +
   hypothetical).
4. Compute `p` = total score / total games (real + hypothetical).
5. Look up `dp` in `DP_TABLE` using `Math.round(p * 100)` as index.
6. Throw `RangeError` if `dp` is `undefined` (invalid result values).
7. Return `Math.min(Math.round(Ra + dp), 2200)`.

## Zero-Score Discard (§8.2.1)

> If an unrated player scores zero in their first event this score is
> disregarded.

This rule requires event-level context that a flat `ResultAndOpponent[]` cannot
encode. The caller is responsible for filtering out a zero-score first event
before passing games to `initial()`. This is consistent with how `performance()`
works — it operates on whatever games are passed.

## Internal Structure

No shared helper is extracted. `performance()` and `initial()` remain
independent. The overlap is small (a few lines) and keeping them separate makes
each function easier to read and reason about in isolation.

## Exports

```ts
export { delta, expected, initial, kFactor, performance, update };
```

`ResultAndOpponent` is already exported and covers the input type. No new types
are added to the public API.

## Testing

- Throws `RangeError` for empty array.
- Injects two hypothetical 1800-rated draws correctly (verify via known inputs).
- Caps result at 2200.
- Results cross-checked against FIDE calculator where possible.
- Covers edge cases: all wins, all losses, all draws, single game, mixed
  results.
