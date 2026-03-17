# Specification: ELO Rating System

Implements the FIDE ELO rating system as defined in the
[FIDE Handbook §B.02](https://handbook.fide.com/chapter/B022024) (effective
March 2024).

---

## Expected Score

The probability that player A beats player B:

```
Ea = 1 / (1 + 10^((Rb - Ra) / 400))
```

FIDE clamps the rating difference to ±400 before applying the formula (§8.3.1):

```
diff = clamp(Rb - Ra, -400, +400)
Ea = 1 / (1 + 10^(diff / 400))
```

---

## K-Factor

The K-factor determines the maximum rating change per game.

| Condition                        | K   |
| -------------------------------- | --- |
| Blitz or Rapid games             | 20  |
| Fewer than 30 rated games played | 40  |
| Age < 18 and rating < 2300       | 40  |
| Rating ever reached ≥ 2400       | 10  |
| All other cases                  | 20  |

Rules are applied in priority order — the first matching condition wins.

---

## Rating Change (Delta)

```
delta = K × (W - Ea)
```

Where:

- `K` = K-factor
- `W` = actual result (1 = win, 0.5 = draw, 0 = loss)
- `Ea` = expected score

Result is rounded to the nearest integer.

---

## Performance Rating

For a tournament result, the performance rating is computed via the FIDE DP
table (§8.2.3):

```
score_percentage = total_score / total_games × 100
performance = average_opponent_rating + DP[score_percentage]
```

The DP table maps score percentage to a rating difference (+/- offset).

Throws `RangeError` for empty game list or out-of-range score percentage.

---

## Implementation Notes

- `expected(Ra, Rb)` — implements §8.3.1 with ±400 clamping
- `kFactor({ rating, gamesPlayed, age, gameType, everHigher2400 })` — implements
  §8.3.2
- `delta(actual, expected, k)` — rounds to nearest integer
- `update(a, b, result)` — computes both players' new ratings simultaneously
- `performance(games)` — uses the DP table lookup

## Sources

- [FIDE Handbook §B.02](https://handbook.fide.com/chapter/B022024)
- [FIDE Online Rating Calculator](https://ratings.fide.com/calc.phtml?page=change)
