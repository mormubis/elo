# ELO

[![npm](https://img.shields.io/npm/v/@echecs/elo)](https://www.npmjs.com/package/@echecs/elo)
[![Test](https://github.com/mormubis/elo/actions/workflows/test.yml/badge.svg)](https://github.com/mormubis/elo/actions/workflows/test.yml)
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
  everyone else. No configuration needed.
- **Game type awareness** — blitz and rapid games always use K=20, regardless of
  rating or experience, matching FIDE §B02.
- **400-point rating difference cap** — rating differences above 400 are clamped
  before calculating win probability, as required by FIDE §8.3.1. Most libraries
  skip this.
- **Performance rating** — calculates a player's FIDE performance rating
  (§8.2.3) over a series of games. No other Elo library on npm implements this.

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

## API

Full API reference is available at https://mormubis.github.io/elo/

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for
guidelines on how to submit issues and pull requests.
