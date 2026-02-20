# `update` Signature Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Replace the flat `UpdateOptions` type with per-player `PlayerOptions`
and game-level `GameOptions`, giving callers a clean symmetric API.

**Architecture:** Two new interfaces (`PlayerOptions`, `GameOptions`) replace
`UpdateOptions` in `src/index.ts`. The `update` function signature changes to
`(a: number | PlayerOptions, b: number | PlayerOptions, resultOrOptions: Result | GameOptions)`.
All existing tests that used the old flat shape are updated to the new shape.
`UpdateOptions` is removed from exports.

**Tech Stack:** TypeScript (strict, NodeNext), Vitest, pnpm.

---

### Task 1: Replace types in `src/index.ts`

**Files:**

- Modify: `src/index.ts`

**Step 1: Replace the `UpdateOptions` interface with `PlayerOptions` and
`GameOptions`**

Remove the entire `UpdateOptions` interface (lines 12–25 in the current file):

```ts
interface UpdateOptions {
  ageA?: number;
  ageB?: number;
  everHigher2400A?: boolean;
  everHigher2400B?: boolean;
  gamesA?: number;
  gamesB?: number;
  isBlitz?: boolean;
  isRapid?: boolean;
  k?: number;
  kA?: number;
  kB?: number;
  result: Result;
}
```

Replace with two new interfaces. Keep `sort-keys` order (alphabetical within
each):

```ts
interface GameOptions {
  isBlitz?: boolean;
  isRapid?: boolean;
  result: Result;
}

interface PlayerOptions {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  k?: number;
  rating: number;
}
```

**Step 2: Update the exports at the bottom of `src/index.ts`**

Change:

```ts
export type { KFactorOptions, Result, ResultAndOpponent, UpdateOptions };
```

to:

```ts
export type {
  GameOptions,
  KFactorOptions,
  PlayerOptions,
  Result,
  ResultAndOpponent,
};
```

(`UpdateOptions` removed, `GameOptions` and `PlayerOptions` added, alphabetical
order.)

**Step 3: Run lint**

```bash
pnpm lint
```

Expected: errors about `UpdateOptions` being used in `update` — that is fine for
now, they will be fixed in Task 2. If there are errors about anything else, fix
those.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add PlayerOptions and GameOptions types, remove UpdateOptions"
```

---

### Task 2: Update the `update` function implementation

**Files:**

- Modify: `src/index.ts`

**Step 1: Replace the `update` function signature and body**

Replace the entire `update` function with:

```ts
/**
 * Updates the Elo ratings of two players based on the result of their game.
 *
 * @param a - The current rating of player A, or a PlayerOptions object.
 * @param b - The current rating of player B, or a PlayerOptions object.
 * @param resultOrOptions - The result of the game (0 for loss, 0.5 for draw, 1 for win)
 *                          or a GameOptions object containing the result and game type.
 * @returns A tuple of the updated ratings for both players.
 */
function update(
  a: number | PlayerOptions,
  b: number | PlayerOptions,
  resultOrOptions: Result | GameOptions,
): [ratingA: number, ratingB: number] {
  const playerA = typeof a === 'number' ? { rating: a } : a;
  const playerB = typeof b === 'number' ? { rating: b } : b;
  const game =
    typeof resultOrOptions === 'number'
      ? { result: resultOrOptions }
      : resultOrOptions;

  // Calculate the expected probabilities of both players winning.
  const [oddsA, oddsB] = [
    expected(playerA.rating, playerB.rating),
    expected(playerB.rating, playerA.rating),
  ];

  // Determine the K-factors for both players, allowing overrides or defaults based on conditions.
  const [kA, kB] = [
    playerA.k ??
      kFactor({
        age: playerA.age,
        everHigher2400: playerA.everHigher2400,
        games: playerA.games,
        isBlitz: game.isBlitz,
        isRapid: game.isRapid,
        rating: playerA.rating,
      }),
    playerB.k ??
      kFactor({
        age: playerB.age,
        everHigher2400: playerB.everHigher2400,
        games: playerB.games,
        isBlitz: game.isBlitz,
        isRapid: game.isRapid,
        rating: playerB.rating,
      }),
  ];

  // Calculate and return the updated ratings for both players, rounded to the nearest integer.
  return [
    Math.round(playerA.rating + delta(game.result, oddsA, kA)),
    Math.round(playerB.rating + delta(1 - game.result, oddsB, kB)),
  ];
}
```

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: clean (no errors, no warnings).

**Step 3: Run tests — expect failures**

```bash
pnpm test
```

Expected: the `performance` tests and `delta`/`kFactor`/`expected` tests all
pass. The `update`-related tests in `'ELO Rank tests'` and `'FIDE Rules'` that
used the old flat `UpdateOptions` shape will fail with TypeScript/type errors.
That is expected — they will be fixed in Task 3.

**Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: refactor update to accept PlayerOptions and GameOptions"
```

