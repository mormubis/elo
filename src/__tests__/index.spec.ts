import { describe, expect, it } from 'vitest';

import {
  delta,
  expected,
  initial,
  kFactor,
  performance,
  update,
} from '../index.js';

// @see https://github.com/dmamills/elo-rank/blob/f691623c4d048705a8754f044c6a2b3d2df395a5/test/tests.js
describe('ELO Rank tests', () => {
  it('should calculate expected properly', function () {
    expect(expected(1200, 1400)).toBeCloseTo(0.240_25);
  });

  it('Expect 50/50 chance for equal ranks', function () {
    expect(expected(1000, 1000)).toBe(0.5);
  });

  it('should be almost 100% chance for 0 rank', function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    expect(expected(1000, 0)).toBeCloseTo(0.909);
  });

  it('should update rating properly', function () {
    const [a, b] = update({ k: 32, rating: 1200 }, { k: 32, rating: 1400 }, 1);

    expect(a).toBe(1224);
    expect(b).toBe(1376);
  });

  it('should round rating properly', function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    const [a, b] = update({ k: 32, rating: 1802 }, { k: 32, rating: 1186 }, 1);

    expect(a).toBe(1805);
    expect(b).toBe(1183);
  });

  // @see https://ratings.fide.com/calc.phtml?page=change
  it('should round rating properly (FIDE ruling)', function () {
    const [a, b] = update(1805, 1186, 1);

    expect(a).toBe(1807);
    expect(b).toBe(1184);
  });
});

describe('delta', () => {
  it('returns positive delta for a win above expectation', () => {
    expect(delta(1, 0.5, 20)).toBe(10);
  });

  it('returns negative delta for a loss below expectation', () => {
    expect(delta(0, 0.5, 20)).toBe(-10);
  });

  it('returns zero delta when actual equals expected', () => {
    expect(delta(0.5, 0.5, 20)).toBe(0);
  });

  it('scales linearly with k-factor', () => {
    expect(delta(1, 0.5, 40)).toBe(20);
    expect(delta(1, 0.5, 10)).toBe(5);
  });

  it('returns fractional values for non-integer inputs', () => {
    expect(delta(0.5, 0.8, 10)).toBeCloseTo(-3);
  });
});

describe('kFactor', () => {
  it('returns 40 for a player with 30 or fewer games', () => {
    expect(kFactor({ gamesPlayed: 0, rating: 1400 })).toBe(40);
    expect(kFactor({ gamesPlayed: 30, rating: 1400 })).toBe(40);
  });

  it('returns 20 for a player with more than 30 games and rating below 2400', () => {
    expect(kFactor({ gamesPlayed: 31, rating: 1400 })).toBe(20);
    expect(kFactor({ gamesPlayed: 31, rating: 2399 })).toBe(20);
  });

  it('returns 10 for a player rated 2400 or above', () => {
    expect(kFactor({ rating: 2400 })).toBe(10);
    expect(kFactor({ rating: 2800 })).toBe(10);
  });

  it('returns 10 for a player who has ever reached 2400', () => {
    expect(kFactor({ everHigher2400: true, rating: 2300 })).toBe(10);
  });

  it('returns 40 for a player under 18 with rating below 2300', () => {
    expect(kFactor({ age: 17, rating: 1400 })).toBe(40);
    expect(kFactor({ age: 5, rating: 2299 })).toBe(40);
  });

  it('returns 20 for a player under 18 with rating at or above 2300', () => {
    expect(kFactor({ age: 17, rating: 2300 })).toBe(20);
  });

  it('returns 20 for a blitz game regardless of rating', () => {
    expect(kFactor({ gameType: 'blitz', rating: 1400 })).toBe(20);
    expect(kFactor({ gameType: 'blitz', rating: 2400 })).toBe(20);
    expect(kFactor({ gameType: 'blitz', gamesPlayed: 5, rating: 1400 })).toBe(
      20,
    );
  });

  it('returns 20 for a rapid game regardless of rating', () => {
    expect(kFactor({ gameType: 'rapid', rating: 1400 })).toBe(20);
    expect(kFactor({ gameType: 'rapid', rating: 2400 })).toBe(20);
    expect(kFactor({ gameType: 'rapid', gamesPlayed: 5, rating: 1400 })).toBe(
      20,
    );
  });
});

