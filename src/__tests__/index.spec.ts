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
    // §8.1.2: diff 200, range 198-206, PD_L = 0.24
    expect(expected(1200, 1400)).toBe(0.24);
  });

  it('Expect 50/50 chance for equal ranks', function () {
    // §8.1.2: diff 0, range 0-3, PD_H = 0.50
    expect(expected(1000, 1000)).toBe(0.5);
  });

  it('should be almost 100% chance for 0 rank', function () {
    // diff 1000, capped to 400. §8.1.2: range 392-411, PD_H = 0.92
    expect(expected(1000, 0)).toBe(0.92);
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

  it('applies the cap to blitz and rapid games', () => {
    // K=20 for blitz, n=36: 20 × 36 = 720 > 700 → floor(700/36) = 19
    expect(
      kFactor({ gameType: 'blitz', gamesInPeriod: 36, rating: 1400 }),
    ).toBe(19);
    // K=20 for rapid, n=35: 20 × 35 = 700 ≤ 700 → no cap
    expect(
      kFactor({ gameType: 'rapid', gamesInPeriod: 35, rating: 1400 }),
    ).toBe(20);
  });

  it('returns 20 for a rapid game regardless of rating', () => {
    expect(kFactor({ gameType: 'rapid', rating: 1400 })).toBe(20);
    expect(kFactor({ gameType: 'rapid', rating: 2400 })).toBe(20);
    expect(kFactor({ gameType: 'rapid', gamesPlayed: 5, rating: 1400 })).toBe(
      20,
    );
  });

  it('returns uncapped K when gamesInPeriod is below threshold', () => {
    // K=40, n=17: 40 × 17 = 680 ≤ 700 → no cap
    expect(kFactor({ gamesInPeriod: 17, gamesPlayed: 0, rating: 1400 })).toBe(
      40,
    );
    // K=20, n=35: 20 × 35 = 700 ≤ 700 → no cap
    expect(kFactor({ gamesInPeriod: 35, gamesPlayed: 31, rating: 1400 })).toBe(
      20,
    );
    // K=10, n=70: 10 × 70 = 700 ≤ 700 → no cap
    expect(
      kFactor({ everHigher2400: true, gamesInPeriod: 70, rating: 2300 }),
    ).toBe(10);
  });

  it('returns capped K when gamesInPeriod exceeds threshold', () => {
    // K=40, n=18: floor(700/18) = 38
    expect(kFactor({ gamesInPeriod: 18, gamesPlayed: 0, rating: 1400 })).toBe(
      38,
    );
    // K=20, n=36: floor(700/36) = 19
    expect(kFactor({ gamesInPeriod: 36, gamesPlayed: 31, rating: 1400 })).toBe(
      19,
    );
    // K=10, n=71: floor(700/71) = 9
    expect(
      kFactor({ everHigher2400: true, gamesInPeriod: 71, rating: 2300 }),
    ).toBe(9);
  });

  it('throws RangeError when gamesInPeriod is invalid', () => {
    expect(() => kFactor({ gamesInPeriod: 0, rating: 1400 })).toThrow(
      RangeError,
    );
    expect(() => kFactor({ gamesInPeriod: -1, rating: 1400 })).toThrow(
      RangeError,
    );
    expect(() => kFactor({ gamesInPeriod: 1.5, rating: 1400 })).toThrow(
      RangeError,
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
    // Both should give same result: diff capped to 400, range 392-411, PD_L = 0.08
    expect(capped).toBe(maxDiff);
    expect(capped).toBe(0.08);
  });

  // §8.3.1 (effective 1 October 2025): cap exemption for 2650+ players
  it('does not cap the difference when player A is rated >= 2650', () => {
    // diff 500, range 485-517, PD_H = 0.96
    expect(expected(2700, 2200)).toBe(0.96);
  });

  it('does not cap the difference when player B is rated >= 2650', () => {
    // diff 500, range 485-517, PD_L = 0.04
    expect(expected(2200, 2700)).toBe(0.04);
  });

  it('still caps the difference when both players are rated below 2650', () => {
    // diff 549, capped to 400. range 392-411, PD_H = 0.92
    expect(expected(2649, 2100)).toBe(0.92);
  });

  it('does not cap the difference when player A is rated exactly 2650', () => {
    // diff 550, NO cap. range 518-559, PD_H = 0.97
    expect(expected(2650, 2100)).toBe(0.97);
  });

  it('does not cap the difference when player B is rated exactly 2650', () => {
    // diff 550, NO cap. range 518-559, PD_L = 0.03
    expect(expected(2100, 2650)).toBe(0.03);
  });

  it('falls back to formula for differences > 735 (2650+ exemption)', () => {
    // diff 1000, exceeds table. Use formula: 1 / (1 + 10^(1000/400))
    const result = expected(3200, 2200);
    expect(result).toBeCloseTo(1 / (1 + Math.pow(10, -1000 / 400)), 5);
  });

  it('2650+ cap exemption propagates through update()', () => {
    // 2700 vs 2200: diff 500, no cap (2700 >= 2650)
    // §8.1.2: range 485-517, PD_H = 0.96 for the 2700-rated player
    // A (2700): K=10 (rating >= 2400). delta_A = 10 * (1 - 0.96) = 0.4 → rounds to 0
    // B (2200): K=20 (rating < 2400). delta_B = 20 * (0 - 0.04) = -0.8 → rounds to -1
    const [a, b] = update(2700, 2200, 1);
    expect(a).toBe(2700);
    expect(b).toBe(2199);

    // Compare: if capped to 400, range 392-411, PD_H = 0.92
    // delta_A would be 10 * (1 - 0.92) = 0.8 → rounds to 1 → 2701
    // delta_B would be 20 * (0 - 0.08) = -1.6 → rounds to -2 → 2198
    // The uncapped result [2700, 2199] differs from capped [2701, 2198],
    // confirming the cap exemption matters in practice.
  });

  it('K-factor cap applied via gamesInPeriod in update()', () => {
    // K=40 normally for new player, but capped to 38 with 18 games in period
    // Expected win prob for equal ratings = 0.5
    // delta = floor(700/18) * (1 - 0.5) = 38 * 0.5 = 19 → rounded = 19
    const [a, b] = update(
      { gamesInPeriod: 18, gamesPlayed: 0, rating: 1400 },
      1400,
      1,
    );
    expect(a).toBe(1419);
    expect(b).toBe(1390); // opponent not capped: K=20, delta = 20 * (0 - 0.5) = -10
  });
});

describe('update', () => {
  // §8.3.4: 0.5 must round away from zero
  it('rounds a -0.5 delta away from zero (loss with K=1 at equal ratings)', () => {
    // k=1, equal ratings, result=0 (loss):
    // delta = 1 * (0 - 0.5) = -0.5  →  1400 + (-0.5) = 1399.5  →  should be 1399
    const [a] = update({ k: 1, rating: 1400 }, { k: 1, rating: 1400 }, 0);
    expect(a).toBe(1399);
  });

  it('rounds a -0.5 delta away from zero for the losing opponent (K=1, equal ratings, win)', () => {
    // k=1, equal ratings, result=1 (A wins, B loses):
    // B's delta = 1 * (0 - 0.5) = -0.5  →  1400 + (-0.5) = 1399.5  →  should be 1399
    // Old Math.round(1399.5) would give 1400 — this test would fail with old code
    const [, b] = update({ k: 1, rating: 1400 }, { k: 1, rating: 1400 }, 1);
    expect(b).toBe(1399);
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
