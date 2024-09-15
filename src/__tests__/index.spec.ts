import { describe, expect, it } from 'vitest';

import { expected, update } from '../index.js';

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

// @see https://ratings.fide.com/calc.phtml?page=change
describe('FIDE Rules', () => {
  it('Equal rating - no settings', () => {
    const [a, b] = update(1400, 1400, 1);

    expect(a).toBe(1410);
    expect(b).toBe(1390);
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

  it('Equal rating - less than 2400 but ever above 2400', () => {
    const [a, b] = update(2300, 2300, { everHigher2400A: true, result: 1 });

    expect(a).toBe(2305);
    expect(b).toBe(2290);
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
});
