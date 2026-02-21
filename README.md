# ELO

[![npm](https://img.shields.io/npm/v/@echecs/elo)](https://www.npmjs.com/package/@echecs/elo)
[![Test](https://github.com/mormubis/elo/actions/workflows/test.yml/badge.svg)](https://github.com/mormubis/elo/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/mormubis/elo/branch/main/graph/badge.svg)](https://codecov.io/gh/mormubis/elo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![API Docs](https://img.shields.io/badge/API-docs-blue.svg)](https://mormubis.github.io/elo/)

**ELO** is part of the **ECHECS** project, providing an implementation of the
[ELO Rating System](https://en.wikipedia.org/wiki/Elo_rating_system) following
[FIDE rules](https://handbook.fide.com/chapter/B022024).

## Installation

```bash
npm install @echecs/elo
```

## Usage

**Basic** — bare ratings and result:

```typescript
import { update } from '@echecs/elo';

const [newRatingA, newRatingB] = update(1400, 1400, 1); // [1410, 1390]
```

**Player options** — per-player age, games played, or manual K-factor:

```typescript
import { update } from '@echecs/elo';

// Young player (age < 18, rating < 2300) gets K=40
const [newRatingA, newRatingB] = update({ age: 15, rating: 1400 }, 1400, 1); // [1420, 1390]

// New player (≤ 30 games played) also gets K=40
const [newRatingC, newRatingD] = update(
  { gamesPlayed: 10, rating: 1400 },
  1400,
  1,
); // [1420, 1390]
```

**Game options** — blitz, rapid, or standard game type:

```typescript
import { update } from '@echecs/elo';

// Blitz and rapid games always use K=20
const [newRatingA, newRatingB] = update(2400, 2400, {
  gameType: 'blitz',
  result: 1,
}); // [2410, 2390]
```

**Performance rating** — FIDE §8.2.3:

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
