# Design: §8.3.3 K-Factor Cap

**Date:** 2026-03-14  
**Status:** Approved

## Context

`kFactor()` currently returns `10 | 20 | 40` based on player attributes. It does
not implement the §8.3.3 cap rule: if `K × n > 700` in a rating period (where
`n` is the number of games played that period), K must be reduced to the largest
whole number where `K × n ≤ 700`.

This means a new player (K=40) playing 18 games in a period currently
accumulates up to 720 points of potential change instead of the 700 maximum FIDE
allows.

## What We Are Building

Add an optional `gamesInPeriod` field to `KFactorOptions` (and transitively
`PlayerOptions`). When provided, `kFactor()` applies the §8.3.3 cap after
determining the base K. No other functions change.

## Cap Thresholds

| Base K | Games before cap kicks in       |
| ------ | ------------------------------- |
| 40     | 18+ games (40 × 18 = 720 > 700) |
| 20     | 36+ games (20 × 36 = 720 > 700) |
| 10     | 71+ games (10 × 71 = 710 > 700) |

## Changes

### `KFactorOptions` interface

Add one optional field:

```ts
interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  gamesInPeriod?: number; // NEW — games played in the current rating period
  gamesPlayed?: number;
  rating: number;
}
```

### `kFactor()` function

After determining the base K (10, 20, or 40), apply the cap:

```ts
if (gamesInPeriod !== undefined && k * gamesInPeriod > 700) {
  k = Math.floor(700 / gamesInPeriod);
}
```

Guard: throw `RangeError` if `gamesInPeriod < 1`.

### Return type: breaking change

`kFactor()` currently returns `10 | 20 | 40`. With the cap, the return value is
an arbitrary integer (e.g. 38, 19, 9). The return type must change to `number`.

This is a **semver major change** — callers typed against the literal union
`10 | 20 | 40` will break. Callers using `update()` only are unaffected (the `k`
field in `PlayerOptions` is already `number`).

Version bump: **3.0.0**

### `PlayerOptions` interface

`PlayerOptions` passes through to `kFactor()`, so `gamesInPeriod` is available
in `update()` automatically. No changes needed to `PlayerOptions` or `update()`.

```ts
// Already works after KFactorOptions change:
update({ gamesInPeriod: 18, gamesPlayed: 5, rating: 1400 }, 1600, 1);
```

## Error Handling

- `gamesInPeriod` omitted → no cap applied, behaviour identical to today
- `gamesInPeriod < 1` → `RangeError('gamesInPeriod must be at least 1')`
- `gamesInPeriod` valid but below cap threshold → uncapped K returned as-is

## Testing

- `gamesInPeriod` omitted — all existing K-factor cases unchanged (no
  regression)
- Below cap threshold — uncapped K returned (K=40, n=17 → 40)
- At exact threshold — uncapped K returned (K=40, n=17 → 40; K=20, n=35 → 20)
- Above threshold — capped K returned (K=40, n=18 → 38; K=20, n=36 → 19; K=10,
  n=71 → 9)
- `gamesInPeriod: 0` — throws `RangeError`
- `update()` with `gamesInPeriod` on a player — capped K applied correctly

## Migration

```ts
// Before — return type was 10 | 20 | 40
const k: 10 | 20 | 40 = kFactor({ rating: 1400 });

// After — return type is number
const k: number = kFactor({ rating: 1400 });

// New capability
const k = kFactor({ gamesInPeriod: 18, gamesPlayed: 5, rating: 1400 }); // → 38
```
