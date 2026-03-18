type Result = 0 | 0.5 | 1;

type GameType = 'blitz' | 'rapid' | 'standard';

interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  gamesInPeriod?: number;
  gamesPlayed?: number;
  rating: number;
}

interface GameOptions {
  gameType?: GameType;
  result: Result;
}

interface PlayerOptions {
  age?: number;
  everHigher2400?: boolean;
  gamesInPeriod?: number;
  gamesPlayed?: number;
  k?: number;
  rating: number;
}

interface ResultAndOpponent {
  opponentRating: number;
  result: Result;
}

const HIGH_RATED_THRESHOLD = 2650;
const MAX_DIFF = 400;

// @see https://handbook.fide.com/chapter/B022024 Section 8.1.2
// Each entry is [maxDiff, PD_H, PD_L] where maxDiff is the upper bound of the
// rating-difference range, PD_H is the scoring probability for the higher-rated
// player, and PD_L is the scoring probability for the lower-rated player.
const PD_TABLE: readonly [number, number, number][] = [
  [3, 0.5, 0.5],
  [10, 0.51, 0.49],
  [17, 0.52, 0.48],
  [25, 0.53, 0.47],
  [32, 0.54, 0.46],
  [39, 0.55, 0.45],
  [46, 0.56, 0.44],
  [53, 0.57, 0.43],
  [61, 0.58, 0.42],
  [68, 0.59, 0.41],
  [76, 0.6, 0.4],
  [83, 0.61, 0.39],
  [91, 0.62, 0.38],
  [98, 0.63, 0.37],
  [106, 0.64, 0.36],
  [113, 0.65, 0.35],
  [121, 0.66, 0.34],
  [129, 0.67, 0.33],
  [137, 0.68, 0.32],
  [145, 0.69, 0.31],
  [153, 0.7, 0.3],
  [162, 0.71, 0.29],
  [170, 0.72, 0.28],
  [179, 0.73, 0.27],
  [188, 0.74, 0.26],
  [197, 0.75, 0.25],
  [206, 0.76, 0.24],
  [215, 0.77, 0.23],
  [225, 0.78, 0.22],
  [235, 0.79, 0.21],
  [245, 0.8, 0.2],
  [256, 0.81, 0.19],
  [267, 0.82, 0.18],
  [278, 0.83, 0.17],
  [290, 0.84, 0.16],
  [302, 0.85, 0.15],
  [315, 0.86, 0.14],
  [328, 0.87, 0.13],
  [344, 0.88, 0.12],
  [357, 0.89, 0.11],
  [374, 0.9, 0.1],
  [391, 0.91, 0.09],
  [411, 0.92, 0.08],
  [432, 0.93, 0.07],
  [456, 0.94, 0.06],
  [484, 0.95, 0.05],
  [517, 0.96, 0.04],
  [559, 0.97, 0.03],
  [619, 0.98, 0.02],
  [735, 0.99, 0.01],
];

// @see https://handbook.fide.com/chapter/B022024 Section 8.1.1
// Index = Math.round(p * 100), value = dp
const DP_TABLE: readonly number[] = [
  -800, -677, -589, -538, -501, -470, -444, -422, -401, -383, -366, -351, -336,
  -322, -309, -296, -284, -273, -262, -251, -240, -230, -220, -211, -202, -193,
  -184, -175, -166, -158, -149, -141, -133, -125, -117, -110, -102, -95, -87,
  -80, -72, -65, -57, -50, -43, -36, -29, -21, -14, -7, 0, 7, 14, 21, 29, 36,
  43, 50, 57, 65, 72, 80, 87, 95, 102, 110, 117, 125, 133, 141, 149, 158, 166,
  175, 184, 193, 202, 211, 220, 230, 240, 251, 262, 273, 284, 296, 309, 322,
  336, 351, 366, 383, 401, 422, 444, 470, 501, 538, 589, 677, 800,
];

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
  // Section 8.3.1 (effective 1 October 2025)
  // For players rated below 2650, a difference of more than 400 points is
  // counted as 400 points. For players rated 2650 and above, the actual
  // difference is used.
  const diff =
    a >= HIGH_RATED_THRESHOLD || b >= HIGH_RATED_THRESHOLD
      ? b - a
      : Math.min(Math.max(b - a, -MAX_DIFF), MAX_DIFF);

  const absDiff = Math.abs(diff);

  // §8.1.2: For differences beyond the table (> 735), which can only occur
  // via the 2650+ exemption, fall back to the continuous formula.
  if (absDiff > 735) {
    return 1 / (1 + Math.pow(10, diff / 400));
  }

  // §8.1.2: Look up the scoring probability from the FIDE table.
  for (const [maxDiff, pdH, pdL] of PD_TABLE) {
    if (absDiff <= maxDiff) {
      // diff <= 0 means player A is higher-rated or equal → return PD_H
      // diff > 0 means player A is lower-rated → return PD_L
      return diff <= 0 ? pdH : pdL;
    }
  }

  // Should not be reached for valid inputs within the table range,
  // but handles the edge case defensively.
  return diff <= 0 ? 1 : 0;
}

