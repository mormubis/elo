# Design: `GameType` — Replace `isBlitz`/`isRapid` with a Discriminated Field

**Date:** 2026-02-21 **Status:** Approved

---

## Overview

Replace the mutually exclusive `isBlitz?: boolean` and `isRapid?: boolean`
fields in `KFactorOptions` and `GameOptions` with a single `gameType?: GameType`
field. This makes invalid states (both flags true simultaneously) impossible by
construction.

---

## New Type

```ts
type GameType = 'blitz' | 'rapid' | 'standard';
```

Exported as a named type alongside the existing exported types.

---

## Updated Interfaces

### `KFactorOptions`

Before:

```ts
interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  isBlitz?: boolean;
  isRapid?: boolean;
  rating: number;
}
```

After:

```ts
interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  games?: number;
  rating: number;
}
```

### `GameOptions`

Before:

```ts
interface GameOptions {
  isBlitz?: boolean;
  isRapid?: boolean;
  result: Result;
}
```

After:

```ts
interface GameOptions {
  gameType?: GameType;
  result: Result;
}
```

---

## Implementation Changes

### `kFactor`

Replace `isBlitz`/`isRapid` destructuring with `gameType`. Omitting `gameType`
is treated as `'standard'` implicitly — no explicit default in the signature.

```ts
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  games = 32,
  rating,
}: KFactorOptions) {
  if (gameType === 'blitz' || gameType === 'rapid') {
    return 20;
  }
  // rest of logic unchanged
}
```

### `update`

The two `kFactor` calls inside `update` replace:

```ts
isBlitz: game.isBlitz,
isRapid: game.isRapid,
```

with:

```ts
gameType: game.gameType,
```

---

## Exported Types

Add `GameType` to the export list (alphabetical order):

```ts
export type {
  GameOptions,
  GameType,
  KFactorOptions,
  PlayerOptions,
  Result,
  ResultAndOpponent,
};
```

---

## Breaking Changes

| Old                                 | New                                             |
| ----------------------------------- | ----------------------------------------------- |
| `{ isBlitz: true }`                 | `{ gameType: 'blitz' }`                         |
| `{ isRapid: true }`                 | `{ gameType: 'rapid' }`                         |
| omit both flags                     | omit `gameType` (or `{ gameType: 'standard' }`) |
| `isBlitz` field on `KFactorOptions` | removed                                         |
| `isRapid` field on `KFactorOptions` | removed                                         |
| `isBlitz` field on `GameOptions`    | removed                                         |
| `isRapid` field on `GameOptions`    | removed                                         |

This is a breaking change. Version bumps to **2.1.0** (within the already-open
2.x breaking-change window; `isBlitz`/`isRapid` were already removed from
`UpdateOptions` in 2.0.0 and this completes that cleanup).

---

## Testing

All existing tests that use `{ isBlitz: true }` or `{ isRapid: true }` must be
updated to `{ gameType: 'blitz' }` / `{ gameType: 'rapid' }`. No new test cases
are needed — the existing suite covers the behaviour; only the call sites
change.