---

### Task 3: Update the test call sites

**Files:**

- Modify: `src/__tests__/index.spec.ts`

The following tests use the old `UpdateOptions` flat shape and must be updated
to the new per-player shape. The expected output values do NOT change — only the
call sites change.

**Step 1: Update each affected call site**

Here is the complete mapping of old → new for every affected call in
`src/__tests__/index.spec.ts`:

---

**`'should update rating properly'` (line 21)**

Old:

```ts
const [a, b] = update(1200, 1400, { k: 32, result: 1 });
```

New:

```ts
const [a, b] = update({ k: 32, rating: 1200 }, { k: 32, rating: 1400 }, 1);
```

---

**`'should round rating properly'` (line 29)**

Old:

```ts
const [a, b] = update(1802, 1186, { k: 32, result: 1 });
```

New:

```ts
const [a, b] = update({ k: 32, rating: 1802 }, { k: 32, rating: 1186 }, 1);
```

---

**`'Equal rating - newly player'` (lines 133, 138, 144)**

Old:

```ts
const [a, b] = update(1400, 1400, { gamesA: 0, result: 1 });
const [c, d] = update(1400, 1400, { gamesA: 30, result: 1 });
const [established, establishedB] = update(1400, 1400, {
  gamesA: 31,
  result: 1,
});
```

New:

```ts
const [a, b] = update({ games: 0, rating: 1400 }, 1400, 1);
const [c, d] = update({ games: 30, rating: 1400 }, 1400, 1);
const [established, establishedB] = update(
  { games: 31, rating: 1400 },
  1400,
  1,
);
```

---

**`'Equal rating - newly player B'` (line 154)**

Old:

```ts
const [a, b] = update(1400, 1400, { gamesB: 0, result: 1 });
```

New:

```ts
const [a, b] = update(1400, { games: 0, rating: 1400 }, 1);
```

---

**`'Equal rating - young player'` (lines 161, 166, 172)**

Old:

```ts
const [a, b] = update(1400, 1400, { ageA: 5, result: 1 });
const [c, d] = update(1400, 1400, { ageA: 17, result: 1 });
const [adult, adultB] = update(1400, 1400, { ageA: 18, result: 1 });
```

New:

```ts
const [a, b] = update({ age: 5, rating: 1400 }, 1400, 1);
const [c, d] = update({ age: 17, rating: 1400 }, 1400, 1);
const [adult, adultB] = update({ age: 18, rating: 1400 }, 1400, 1);
```

---

**`'Equal rating - young player - but not more than 2300'` (line 179)**

Old:

```ts
const [a, b] = update(2300, 2300, { ageA: 15, result: 1 });
```

New:

```ts
const [a, b] = update({ age: 15, rating: 2300 }, 2300, 1);
```

---

**`'Equal rating - less than 2400 but ever above 2400 (player A)'` (line 193)**

Old:

```ts
const [a, b] = update(2300, 2300, { everHigher2400A: true, result: 1 });
```

New:

```ts
const [a, b] = update({ everHigher2400: true, rating: 2300 }, 2300, 1);
```

---

**`'Equal rating - less than 2400 but ever above 2400 (player B)'` (line 200)**