/**
 * Determines the appropriate K-factor based on age, rating, game type, and other conditions.
 *
 * @param age - The age of the player. Defaults to 18.
 * @param everHigher2400 - Whether the player's rating has ever been higher than 2400.
 * @param gamesPlayed - The number of games the player has played. Defaults to 32.
 * @param gameType - The type of game: 'blitz', 'rapid', or 'standard'. Omitting defaults to standard.
 * @param gamesInPeriod - The number of games played in the rating period; used to cap K per §8.3.3.
 * @param rating - The current rating of the player.
 * @returns The K-factor to be used in rating calculations.
 */
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  gamesInPeriod,
  gamesPlayed = 32,
  rating,
}: KFactorOptions): number {
  if (
    gamesInPeriod !== undefined &&
    (gamesInPeriod < 1 || !Number.isInteger(gamesInPeriod))
  ) {
    throw new RangeError('gamesInPeriod must be a positive integer');
  }

  let k: number;

  if (gameType === 'blitz' || gameType === 'rapid') {
    k = 20;
  } else if (gamesPlayed <= 30 || (age < 18 && rating < 2300)) {
    k = 40;
  } else if (rating < 2400 && !everHigher2400) {
    k = 20;
  } else {
    k = 10;
  }

  if (gamesInPeriod !== undefined && k * gamesInPeriod > 700) {
    k = Math.floor(700 / gamesInPeriod);
  }

  return k;
}

/**
 * Rounds a number to the nearest integer, with 0.5 rounded away from zero.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.3.4
 */
function roundHalfAwayFromZero(x: number): number {
  return Math.sign(x) * Math.round(Math.abs(x));
}

/**
 * Updates the Elo ratings of two players based on the result of their game.
 *
 * @param a - The current rating of player A, or a PlayerOptions object.
 * @param b - The current rating of player B, or a PlayerOptions object.
 * @param resultOrOptions - The result of the game (0 for loss, 0.5 for draw, 1 for win)
 *                          or a GameOptions object containing the result and game type.
 * @returns A tuple of the updated ratings for both players.
 */
function update(
  a: number | PlayerOptions,
  b: number | PlayerOptions,
  resultOrOptions: Result | GameOptions,
): [ratingA: number, ratingB: number] {
  const playerA = typeof a === 'number' ? { rating: a } : a;
  const playerB = typeof b === 'number' ? { rating: b } : b;
  const game =
    typeof resultOrOptions === 'number'
      ? { result: resultOrOptions }
      : resultOrOptions;

  // Calculate the expected probabilities of both players winning.
  const [oddsA, oddsB] = [
    expected(playerA.rating, playerB.rating),
    expected(playerB.rating, playerA.rating),
  ];

  // Determine the K-factors for both players, allowing overrides or defaults based on conditions.
  const [kA, kB] = [
    playerA.k ??
      kFactor({
        age: playerA.age,
        everHigher2400: playerA.everHigher2400,
        gameType: game.gameType,
        gamesInPeriod: playerA.gamesInPeriod,
        gamesPlayed: playerA.gamesPlayed,
        rating: playerA.rating,
      }),
    playerB.k ??
      kFactor({
        age: playerB.age,
        everHigher2400: playerB.everHigher2400,
        gameType: game.gameType,
        gamesInPeriod: playerB.gamesInPeriod,
        gamesPlayed: playerB.gamesPlayed,
        rating: playerB.rating,
      }),
  ];

  // Per §8.3.4, round each delta away from zero before adding to the player's rating.
  return [
    playerA.rating + roundHalfAwayFromZero(delta(game.result, oddsA, kA)),
    playerB.rating + roundHalfAwayFromZero(delta(1 - game.result, oddsB, kB)),
  ];
}

/**
 * Calculates the performance rating of a player over a series of games.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.2.3
 * @param games - Array of games, each containing the opponent's rating and the result.
 * @returns The performance rating rounded to the nearest integer.
 * @throws {RangeError} If the games array is empty or contains invalid result values.
 */
function performance(games: ResultAndOpponent[]): number {
  if (games.length === 0) {
    throw new RangeError('games must not be empty');
  }

  const ra =
    games.reduce((sum, game) => sum + game.opponentRating, 0) / games.length;

  const score = games.reduce((sum, game) => sum + game.result, 0);
  const p = score / games.length;

  const index = Math.round(p * 100);
  const dp = DP_TABLE[index];

  if (dp === undefined) {
    throw new RangeError(`result values must be 0, 0.5, or 1`);
  }

  return Math.round(ra + dp);
}

/**
 * Calculates the initial rating of a previously unrated player.
 *
 * @see https://handbook.fide.com/chapter/B022024 Section 8.2
 * @param games - Array of games against rated opponents.
 * @returns The initial rating rounded to the nearest integer, capped at 2200.
 * @throws {RangeError} If the games array is empty or contains invalid result values.
 */
function initial(games: ResultAndOpponent[]): number {
  if (games.length === 0) {
    throw new RangeError('games must not be empty');
  }

  for (const game of games) {
    if (game.result !== 0 && game.result !== 0.5 && game.result !== 1) {
      throw new RangeError('result values must be 0, 0.5, or 1');
    }
  }

  // §8.2.2: add two hypothetical opponents rated 1800, each counted as a draw
  const allGames: ResultAndOpponent[] = [
    ...games,
    { opponentRating: 1800, result: 0.5 },
    { opponentRating: 1800, result: 0.5 },
  ];

  const ra =
    allGames.reduce((sum, game) => sum + game.opponentRating, 0) /
    allGames.length;

  const score = allGames.reduce((sum, game) => sum + game.result, 0);
  const p = score / allGames.length;

  const index = Math.round(p * 100);
  const dp = DP_TABLE[index];

  if (dp === undefined) {
    throw new RangeError('result values must be 0, 0.5, or 1');
  }

  // §8.2: cap at 2200
  return Math.min(Math.round(ra + dp), 2200);
}

export type {
  GameOptions,
  GameType,
  KFactorOptions,
  PlayerOptions,
  Result,
  ResultAndOpponent,
};
export { delta, expected, initial, kFactor, performance, update };
