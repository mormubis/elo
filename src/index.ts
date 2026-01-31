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
  result: number;
}

const MAX_DIFF = 400;

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
  if (isBlitz || isRapid) return 20;

  // If the player has played 30 games or fewer, or is under 18 with a rating under 2300, return K-factor 40.
  if (games <= 30 || (age < 18 && rating < 2300)) return 40;

  // If the player's rating is under 2400 and has never been higher than 2400, return K-factor 20.
  if (rating < 2400 && !everHigher2400) return 20;

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
  resultOrOptions: 0 | 0.5 | 1 | UpdateOptions,
): [number, number] {
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

export { delta, expected, kFactor, update };
