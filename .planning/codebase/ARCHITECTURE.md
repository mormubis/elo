# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Pure Functional Library

**Key Characteristics:**
- Single-file implementation with no dependencies
- Stateless pure functions for rating calculations
- Composable API where functions build upon each other
- Mathematical domain model following FIDE chess rating rules

## Layers

**API Layer:**
- Purpose: Public interface exposed to library consumers
- Location: `src/index.ts` (exports only)
- Contains: Four exported functions (`expected`, `kFactor`, `delta`, `update`)
- Depends on: Internal calculation functions
- Used by: External consumers of the @echecs/elo package

**Calculation Layer:**
- Purpose: Core mathematical operations for ELO rating system
- Location: `src/index.ts` (function implementations)
- Contains: Pure mathematical functions implementing FIDE formulas
- Depends on: TypeScript type definitions, mathematical constants
- Used by: API layer functions compose these calculations

**Type Layer:**
- Purpose: Type definitions and interfaces for function parameters
- Location: `src/index.ts` (interfaces at top)
- Contains: `KFactorOptions` and `UpdateOptions` interfaces
- Depends on: Nothing (pure type definitions)
- Used by: All function signatures in the calculation layer

## Data Flow

**Rating Update Flow:**

1. Consumer calls `update(ratingA, ratingB, result)` with player ratings and game result
2. `update` function calculates win probabilities using `expected(a, b)` for both players
3. `update` determines K-factors for each player using `kFactor(options)` based on player metadata
4. `update` calculates rating changes using `delta(actual, expected, k)` for both players
5. Returns tuple of updated ratings `[newRatingA, newRatingB]` rounded to integers

**State Management:**
- No state management (stateless library)
- All functions are pure with no side effects
- Results depend only on input parameters

## Key Abstractions

**Expected Probability:**
- Purpose: Represents the probability of winning based on rating difference
- Examples: `expected(a, b)` in `src/index.ts`
- Pattern: Mathematical formula with capped rating difference (400-point max per FIDE rules)

**K-Factor:**
- Purpose: Scaling factor that determines rating volatility based on player progression
- Examples: `kFactor(options)` in `src/index.ts`
- Pattern: Conditional logic returning literal union type (10 | 20 | 40)

**Rating Delta:**
- Purpose: The actual change in rating points
- Examples: `delta(actual, expected, k)` in `src/index.ts`
- Pattern: Simple multiplication of difference by K-factor

**Update Options:**
- Purpose: Flexible parameter object supporting both simple and complex rating scenarios
- Examples: `UpdateOptions` interface in `src/index.ts`
- Pattern: Optional metadata fields with discriminated union for simple number vs options object

## Entry Points

**Primary Entry Point:**
- Location: `src/index.ts`
- Triggers: Import/require by consuming code
- Responsibilities: Exports public API functions

**Build Entry Point:**
- Location: `package.json` "main" field pointing to `dist/index.js`
- Triggers: NPM package resolution
- Responsibilities: Compiled JavaScript output for consumption

**Type Entry Point:**
- Location: `package.json` "types" field pointing to `dist/index.d.ts`
- Triggers: TypeScript type resolution
- Responsibilities: Type definitions for TypeScript consumers

## Error Handling

**Strategy:** Type-safe validation at compile time, no runtime errors

**Patterns:**
- No try-catch blocks (pure mathematical operations cannot throw)
- TypeScript strict mode ensures type safety at compile time
- Union types (`0 | 0.5 | 1`) enforce valid game results
- Default parameter values handle missing optional data

## Cross-Cutting Concerns

**Logging:** None (library has no logging)
**Validation:** Compile-time type checking via TypeScript strict mode
**Authentication:** Not applicable (pure calculation library)

---

*Architecture analysis: 2026-01-31*
