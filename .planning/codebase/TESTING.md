# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- Vitest v4.0.1
- No explicit config file (uses defaults)

**Assertion Library:**
- Vitest built-in expect assertions

**Run Commands:**
```bash
pnpm run test              # Run all tests
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # Coverage report
```

## Test File Organization

**Location:**
- Co-located in `src/__tests__/` directory
- Keeps tests close to source but separated in dedicated folder

**Naming:**
- Pattern: `*.spec.ts` (not `*.test.ts`)
- Matches source file name: `index.ts` → `index.spec.ts`

**Structure:**
```
src/
├── index.ts                 # Source code
└── __tests__/
    └── index.spec.ts        # Tests for index.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';

import { expected, update } from '../index.js';

describe('Feature/Component Name', () => {
  it('should describe specific behavior', function () {
    // Arrange
    const input = value;

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- Use `describe()` blocks to group related tests by feature or FIDE rule section
- Use `it()` for individual test cases (not `test()`)
- Test descriptions use natural language: "should calculate expected properly"
- Traditional function syntax (`function () {}`) used instead of arrow functions
- Inline comments reference external sources with `@see` tags
- Group by behavior/rules rather than by function

**Test Organization:**
- First describe block: Port of existing tests from reference implementation
- Subsequent describe blocks: Organized by specification (FIDE Rules)
- Each test case covers a specific scenario with clear naming

## Mocking

**Framework:** Not used

**Patterns:**
- No mocking in current test suite
- Pure function testing with direct inputs and outputs
- No external dependencies to mock

**What to Mock:**
- Not applicable (pure calculation library)

**What NOT to Mock:**
- Mathematical calculations
- Business logic (FIDE rules)

## Fixtures and Factories

**Test Data:**
```typescript
// Inline test data with meaningful values
const [a, b] = update(1200, 1400, { k: 32, result: 1 });

// Rating values based on FIDE rating ranges
update(1400, 1400, 1);              // Standard players
update(2400, 2400, 1);              // High-rated players
update(2300, 2300, { ageA: 15 });   // Young players
```

**Patterns:**
- Inline test data directly in test cases
- Use realistic rating values (1200, 1400, 2300, 2400)
- Options objects for complex scenarios
- No separate fixture files needed for this small library

**Location:**
- All test data defined inline within test cases
- No separate fixtures directory

## Coverage

**Requirements:** None enforced (no coverage thresholds configured)

**View Coverage:**
```bash
pnpm run test:coverage
```

**Current Status:**
- Coverage reporting available via Vitest
- No minimum coverage requirements set

## Test Types

**Unit Tests:**
- Primary focus: Pure function unit tests
- Test individual exported functions: `expected()`, `update()`
- Each function tested with multiple scenarios
- No integration or E2E tests needed for pure library

**Integration Tests:**
- Not applicable (no external integrations)

**E2E Tests:**
- Not used

## Common Patterns

**Exact Matching:**
```typescript
expect(a).toBe(1224);
expect(b).toBe(1376);
```

**Floating Point Comparison:**
```typescript
expect(expected(1200, 1400)).toBeCloseTo(0.24025);
```
- Use `toBeCloseTo()` for floating point comparisons
- Default precision (2 decimal places) usually sufficient

**Tuple Destructuring:**
```typescript
const [a, b] = update(1200, 1400, { k: 32, result: 1 });

expect(a).toBe(1224);
expect(b).toBe(1376);
```
- Destructure tuple returns for cleaner assertions
- Use meaningful variable names (`a`, `b` for player ratings)

**Multiple Scenarios:**
```typescript
it('Equal rating - newly player', () => {
  // Test boundary: 0 games
  const [a, b] = update(1400, 1400, { gamesA: 0, result: 1 });
  expect(a).toBe(1420);
  expect(b).toBe(1390);

  // Test boundary: 30 games
  const [c, d] = update(1400, 1400, { gamesA: 30, result: 1 });
  expect(c).toBe(1420);
  expect(d).toBe(1390);

  // Test boundary: 31 games (no longer new)
  const [e, f] = update(1400, 1400, { gamesA: 31, result: 1 });
  expect(e).toBe(1410);
  expect(f).toBe(1390);
});
```
- Test boundary conditions in single test case
- Use different variable names for each scenario (a/b, c/d, e/f)
- Include comments explaining boundary significance

**Async Testing:**
- Not used (all functions are synchronous)

**Error Testing:**
- Not used (functions don't throw errors)
- Input validation handled by TypeScript type system

## Documentation in Tests

**External References:**
```typescript
// @see https://github.com/dmamills/elo-rank/blob/f691623c4d048705a8754f044c6a2b3d2df395a5/test/tests.js
describe('ELO Rank tests', () => {
  // ...
});

// @see https://ratings.fide.com/calc.phtml?page=change
describe('FIDE Rules', () => {
  // ...
});
```
- Use `@see` comments to link to specifications and reference implementations
- Link to FIDE calculator for official behavior verification

**Inline Comments:**
```typescript
// Changed respectively to the original file to complain against FIDE > 400 diff points
expect(expected(1000, 0)).toBeCloseTo(0.909);
```
- Explain deviations from reference implementations
- Clarify business rules being tested

## Test Naming Conventions

**Suite Names:**
- Descriptive feature names: "ELO Rank tests"
- Specification references: "FIDE Rules"
- No "Test" suffix needed (implied by describe block)

**Test Case Names:**
- Start with "should" for behavior tests
- Use natural language without "should" for specification tests
- Descriptive scenario names: "Equal rating - newly player"
- Include context in name: "should round rating properly (FIDE ruling)"

## Import Patterns in Tests

**Module Imports:**
```typescript
import { describe, expect, it } from 'vitest';

import { expected, update } from '../index.js';
```
- Import only needed test functions from Vitest
- Import only functions being tested from source
- Use relative paths with `.js` extension
- Separate groups: test framework, then source code

---

*Testing analysis: 2026-01-31*
