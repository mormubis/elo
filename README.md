# ELO

[![npm](https://img.shields.io/npm/v/@echecs/elo)](https://www.npmjs.com/package/@echecs/elo)
[![Coverage](https://codecov.io/gh/mormubis/elo/branch/main/graph/badge.svg)](https://codecov.io/gh/mormubis/elo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![API Docs](https://img.shields.io/badge/API-docs-blue.svg)](https://mormubis.github.io/elo/)

**ELO** is a small TypeScript library for calculating
[Elo ratings](https://en.wikipedia.org/wiki/Elo_rating_system) — the system used
in chess and many other competitive games to measure relative skill.

It follows [FIDE rules](https://handbook.fide.com/chapter/B022024) out of the
box: K-factors by age, games played, and rating tier; a 400-point rating
difference cap; and performance rating calculation. Zero runtime dependencies.

## Why this library?

Most Elo libraries on npm give you the basic formula and nothing else. If you're
building a chess platform or any app that follows FIDE rules, you'd have to
implement the rest yourself. This library ships it all out of the box:

- **FIDE K-factor rules** — K=40 for new players (≤ 30 games) and juniors (age <
  18, rating < 2300), K=10 for players who have ever reached 2400, K=20 for
  everyone else. Includes the §8.3.3 per-period cap: if K × n > 700, K is
  reduced so the total change stays within bounds.
- **Game type awareness** — blitz and rapid games always use K=20, regardless of
  rating or experience, matching FIDE §B02.
- **Official FIDE scoring table** — win probabilities come from the discrete
  §8.1.2 lookup table, not an approximation formula. Rating differences above
  400 are clamped as required by §8.3.1; players rated 2650 or above are exempt
  from this cap (effective 1 October 2025). Most libraries skip both rules.
- **Performance rating** — calculates a player's FIDE performance rating
  (§8.2.3) over a series of games. No other Elo library on npm implements this.
- **Initial rating calculation** — computes a new player's first published
  rating (§8.2) using the FIDE hypothetical-opponent adjustment and 2200 cap. No
  other Elo library on npm implements this.

If you don't need FIDE compliance, any Elo library will do. If you do, this is
the one.

## Installation

```bash
npm install @echecs/elo
```

## Quick Start

```typescript
import { update } from '@echecs/elo';

// Two players both rated 1400. Player A wins.
const [playerA, playerB] = update(1400, 1400, 1);

console.log(playerA); // 1410
console.log(playerB); // 1390
```

## Usage

**Basic** — when you just need new ratings after a game:

```typescript
import { update } from '@echecs/elo';

const [newRatingA, newRatingB] = update(1400, 1400, 1); // → [1410, 1390]
```

**Player options** — pass a player object when you need to apply FIDE K-factor
rules for age or experience:

```typescript
import { update } from '@echecs/elo';

// Young player (age < 18, rating < 2300) gets K=40
const [newRatingA, newRatingB] = update({ age: 15, rating: 1400 }, 1400, 1); // → [1420, 1390]

// New player (≤ 30 games played) also gets K=40
const [newRatingC, newRatingD] = update(
  { gamesPlayed: 10, rating: 1400 },
  1400,
  1,
); // → [1420, 1390]
```

**Game options** — pass a game object as the third argument when the game type
affects the K-factor:

```typescript
import { update } from '@echecs/elo';

// Blitz and rapid games always use K=20
const [newRatingA, newRatingB] = update(2400, 2400, {
  gameType: 'blitz',
  result: 1,
}); // → [2410, 2390]
```

**K-factor cap** — pass `gamesInPeriod` when a player has played many games in
the current rating period and the §8.3.3 cap applies:

```typescript
import { update } from '@echecs/elo';

// New player (K=40) with 18 games played in the period — K is capped to 38
const [newRatingA, newRatingB] = update(
  { gamesInPeriod: 18, gamesPlayed: 0, rating: 1400 },
  1400,
  1,
); // → [1419, 1390]
```

**Performance rating** — use `performance()` to calculate a player's FIDE
performance rating over a tournament:

```typescript
import { performance } from '@echecs/elo';

const rating = performance([
  { opponentRating: 1600, result: 1 },
  { opponentRating: 1600, result: 0.5 },
  { opponentRating: 1600, result: 0 },
]); // 1600
```

**Initial rating** — use `initial()` to calculate a new (unrated) player's first
FIDE rating. If the player scored zero points across their entire first event,
omit all games from that event before calling (§8.2.1):

```typescript
import { initial } from '@echecs/elo';

const rating = initial([
  { opponentRating: 1600, result: 1 },
  { opponentRating: 1500, result: 0.5 },
  { opponentRating: 1700, result: 0 },
  { opponentRating: 1600, result: 1 },
  { opponentRating: 1550, result: 1 },
]); // → 1752
```

## API

Full API reference is available at https://mormubis.github.io/elo/

### Functions

#### `update(a, b, resultOrOptions)`

Updates the Elo ratings of two players after a game. Returns a tuple
`[ratingA, ratingB]` with the new ratings rounded per FIDE §8.3.4.

```typescript
function update(
  a: number | PlayerOptions,
  b: number | PlayerOptions,
  resultOrOptions: Result | GameOptions,
): [ratingA: number, ratingB: number];
```

#### `kFactor(options)`

Returns the FIDE K-factor for a player given their profile. Decision order:

1. `gameType === 'blitz' | 'rapid'` → 20
2. `gamesPlayed <= 30` or `(age < 18 && rating < 2300)` → 40
3. `rating >= 2400 || everHigher2400` → 10
4. otherwise → 20

If `gamesInPeriod` is set and `K × gamesInPeriod > 700`, K is reduced to
`Math.floor(700 / gamesInPeriod)` per §8.3.3.

```typescript
function kFactor(options: KFactorOptions): number;
```

#### `expected(a, b)`

Returns the expected win probability for player A against player B, using the
FIDE §8.1.2 discrete lookup table. Rating differences are clamped to ±400 unless
either player is rated ≥ 2650 (§8.3.1).

```typescript
function expected(a: number, b: number): number;
```

#### `delta(actual, expected, k)`

Returns the raw rating change: `k * (actual - expected)`. Use this when you need
the unrounded delta before applying it to a rating.

```typescript
function delta(actual: number, expected: number, k: number): number;
```

#### `performance(games)`

Calculates a player's FIDE performance rating (§8.2.3) over a series of games.
Throws `RangeError` if `games` is empty or contains invalid result values.

```typescript
function performance(games: ResultAndOpponent[]): number;
```

#### `initial(games)`

Calculates an unrated player's first FIDE published rating (§8.2). Injects two
hypothetical 1800-rated draws, caps the result at 2200. Throws `RangeError` if
`games` is empty.

```typescript
function initial(games: ResultAndOpponent[]): number;
```

---

### Types

#### `Result`

```typescript
type Result = 0 | 0.5 | 1;
```

Game outcome from the perspective of player A: `1` = win, `0.5` = draw, `0` =
loss.

#### `GameType`

```typescript
type GameType = 'blitz' | 'rapid' | 'standard';
```

#### `GameOptions`

Options for a single game passed as the third argument to `update()`.

```typescript
interface GameOptions {
  gameType?: GameType;
  result: Result;
}
```

#### `PlayerOptions`

Per-player options for `update()`. All fields except `rating` are optional.

```typescript
interface PlayerOptions {
  age?: number; // player's age — affects K-factor for juniors (< 18)
  everHigher2400?: boolean; // whether the player has ever been rated ≥ 2400
  gamesInPeriod?: number; // games played this rating period — used for §8.3.3 cap
  gamesPlayed?: number; // total career games — new players (≤ 30) get K=40
  k?: number; // override computed K-factor entirely
  rating: number; // current rating
}
```

The `k` field bypasses all FIDE K-factor logic and uses the supplied value
directly.

#### `KFactorOptions`

Options for `kFactor()`. Mirrors `PlayerOptions` minus the `k` override.

```typescript
interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  gamesInPeriod?: number;
  gamesPlayed?: number;
  rating: number;
}
```

#### `ResultAndOpponent`

A single game result used by `performance()` and `initial()`.

```typescript
interface ResultAndOpponent {
  opponentRating: number;
  result: Result;
}
```
