import { describe, expect, it } from 'vitest';

import { delta, expected, kFactor, update } from '../index.js';

// @see https://github.com/dmamills/elo-rank/blob/f691623c4d048705a8754f044c6a2b3d2df395a5/test/tests.js
describe('ELO Rank tests', () => {
  it('should calculate expected properly', function () {
    expect(expected(1200, 1400)).toBeCloseTo(0.24025);
  });

  it('Expect 50/50 chance for equal ranks', function () {
    expect(expected(1000, 1000)).toBe(0.5);
  });

  it('should be almost 100% chance for 0 rank', function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    expect(expected(1000, 0)).toBeCloseTo(0.909);
  });

  it('should update rating properly', function () {
    const [a, b] = update(1200, 1400, { k: 32, result: 1 });

    expect(a).toBe(1224);
    expect(b).toBe(1376);
  });

  it('should round rating properly', function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    const [a, b] = update(1802, 1186, { k: 32, result: 1 });

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
    expect(kFactor({ games: 0, rating: 1400 })).toBe(40);
    expect(kFactor({ games: 30, rating: 1400 })).toBe(40);
  });

  it('returns 20 for a player with more than 30 games and rating below 2400', () => {
    expect(kFactor({ games: 31, rating: 1400 })).toBe(20);
    expect(kFactor({ games: 31, rating: 2399 })).toBe(20);
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
    expect(kFactor({ isBlitz: true, rating: 1400 })).toBe(20);
    expect(kFactor({ isBlitz: true, rating: 2400 })).toBe(20);
    expect(kFactor({ games: 5, isBlitz: true, rating: 1400 })).toBe(20);
  });

  it('returns 20 for a rapid game regardless of rating', () => {
    expect(kFactor({ isRapid: true, rating: 1400 })).toBe(20);
    expect(kFactor({ isRapid: true, rating: 2400 })).toBe(20);
    expect(kFactor({ games: 5, isRapid: true, rating: 1400 })).toBe(20);
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
    const [a, b] = update(1400, 1400, { gamesA: 0, result: 1 });

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update(1400, 1400, { gamesA: 30, result: 1 });

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more less than 30 games
    const [e, f] = update(1400, 1400, { gamesA: 31, result: 1 });

    expect(e).toBe(1410);
    expect(f).toBe(1390);
  });

  it('Equal rating - newly player B', () => {
    const [a, b] = update(1400, 1400, { gamesB: 0, result: 1 });

    expect(a).toBe(1410);
    expect(b).toBe(1380);
  });

  it('Equal rating - young player', () => {
    const [a, b] = update(1400, 1400, { ageA: 5, result: 1 });

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update(1400, 1400, { ageA: 17, result: 1 });

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more a young player
    const [e, f] = update(1400, 1400, { ageA: 18, result: 1 });

    expect(e).toBe(1410);
    expect(f).toBe(1390);
  });

  it('Equal rating - young player - but not more than 2300', () => {
    const [a, b] = update(2300, 2300, { ageA: 15, result: 1 });

    expect(a).toBe(2310);
    expect(b).toBe(2290);
  });

  it('Equal rating - above 2400', () => {
    const [a, b] = update(2400, 2400, 1);

    expect(a).toBe(2405);
    expect(b).toBe(2395);
  });

  it('Equal rating - less than 2400 but ever above 2400 (player A)', () => {
    const [a, b] = update(2300, 2300, { everHigher2400A: true, result: 1 });

    expect(a).toBe(2305);
    expect(b).toBe(2290);
  });

  it('Equal rating - less than 2400 but ever above 2400 (player B)', () => {
    const [a, b] = update(2300, 2300, { everHigher2400B: true, result: 1 });

    expect(a).toBe(2310);
    expect(b).toBe(2295);
  });

  it('Equal rating - blitz game', () => {
    const [a, b] = update(1400, 1400, { isBlitz: true, result: 1 });

    expect(a).toBe(1410);
    expect(b).toBe(1390);

    const [c, d] = update(2300, 2300, { isBlitz: true, result: 1 });

    expect(c).toBe(2310);
    expect(d).toBe(2290);

    const [e, f] = update(2400, 2400, { isBlitz: true, result: 1 });

    expect(e).toBe(2410);
    expect(f).toBe(2390);
  });

  it('Equal rating - rapid game', () => {
    const [a, b] = update(1400, 1400, { isRapid: true, result: 1 });

    expect(a).toBe(1410);
    expect(b).toBe(1390);

    const [c, d] = update(2400, 2400, { isRapid: true, result: 1 });

    expect(c).toBe(2410);
    expect(d).toBe(2390);
  });

  it('Explicit kA and kB overrides are respected', () => {
    const [a, b] = update(1400, 1400, { kA: 40, kB: 10, result: 1 });

    expect(a).toBe(1420);
    expect(b).toBe(1395);
  });

  it('Explicit k override applies to both players', () => {
    const [a, b] = update(1400, 1400, { k: 32, result: 1 });

    expect(a).toBe(1416);
    expect(b).toBe(1384);
  });

  it('400-point cap: differences above 400 are treated as 400', () => {
    const capped = expected(1000, 1401);
    const maxDiff = expected(1000, 1400);

    expect(capped).toBe(maxDiff);
  });
});
