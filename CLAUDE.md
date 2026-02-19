# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a TypeScript library implementing the ELO Rating System following FIDE
(World Chess Federation) rules. It's a pure calculation library with no runtime
dependencies, part of the larger ECHECS project.

## Development Commands

### Building

```bash
pnpm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory using
`tsconfig.build.json`.

### Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage report
pnpm run test:coverage
```

Tests are written in Vitest and located in `src/__tests__/`.

### Linting and Formatting

```bash
# Lint code (fixes issues automatically)
pnpm run lint

# Lint for CI (strict, no warnings allowed)
pnpm run lint:ci

# Format code with Prettier
pnpm run format

# Check formatting for CI
pnpm run format:ci
```

## Architecture

### Core Functions (src/index.ts)

The library exports four functions that work together:

1. **`expected(a, b)`**: Calculates the win probability for player A against
   player B using the FIDE formula. Implements the 400-point rating difference
   cap (FIDE Section 8.3.1).

2. **`kFactor(options)`**: Determines the K-factor based on FIDE rules:
   - Returns 40 for players under 18 (with rating < 2300) or with ≤30 games
     played
   - Returns 20 for blitz/rapid games or players rated < 2400 who haven't
     reached 2400
   - Returns 10 for players who have ever reached 2400+ rating

3. **`delta(actual, expected, kFactor)`**: Calculates the rating change using
   the formula: `kFactor * (actual - expected)`

4. **`update(a, b, result)`**: The main function that orchestrates the rating
   update for both players. Accepts either a simple result (0, 0.5, 1) or a
   complex options object with player metadata (age, games played, game type).

### FIDE Rules Implementation

- **MAX_DIFF = 400**: Rating differences greater than 400 are capped at 400 for
  probability calculations
- **K-factor progression**: The K-factor decreases as players become more
  established (40 → 20 → 10)
- **Game type modifiers**: Blitz and rapid games always use K-factor of 20
- **Age consideration**: Players under 18 with ratings below 2300 use K-factor
  of 40

### TypeScript Configuration

- **Strict mode enabled**: All strict TypeScript checks are on
- **Module system**: ESNext with NodeNext resolution
- **Dual configs**: `tsconfig.json` for development (includes tests),
  `tsconfig.build.json` for production builds (excludes tests)
- **Exports**: Type declarations generated in `dist/index.d.ts`

## Publishing

The package is published to NPM as `@echecs/elo`. GitHub Actions automatically
publishes new versions when the version number changes in `package.json`.
