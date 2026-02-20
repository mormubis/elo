type Result = 0 | 0.5 | 1;

interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  isBlitz?: boolean;
  isRapid?: boolean;
  rating: number;
}

interface UpdateOptions {
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
  result: Result;
}

const MAX_DIFF = 400;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ResultAndOpponent {
  opponentRating: number;
  result: Result;
}

// @see https://handbook.fide.com/chapter/B022024 Section 8.1.1
// Key = Math.round(p * 100), value = dp

/* eslint-disable sort-keys */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DP_TABLE: Record<number, number> = {
  0: -800,
  1: -677,
  2: -589,
  3: -538,
  4: -501,
  5: -470,
  6: -444,
  7: -422,
  8: -401,
  9: -383,
  10: -366,
  11: -351,
  12: -336,
  13: -322,
  14: -309,
  15: -296,
  16: -284,
  17: -273,
  18: -262,
  19: -251,
  20: -240,
  21: -230,
  22: -220,
  23: -211,
  24: -202,
  25: -193,
  26: -184,
  27: -175,
  28: -166,
  29: -158,
  30: -149,
  31: -141,
  32: -133,
  33: -125,
  34: -117,
  35: -110,
  36: -102,
  37: -95,
  38: -87,
  39: -80,
  40: -72,
  41: -65,
  42: -57,
  43: -50,
  44: -43,
  45: -36,
  46: -29,
  47: -21,
  48: -14,
  49: -7,
  50: 0,
  51: 7,
  52: 14,
  53: 21,
  54: 29,
  55: 36,
  56: 43,
  57: 50,
  58: 57,
  59: 65,
  60: 72,
  61: 80,
  62: 87,
  63: 95,
  64: 102,
  65: 110,
  66: 117,
  67: 125,
  68: 133,
  69: 141,
  70: 149,
  71: 158,
  72: 166,
  73: 175,
  74: 184,
  75: 193,
  76: 202,
  77: 211,
  78: 220,
  79: 230,
  80: 240,
  81: 251,
  82: 262,
  83: 273,
  84: 284,
  85: 296,
  86: 309,
  87: 322,
  88: 336,
  89: 351,
  90: 366,
  91: 383,
  92: 401,
  93: 422,
  94: 444,
  95: 470,
  96: 501,
  97: 538,
  98: 589,
  99: 677,
  100: 800,
};
/* eslint-enable sort-keys */

/**
 * Calculates the delta (difference) between the actual and expected ratings, scaled by a factor `k`.
 *
 * @param actual - The actual performance rating.
 * @param expected - The expected performance rating.
 * @param k - A scaling factor.
 * @returns The scaled difference between actual and expected ratings.
 */
function delta(actual: number, expected: number, k: number): number {
  // Calculate the difference between actual and expected ratings.
  const diff = actual - expected;

  // Scale the difference by the factor k and return the result.
  return k * diff;
}

/**
 * Calculates the expected probability of winning given two players' ratings.
 *
 * @param a - The rating of the first player.
 * @param b - The rating of the second player.
 * @returns The expected probability of the first player winning.
 */
function expected(a: number, b: number): number {
  // @see https://handbook.fide.com/chapter/B022024
  // Section 8.3.1
  // A difference in rating of more than 400 points shall be counted for
  // rating purposes as though it were a difference of 400 points.
  const diff = Math.min(Math.max(b - a, -MAX_DIFF), MAX_DIFF);

  return 1 / (1 + Math.pow(10, diff / 400));
}

/**
 * Determines the appropriate K-factor based on age, rating, game type, and other conditions.
 *
 * @param age - The age of the player. Defaults to 18.
 * @param everHigher2400 - Whether the player’s rating has ever been higher than 2400.
 * @param games - The number of games the player has played. Defaults to 32.
 * @param isBlitz - Whether the game is Blitz type. Defaults to false.
 * @param isRapid - Whether the game is Rapid type. Defaults to false.
 * @param rating - The current rating of the player.
 * @returns The K-factor to be used in rating calculations: 10, 20, or 40.
 */
function kFactor({
  age = 18,
  everHigher2400,
  games = 32,
  isBlitz = false,
  isRapid = false,
  rating,
}: KFactorOptions): 10 | 20 | 40 {
  // If the game is Blitz or Rapid type, return K-factor 20.
  if (isBlitz || isRapid) {
    return 20;
  }

  // If the player has played 30 games or fewer, or is under 18 with a rating under 2300, return K-factor 40.
  if (games <= 30 || (age < 18 && rating < 2300)) {
    return 40;
  }

  // If the player's rating is under 2400 and has never been higher than 2400, return K-factor 20.
  if (rating < 2400 && !everHigher2400) {
    return 20;
  }

  // Otherwise, return K-factor 10.
  return 10;
}

/**
 * Updates the Elo ratings of two players based on the result of their game.
 *
 * @param a - The current rating of the first player.
 * @param b - The current rating of the second player.
 * @param resultOrOptions - The result of the game (0 for loss, 0.5 for draw, 1 for win)
 *                           or an options object containing additional parameters.
 * @returns A tuple of the updated ratings for both players.
 */
function update(
  a: number,
  b: number,
  resultOrOptions: Result | UpdateOptions,
): [ratingA: number, ratingB: number] {
  const options =
    typeof resultOrOptions === 'number'
      ? { result: resultOrOptions }
      : resultOrOptions;

  // Calculate the expected probabilities of both players winning.
  const [oddsA, oddsB] = [expected(a, b), expected(b, a)];

  // Determine the K-factors for both players, allowing overrides or defaults based on conditions.
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

  // Calculate and return the updated ratings for both players, rounded to the nearest integer.
  return [
    Math.round(a + delta(options.result, oddsA, kA)),
    Math.round(b + delta(1 - options.result, oddsB, kB)),
  ];
}

export type { Result, KFactorOptions, UpdateOptions };
export { delta, expected, kFactor, update };
