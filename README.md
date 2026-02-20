# ELO

[![npm](https://img.shields.io/npm/v/@echecs/elo)](https://www.npmjs.com/package/@echecs/elo)
[![Test](https://github.com/mormubis/elo/actions/workflows/test.yml/badge.svg)](https://github.com/mormubis/elo/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/mormubis/elo/branch/main/graph/badge.svg)](https://codecov.io/gh/mormubis/elo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**ELO** is part of the **ECHECS** project, providing an implementation of the
[ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system) following
[FIDE rules](https://handbook.fide.com/chapter/B022024).

## Installation

```bash
npm install @echecs/elo
```

## Usage

### Basic Usage

```typescript
import { update } from '@echecs/elo';

const ratingA = 1400;
const ratingB = 1400;
const result = 1; // Possible values: 1, 0, 0.5

const [newRatingA, newRatingB] = update(ratingA, ratingB, result); // [1410, 1390]
```

### Advanced Usage

```typescript
import { update } from '@echecs/elo';

const ratingA = 1400;
const ratingB = 1400;
const result = 1; // Possible values: 1, 0, 0.5

const [newRatingA, newRatingB] = update(ratingA, ratingB, { result, ageA: 15 }); // [1420, 1390]
```

## API

### `delta(actual: number, expected: number, kFactor: number): number`

Calculates the ELO difference after a game. Parameters:

- `actual`: The game result (e.g., 1 for a win, 0 for a loss, 0.5 for a draw).
- `expected`: The expected outcome probability.
- `kFactor`: The
  [maximum adjustment per game](https://en.wikipedia.org/wiki/Elo_rating_system#Most_accurate_K-factor).

```typescript
import { delta } from '@echecs/elo';

const diff = delta(0.5, 0.8, 10); // -2
```

### `expected(a: number, b: number): number`

Returns the win probability for player `a` against player `b`.

```typescript
import { expected } from '@echecs/elo';

const odds1 = expected(1400, 1400); // 0.5
const odds2 = expected(1400, 1600); // 0.2402530733520421
```

### `kFactor(options: { age?: number, everHigher2400?: boolean, games?: number, isBlitz?: boolean, isRapid?: boolean, rating: number }): number`

Calculates the K Factor based on various parameters.

- `age`: Age of the player. If under 18 and rating < 2300, K Factor is 40.
- `everHigher2400`: True if the player has ever reached a rating of 2400 or
  higher. If true, K Factor is 10.
- `games`: Number of games played. Higher K Factor for fewer games.
- `isBlitz` or `isRapid`: True if the game is Blitz or Rapid. K Factor is
  always 20.
- `rating`: Current player rating (required).

```typescript
import { kFactor } from '@echecs/elo';

const k1 = kFactor({ rating: 1400 }); // 20
const k2 = kFactor({ games: 10, rating: 1400 }); // 40
```

### `update(a: number, b: number, result: 0 | 0.5 | 1 | UpdateResult): [number, number]`

Updates the ratings of players `a` and `b`. The `result` parameter can be a
simple score (0, 0.5, or 1) from player A's perspective, or a complex object to
adhere to FIDE rules.

**Result Object Additional Options**:

- `ageA`, `ageB`: Age of players A and B.
- `everHigher2400A`, `everHigher2400B`: Whether players A or B have ever reached
  2400 rating.
- `gamesA`, `gamesB`: Number of games played by players A and B.
- `isBlitz`, `isRapid`: Whether the game is Blitz or Rapid.
- `k`, `kA`, `kB`: K Factors to use for calculations.

**Basic usage**:

```typescript
import { update } from '@echecs/elo';

const ratingA = 1400;
const ratingB = 1400;
const result = 1;

const [newRatingA, newRatingB] = update(ratingA, ratingB, result); // [1410, 1390]
```

**Advanced usage**:

```typescript
import { update } from '@echecs/elo';

const ratingA = 1400;
const ratingB = 1400;
const result = 1;

const [newRatingA, newRatingB] = update(ratingA, ratingB, {
  result,
  gamesA: 10,
}); // [1420, 1390]
```