// @see https://ratings.fide.com/calc.phtml?page=change
describe('FIDE Rules', () => {
  it('Equal rating - no settings', () => {
    const [a, b] = update(1400, 1400, 1);

    expect(a).toBe(1410);
    expect(b).toBe(1390);
  });

  it('Equal rating - draw', () => {
    const [a, b] = update(1400, 1400, 0.5);

    expect(a).toBe(1400);
    expect(b).toBe(1400);
  });

  it('Equal rating - loss', () => {
    const [a, b] = update(1400, 1400, 0);

    expect(a).toBe(1390);
    expect(b).toBe(1410);
  });

  it('Equal rating - newly player', () => {
    const [a, b] = update({ gamesPlayed: 0, rating: 1400 }, 1400, 1);

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update({ gamesPlayed: 30, rating: 1400 }, 1400, 1);

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more less than 30 games
    const [established, establishedB] = update(
      { gamesPlayed: 31, rating: 1400 },
      1400,
      1,
    );

    expect(established).toBe(1410);
    expect(establishedB).toBe(1390);
  });

  it('Equal rating - newly player B', () => {
    const [a, b] = update(1400, { gamesPlayed: 0, rating: 1400 }, 1);

    expect(a).toBe(1410);
    expect(b).toBe(1380);
  });

  it('Equal rating - young player', () => {
    const [a, b] = update({ age: 5, rating: 1400 }, 1400, 1);

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update({ age: 17, rating: 1400 }, 1400, 1);

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more a young player
    const [adult, adultB] = update({ age: 18, rating: 1400 }, 1400, 1);

    expect(adult).toBe(1410);
    expect(adultB).toBe(1390);
  });

  it('Equal rating - young player - but not more than 2300', () => {
    const [a, b] = update({ age: 15, rating: 2300 }, 2300, 1);

    expect(a).toBe(2310);
    expect(b).toBe(2290);
  });

  it('Equal rating - above 2400', () => {
    const [a, b] = update(2400, 2400, 1);

    expect(a).toBe(2405);
    expect(b).toBe(2395);
  });

  it('Equal rating - less than 2400 but ever above 2400 (player A)', () => {
    const [a, b] = update({ everHigher2400: true, rating: 2300 }, 2300, 1);

    expect(a).toBe(2305);
    expect(b).toBe(2290);
  });

  it('Equal rating - less than 2400 but ever above 2400 (player B)', () => {
    const [a, b] = update(2300, { everHigher2400: true, rating: 2300 }, 1);

    expect(a).toBe(2310);
    expect(b).toBe(2295);
  });

  it('Equal rating - blitz game', () => {
    const [a, b] = update(1400, 1400, { gameType: 'blitz', result: 1 });

    expect(a).toBe(1410);
    expect(b).toBe(1390);

    const [c, d] = update(2300, 2300, { gameType: 'blitz', result: 1 });

    expect(c).toBe(2310);
    expect(d).toBe(2290);

    const [elite, eliteB] = update(2400, 2400, {
      gameType: 'blitz',
      result: 1,
    });

    expect(elite).toBe(2410);
    expect(eliteB).toBe(2390);
  });

  it('Equal rating - rapid game', () => {
    const [a, b] = update(1400, 1400, { gameType: 'rapid', result: 1 });

    expect(a).toBe(1410);
    expect(b).toBe(1390);

    const [c, d] = update(2400, 2400, { gameType: 'rapid', result: 1 });

    expect(c).toBe(2410);
    expect(d).toBe(2390);
  });

  it('Explicit kA and kB overrides are respected', () => {
    const [a, b] = update({ k: 40, rating: 1400 }, { k: 10, rating: 1400 }, 1);

    expect(a).toBe(1420);
    expect(b).toBe(1395);
  });

  it('Explicit k override applies to both players', () => {
    const [a, b] = update({ k: 32, rating: 1400 }, { k: 32, rating: 1400 }, 1);

    expect(a).toBe(1416);
    expect(b).toBe(1384);
  });

  it('400-point cap: differences above 400 are treated as 400', () => {
    const capped = expected(1000, 1401);
    const maxDiff = expected(1000, 1400);

    expect(capped).toBe(maxDiff);
  });
});

