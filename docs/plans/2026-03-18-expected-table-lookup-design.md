# Design: Switch `expected()` to FIDE §8.1.2 table lookup

**Date:** 2026-03-18

## Problem

`expected()` uses the continuous formula `1 / (1 + 10^(D/400))` to compute
scoring probabilities. FIDE §8.1.2 defines a discrete lookup table that maps
rating-difference ranges to scoring probabilities in 0.01 increments. The two
produce slightly different results at range boundaries, meaning the library does
not match FIDE's official calculations exactly.

## Changes

### 1. Replace formula with §8.1.2 table in `expected()`

Add a `PD_TABLE` constant encoding the 49 rows from §8.1.2 as `[maxDiff, PD_H]`
tuples:

```
[3, 0.50], [10, 0.51], [17, 0.52], ..., [735, 0.99]
```

Rewrite `expected(a, b)`:

1. Compute `D = b - a` (signed difference, same as now).
2. Apply the 400-point cap or 2650+ exemption to D (same logic as now).
3. Compute `absD = Math.abs(D)`.
4. If `absD > 735`, fall back to `1 / (1 + 10^(D/400))` for the 2650+ exemption
   case where differences can exceed the table.
5. Otherwise, scan `PD_TABLE` to find the first entry where `absD <= maxDiff`,
   yielding `PD_H`.
6. Return `PD_H` if player A is the higher- or equal-rated player (`D <= 0`);
   return `1 - PD_H` otherwise.

This is a **breaking change**: `expected()` returns discrete values (0.50, 0.51,
..., 1.00) instead of continuous values. Requires a semver-major version bump.

### 2. Add blitz/rapid K-factor source comment

Add a comment in `kFactor()` citing the source for blitz/rapid K=20. The FIDE
standard rating regulations (§8.3.3 in SPEC.md) only define K for standard play.
The blitz/rapid K=20 comes from separate FIDE regulations. A source comment
helps future maintainers.

### 3. Integration test: 2650+ cap exemption through `update()`

Add a test in the FIDE Rules describe block that calls `update(2700, 2200, 1)`
and verifies the resulting ratings differ from what the 400-point cap would
produce. Confirms the cap exemption propagates through the full pipeline.

## Test impact

- Existing `expected()` tests using `toBeCloseTo` must change to exact `toBe`
  comparisons against the discrete table values.
- Existing `update()` tests may need recalculation if the discrete probabilities
  differ enough to change rounded deltas.
- New tests should cover table boundary values and the >735 formula fallback.

## Version

Major bump (4.0.0) due to breaking change in `expected()` return values.
