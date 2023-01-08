# ELO

**ELO** is part of the **ECHECS** project. **ELO** is an implementation of the
[ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system) following FIDE rules.

## Installation

```bash
npm install --save-dev @echecs/elo
```

```bash
yarn add @echecs/elo
```

## Usage

### Basic

```typescript
const ratingA = 1400;
const ratingB = 1400;
const result = 1; // Or 0 or 0.5

const [newRatingA, newRatingB] = update(ratingA, ratingB, 1); // [1410, 1390]
```

### Advance

```typescript
const ratingA = 1400;
const ratingB = 1400;
const result = 1; // Or 0 or 0.5

const [newRatingA, newRatingB] = update(ratingA, ratingB, { result, ageA: 15 }); // [1420, 1390]
```

## API

delta, expected, kFactor, update

### `delta(actual: number, expected: number, kFactor: number): number`

`delta` outputs the ELO difference after the game where `actual` is the result
of the game, `expected` were the odds of the game, and `kFactor` is the
[maximum adjustment per game](https://en.wikipedia.org/wiki/Elo_rating_system#Most_accurate_K-factor).

```typescript
import { delta } from "@echecs/elo";

const diff = delta(0.5, 0.8, 10); // -2
```

### `expected(a: number, b: number): number`

`expected` returns a number that represents the odds for a certain player `a`
to win against `b`. The returned value should be greater than 0 and less
than 1 (0 < `expected` < 1)

```typescript
import { expected } from "@echecs/elo";

const ratingA = 1400;
const ratingB = 1400;

const odds = expected(ratingA, ratingB); // 0.5

const ratingC = 1400;
const ratingD = 1600;

const odds = expected(ratingA, ratingB); // 0.2402530733520421
```

### `kFactor({ age?: number, everHigher2400?: boolean, games?: number, isBlitz?: boolean, isRapid?: boolean, rating: number })`

`kFactor` is an auxiliary method to calculate the K Factor of a given player
based on multiple flags.

- `age` represents the age of the player (age > 0). If the player is less than
  18 years while they are under 2300, their K Factor is 40.
- `everhigher2400` tells if the player has ever been 2400 or higher. If so
  the player K Factor will always be 10.
- `games`, number of games since the beginning of their career for a given
  player. This adjustment allows newly players to reach their stable rating
  more easily.
- `isBlitz` or `isRapid` are 2 boolean flags to detect when the game is played
  in blitz or rapid time controls. For these kind of games, K Factor will
  always be 20.
- `rating` (required) represents the rating for the given player.

```typescript
import { kFactor } from "@echecs/elo";

const k = kFactor({ rating: 1400 }); // 20

const newlyK = kFactor({ games: 10, rating: 1400 }); // 40
```

### `update(a: number, b: number, result: 0 | 0.5 | 1 | UpdateResult)`

`update` is the go to API of the library. It returns the updated ratings of
players `a` and `b`.

`result` is the given score from the player A perspective. `result` could
be represented with a complex interface to follow all the FIDE rules.

Look at `kFactor` documentation for more information.

- `ageA` represents the age of the player A.
- `ageB` represents the age of the player B.
- `everHigher2400A` tells if the player A was ever higher 2400 rating.
- `everHigher2400B` tells if the player B was ever higher 2400 rating.
- `gamesA` number of games of player A since the beginning of their career.
- `gamesB` number of games of player B since the beginning of their career.
- `isBlitz` tells if the game was played in blitz time control.
- `isRapid` tells if the game was played in rapid time control.
- `k` K Factor used for both players.
- `kA` K Factor used for player A. It takes precedence over `k` option.
  Using this option will exclude any calculation using any other options.
- `kB` K Factor used for player B. It takes precedence over `k` option.
- `result` score of the game for player A.

**Basic usage**

```typescript
import { update } from "@echecs/elo";

const ratingA = 1400;
const ratingB = 1400;
const result = 1;

const [newA, newB] = update(ratingA, ratingB, result); // [1410, 1390]
```

**Advance usage**

```typescript
import { update } from "@echecs/elo";

const ratingA = 1400;
const ratingB = 1400;
const result = 1;

const [newA, newB] = update(ratingA, ratingB, { result, gamesA: 10 }); // [1420, 1390]
```
