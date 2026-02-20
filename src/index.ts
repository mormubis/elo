type Result = 0 | 0.5 | 1;

type GameType = 'blitz' | 'rapid' | 'standard';

interface KFactorOptions {
  age?: number;
  everHigher2400?: boolean;
  gameType?: GameType;
  games?: number;
  rating: number;
}

interface GameOptions {
  gameType?: GameType;
  result: Result;
}

interface PlayerOptions {
  age?: number;
  everHigher2400?: boolean;
  games?: number;
  k?: number;
  rating: number;
}

const MAX_DIFF = 400;

interface ResultAndOpponent {
  opponentRating: number;
  result: Result;
}

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
 * @param gameType - The type of game: 'blitz', 'rapid', or 'standard'. Omitting defaults to standard.
 * @param rating - The current rating of the player.
 * @returns The K-factor to be used in rating calculations: 10, 20, or 40.
 */
function kFactor({
  age = 18,
  everHigher2400,
  gameType,
  games = 32,
  rating,
}: KFactorOptions): 10 | 20 | 40 {
  // If the game is Blitz or Rapid type, return K-factor 20.
  if (gameType === 'blitz' || gameType === 'rapid') {
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
        games: playerA.games,
        rating: playerA.rating,
      }),
    playerB.k ??
      kFactor({
        age: playerB.age,
        everHigher2400: playerB.everHigher2400,
        gameType: game.gameType,
        games: playerB.games,
        rating: playerB.rating,
      }),
  ];

  // Calculate and return the updated ratings for both players, rounded to the nearest integer.
  return [
    Math.round(playerA.rating + delta(game.result, oddsA, kA)),
    Math.round(playerB.rating + delta(1 - game.result, oddsB, kB)),
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

export type {
  GameOptions,
  GameType,
  KFactorOptions,
  PlayerOptions,
  Result,
  ResultAndOpponent,
};
export { delta, expected, kFactor, performance, update };
