# Design: `update` Signature Refactor

**Date:** 2026-02-21 **Status:** Approved

---

## Overview

Refactor the `update` function signature so that player-specific options are
passed per-player rather than as a flat merged object. Removes the awkward
`ageA`/`ageB`, `gamesA`/`gamesB`, `kA`/`kB` naming pattern from `UpdateOptions`
and replaces it with two clean, symmetric types.

This is a **breaking change** — `UpdateOptions` is removed from the public API.
Version bumps to **2.0.0**.

---

## New Types

`UpdateOptions` is removed. Two new interfaces replace it:

```ts
interface PlayerOptions {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  k?: number; // K-factor override (replaces kA / kB / k)
  rating: number; // required
}

interface GameOptions {
  isBlitz?: boolean;
  isRapid?: boolean;
  result: Result; // required
}
```

Both are exported. `UpdateOptions` is removed from exports.

---

## Signature

Union types — no overloads:

```ts
function update(
  a: number | PlayerOptions,
  b: number | PlayerOptions,
  resultOrOptions: Result | GameOptions,
): [ratingA: number, ratingB: number];
```

All combinations of `number | PlayerOptions` for each player and
`Result | GameOptions` for the third argument are valid.

---

## Implementation

Normalise arguments at the top of the function body:

```ts
const playerA = typeof a === 'number' ? { rating: a } : a;
const playerB = typeof b === 'number' ? { rating: b } : b;
const game =
  typeof resultOrOptions === 'number'
    ? { result: resultOrOptions }
    : resultOrOptions;
```

K-factor resolution (in priority order):

1. `playerA.k` / `playerB.k` — explicit override
2. `kFactor({ rating, age, games, everHigher2400, isBlitz, isRapid })` — auto

`isBlitz` and `isRapid` come from `game` and are passed into `kFactor` for both
players, unchanged from current behaviour.

The rest of the implementation (`expected`, `delta`, `Math.round`) is unchanged.

---

## Preserved Behaviour

- `update(1400, 1600, 1)` — bare numbers + bare result, fully preserved.
- `update(1400, 1600, { result: 1, isBlitz: true })` — game options only.
- `update({ rating: 1400, age: 17 }, 1600, 1)` — one player with options.
- `update({ rating: 1400, k: 40 }, { rating: 1600, k: 10 }, { result: 1 })` —
  explicit K-factor overrides per player.

---

## Breaking Changes

| Old                                               | New                                              |
| ------------------------------------------------- | ------------------------------------------------ |
| `{ ageA, ageB }`                                  | `a: { age }`, `b: { age }`                       |
| `{ gamesA, gamesB }`                              | `a: { games }`, `b: { games }`                   |
| `{ everHigher2400A, everHigher2400B }`            | `a: { everHigher2400 }`, `b: { everHigher2400 }` |
| `{ kA, kB, k }`                                   | `a: { k }`, `b: { k }`                           |
| `{ isBlitz, isRapid, result }` (in UpdateOptions) | `GameOptions` (same fields)                      |
| `UpdateOptions` exported type                     | removed; use `PlayerOptions` + `GameOptions`     |

---

## Versioning

Bump `package.json` version to `2.0.0` and add a `[2.0.0]` entry to
`CHANGELOG.md` documenting the breaking change.

---

## Testing

Update all existing tests in `src/__tests__/index.spec.ts` that use the old
`UpdateOptions` flat shape to use the new `PlayerOptions` / `GameOptions` shape.
No new test cases are needed — the existing suite covers all the behaviour; only
the call sites change.
