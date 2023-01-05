type KFactorOptions = {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  isBlitz?: boolean;
  isRapid?: boolean;
  rating: number;
};

type UpdateResult = {
  ageA?: number;
  ageB?: number;
  everHigher2400A?: boolean;
  everHigher2400B?: boolean;
  gamesA?: number;
  gamesB?: number;
  isBlitz?: boolean;
  isRapid?: boolean;
  k?: number;
  kA?: number;
  kB?: number;
  result: number;
};

const MAX_DIFF = 400;

function delta(actual: number, expected: number, k: number): number {
  const diff = actual - expected;

  return k * diff;
}

function expected(a: number, b: number): number {
  // @see https://www.fide.com/docs/regulations/FIDE%20Rating%20Regulations%202022.pdf
  // Section 8.31
  // A difference in rating of more than 400 points shall be counted for
  // rating purposes as though it were a difference of 400 points.
  const diff = Math.min(Math.max(b - a, -MAX_DIFF), MAX_DIFF);

  return 1 / (1 + Math.pow(10, diff / 400));
}

function kFactor({
  age = 18,
  everHigher2400,
  games = 32,
  isBlitz = false,
  isRapid = false,
  rating,
}: KFactorOptions): 10 | 20 | 40 {
  if (isBlitz || isRapid) return 20;
  if (games <= 30 || (age < 18 && rating < 2300)) return 40;
  if (rating < 2400 && !everHigher2400) return 20;
  return 10;
}

function update(
  a: number,
  b: number,
  options: 0 | 0.5 | 1 | UpdateResult
): [number, number] {
  if (typeof options === "number") {
    options = {
      result: options,
    };
  }

  const [oddsA, oddsB] = [expected(a, b), expected(b, a)];
  const [kA, kB] = [
    options.kA ??
      options.k ??
      kFactor({
        age: options.ageA,
        everHigher2400: options.everHigher2400A,
        games: options.gamesA,
        isBlitz: options.isBlitz,
        isRapid: options.isRapid,
        rating: a,
      }),
    options.kB ??
      options.k ??
      kFactor({
        age: options.ageB,
        everHigher2400: options.everHigher2400B,
        games: options.gamesB,
        isBlitz: options.isBlitz,
        isRapid: options.isRapid,
        rating: b,
      }),
  ];

  return [
    Math.round(a + delta(options.result, oddsA, kA)),
    Math.round(b + delta(1 - options.result, oddsB, kB)),
  ];
}

export { delta, expected, kFactor, update };