describe('performance', () => {
  it('throws RangeError for empty games array', () => {
    expect(() => performance([])).toThrow(RangeError);
  });

  it('returns Ra when p = 0.5 (all draws)', () => {
    // dp = 0 at p=0.5, so result = Ra
    const result = performance([
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1600, result: 0.5 },
    ]);
    expect(result).toBe(1500); // Ra = (1400+1600)/2 = 1500, dp = 0
  });

  it('returns Ra - 800 when p = 0 (all losses)', () => {
    const result = performance([
      { opponentRating: 1400, result: 0 },
      { opponentRating: 1600, result: 0 },
    ]);
    expect(result).toBe(700); // Ra = 1500, dp = -800
  });

  it('returns Ra + 800 when p = 1 (all wins)', () => {
    const result = performance([
      { opponentRating: 1400, result: 1 },
      { opponentRating: 1600, result: 1 },
    ]);
    expect(result).toBe(2300); // Ra = 1500, dp = 800
  });

  // Cross-checked against https://ratings.fide.com/calc.phtml?page=change
  it('matches FIDE calculator for mixed results', () => {
    // 3 wins, 1 draw, 1 loss against 1600-rated opponents
    // score = 3.5/5 = 0.70, Ra = 1600, dp = 149 → 1749
    const result = performance([
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 1 },
      { opponentRating: 1600, result: 0.5 },
      { opponentRating: 1600, result: 0 },
    ]);
    expect(result).toBe(1749);
  });

  it('handles a single game win', () => {
    // score = 1/1 = 1.0, Ra = 1400, dp = 800 → 2200
    const result = performance([{ opponentRating: 1400, result: 1 }]);
    expect(result).toBe(2200);
  });

  it('rounds to nearest integer', () => {
    // Ra = 1433.33... → should round correctly
    const result = performance([
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1400, result: 0.5 },
      { opponentRating: 1500, result: 0.5 },
    ]);
    // Ra = (1400+1400+1500)/3 = 1433.33, p=0.5, dp=0 → Math.round(1433.33) = 1433
    expect(result).toBe(1433);
  });
});

describe('initial', () => {
  it('throws RangeError for empty games array', () => {
    expect(() => initial([])).toThrow(RangeError);
  });

  it('injects two hypothetical 1800-rated draws', () => {
    // 5 wins against 1800-rated opponents
    // Without hypothetical opponents: p = 5/5 = 1.0, Ra = 1800, dp = 800 → 2600 (capped to 2200)
    // With hypothetical opponents: score = 5 + 1 = 6, games = 5 + 2 = 7
    // p = 6/7 ≈ 0.857 → index = 86 → dp = 309, Ra = (5*1800 + 2*1800)/7 = 1800
    // result = Math.min(Math.round(1800 + 309), 2200) = 2109
    const result = initial([
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
      { opponentRating: 1800, result: 1 },
    ]);
    expect(result).toBe(2109);
  });

  it('caps the result at 2200', () => {
    // Many wins against high-rated opponents — without cap would exceed 2200
    const result = initial([
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
      { opponentRating: 2500, result: 1 },
    ]);
    expect(result).toBe(2200);
  });

  it('returns Ra when p = 0.5 (all draws including hypothetical)', () => {
    // 2 draws against 1800. With 2 hypothetical 1800 draws:
    // score = 1 + 1 = 2, games = 4, p = 0.5, dp = 0
    // Ra = (1800 + 1800 + 1800 + 1800) / 4 = 1800
    // result = 1800
    const result = initial([
      { opponentRating: 1800, result: 0.5 },
      { opponentRating: 1800, result: 0.5 },
    ]);
    expect(result).toBe(1800);
  });

  it('pulls rating toward 1800 for strong results against weak opponents', () => {
    // 5 wins against 1000-rated opponents
    // Without hypothetical: Ra = 1000, p = 1.0, dp = 800 → 1800 (capped)
    // With hypothetical: Ra = (5*1000 + 2*1800)/7 ≈ 1228.57
    // score = 6, games = 7, p = 6/7 ≈ 0.857 → dp = 309
    // result = Math.round(1228.57 + 309) = 1538
    const result = initial([
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
      { opponentRating: 1000, result: 1 },
    ]);
    expect(result).toBe(1538);
  });

  it('throws RangeError for invalid result values', () => {
    expect(() => initial([{ opponentRating: 1400, result: 0.3 as 0 }])).toThrow(
      RangeError,
    );
  });
});
