import { expected, update } from "../index";

// @see https://github.com/dmamills/elo-rank/blob/f691623c4d048705a8754f044c6a2b3d2df395a5/test/tests.js
describe("ELO Rank tests", () => {
  it("should calculate expected properly", function () {
    expect(expected(1200, 1400)).toBeCloseTo(0.24025);
  });

  it("Expect 50/50 chance for equal ranks", function () {
    expect(expected(1000, 1000)).toBe(0.5);
  });

  it("should be almost 100% chance for 0 rank", function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    expect(expected(1000, 0)).toBeCloseTo(0.909);
  });

  it("should update rating properly", function () {
    const [a, b] = update(1200, 1400, { result: 1, k: 32 });

    expect(a).toBe(1224);
    expect(b).toBe(1376);
  });

  it("should round rating properly", function () {
    // Changed respectively to the original file to complain against FIDE > 400 diff points
    const [a, b] = update(1802, 1186, { result: 1, k: 32 });

    expect(a).toBe(1805);
    expect(b).toBe(1183);
  });

  // @see https://ratings.fide.com/calc.phtml?page=change
  it("should round rating properly (FIDE ruling)", function () {
    const [a, b] = update(1805, 1186, 1);

    expect(a).toBe(1807);
    expect(b).toBe(1184);
  });
});

// @see https://ratings.fide.com/calc.phtml?page=change
describe("FIDE Rules", () => {
  it("Equal rating - no settings", () => {
    const [a, b] = update(1400, 1400, 1);

    expect(a).toBe(1410);
    expect(b).toBe(1390);
  });

  it("Equal rating - newly player", () => {
    const [a, b] = update(1400, 1400, { result: 1, gamesA: 0 });

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update(1400, 1400, { result: 1, gamesA: 30 });

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more less than 30 games
    const [e, f] = update(1400, 1400, { result: 1, gamesA: 31 });

    expect(e).toBe(1410);
    expect(f).toBe(1390);
  });

  it("Equal rating - young player", () => {
    const [a, b] = update(1400, 1400, { result: 1, ageA: 5 });

    expect(a).toBe(1420);
    expect(b).toBe(1390);

    const [c, d] = update(1400, 1400, { result: 1, ageA: 17 });

    expect(c).toBe(1420);
    expect(d).toBe(1390);

    // No more a young player
    const [e, f] = update(1400, 1400, { result: 1, ageA: 18 });

    expect(e).toBe(1410);
    expect(f).toBe(1390);
  });

  it("Equal rating - young player - but not more than 2300", () => {
    const [a, b] = update(2300, 2300, { result: 1, ageA: 15 });

    expect(a).toBe(2310);
    expect(b).toBe(2290);
  });

  it("Equal rating - above 2400", () => {
    const [a, b] = update(2400, 2400, 1);

    expect(a).toBe(2405);
    expect(b).toBe(2395);
  });

  it("Equal rating - less than 2400 but ever above 2400", () => {
    const [a, b] = update(2300, 2300, { result: 1, everHigher2400A: true });

    expect(a).toBe(2305);
    expect(b).toBe(2290);
  });

  it("Equal rating - blitz game", () => {
    const [a, b] = update(1400, 1400, { result: 1, isBlitz: true });

    expect(a).toBe(1410);
    expect(b).toBe(1390);

    const [c, d] = update(2300, 2300, { result: 1, isBlitz: true });

    expect(c).toBe(2310);
    expect(d).toBe(2290);

    const [e, f] = update(2400, 2400, { result: 1, isBlitz: true });

    expect(e).toBe(2410);
    expect(f).toBe(2390);
  });
});