Old:

```ts
const [a, b] = update(2300, 2300, { everHigher2400B: true, result: 1 });
```

New:

```ts
const [a, b] = update(2300, { everHigher2400: true, rating: 2300 }, 1);
```

---

**`'Equal rating - blitz game'` (lines 207, 212, 217)**

Old:

```ts
const [a, b] = update(1400, 1400, { isBlitz: true, result: 1 });
const [c, d] = update(2300, 2300, { isBlitz: true, result: 1 });
const [elite, eliteB] = update(2400, 2400, { isBlitz: true, result: 1 });
```

New:

```ts
const [a, b] = update(1400, 1400, { isBlitz: true, result: 1 });
const [c, d] = update(2300, 2300, { isBlitz: true, result: 1 });
const [elite, eliteB] = update(2400, 2400, { isBlitz: true, result: 1 });
```

_(No change — `GameOptions` has the same `isBlitz`/`isRapid`/`result` shape as
the old flat object for game-level-only options.)_

---

**`'Equal rating - rapid game'` (lines 224, 229)**

Old:

```ts
const [a, b] = update(1400, 1400, { isRapid: true, result: 1 });
const [c, d] = update(2400, 2400, { isRapid: true, result: 1 });
```

New: _(No change — same as above, `GameOptions` shape is compatible.)_

---

**`'Explicit kA and kB overrides are respected'` (line 236)**

Old:

```ts
const [a, b] = update(1400, 1400, { kA: 40, kB: 10, result: 1 });
```

New:

```ts
const [a, b] = update({ k: 40, rating: 1400 }, { k: 10, rating: 1400 }, 1);
```

---

**`'Explicit k override applies to both players'` (line 243)**

Old:

```ts
const [a, b] = update(1400, 1400, { k: 32, result: 1 });
```

New:

```ts
const [a, b] = update({ k: 32, rating: 1400 }, { k: 32, rating: 1400 }, 1);
```

---

**Step 2: Run the full test suite**

```bash
pnpm test
```

Expected: all 41 tests pass.

**Step 3: Run lint**

```bash
pnpm lint
```

Expected: clean.

**Step 4: Commit**

```bash
git add src/__tests__/index.spec.ts
git commit -m "test: update call sites to use PlayerOptions and GameOptions"
```

---

### Task 4: Bump version to 2.0.0 and update CHANGELOG

**Files:**

- Modify: `package.json`
- Modify: `CHANGELOG.md`

**Step 1: Bump version in `package.json`**

Change:

```json
"version": "1.1.0"
```

to:

```json
"version": "2.0.0"
```

**Step 2: Add `[2.0.0]` entry to `CHANGELOG.md`**

Insert after `## [Unreleased]`:

````md
## [2.0.0] - 2026-02-21

### Changed

- `update()` now accepts `PlayerOptions` objects for `a` and `b` parameters,
  allowing per-player options (`age`, `games`, `everHigher2400`, `k`) to be
  passed directly on each player argument
- Game-level options (`isBlitz`, `isRapid`, `result`) are now passed as a
  `GameOptions` object in the third argument

### Removed

- `UpdateOptions` type removed from public API; use `PlayerOptions` and
  `GameOptions` instead
- `kA`, `kB`, `k` (shared) fields removed from third argument; use `k` on each
  `PlayerOptions` object instead

### Migration

```ts
// Before
update(1400, 1600, { ageA: 17, gamesB: 5, kA: 40, result: 1 });

// After
update({ age: 17, k: 40, rating: 1400 }, { games: 5, rating: 1600 }, 1);
```
````

````

Also add the comparison link at the bottom of `CHANGELOG.md`:

```md
[2.0.0]: https://github.com/mormubis/elo/compare/v1.1.0...v2.0.0
````

And update the `[Unreleased]` link:

```md
[Unreleased]: https://github.com/mormubis/elo/compare/v2.0.0...HEAD
```

**Step 3: Run the full pre-PR check**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: all pass.

**Step 4: Commit and push**

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v2.0.0"
git push
```
