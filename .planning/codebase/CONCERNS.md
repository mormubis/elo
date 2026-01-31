# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**No Input Validation:**
- Issue: Functions accept any numeric inputs without bounds checking or type validation
- Files: `src/index.ts` (lines 50, 71, 101)
- Impact: Invalid inputs (negative ratings, NaN, Infinity, invalid results) produce nonsensical outputs or incorrect calculations. Users get no feedback when passing bad data.
- Fix approach: Create `src/validation.ts` with EloValidationError class and validators for ratings (0-4000), results (0, 0.5, 1), age, and games. Integrate validation at function entry points. (See IMPROVEMENTS_PLAN.md Phase 2)

**Interfaces Not Exported:**
- Issue: KFactorOptions and UpdateOptions interfaces are defined but not exported from the library
- Files: `src/index.ts` (lines 1-23)
- Impact: TypeScript consumers cannot import types for type-safe function calls. Must redeclare types or use inline objects without IDE support.
- Fix approach: Export interfaces from `src/index.ts` or create `src/types.ts` and re-export. (See IMPROVEMENTS_PLAN.md Phase 1)

**Monolithic File Structure:**
- Issue: All functionality in single 145-line file despite having distinct concerns (constants, validation, calculation, K-factor logic)
- Files: `src/index.ts`
- Impact: Harder to maintain and test individual concerns. No clear separation between domain logic and utilities.
- Fix approach: Extract to separate modules: `src/constants.ts`, `src/types.ts`, `src/validation.ts`, maintain single `src/index.ts` entry point. (See IMPROVEMENTS_PLAN.md Phase 1)

**No Build Artifacts in Development:**
- Issue: `dist/` directory not present, must build before testing library integration
- Files: Missing `dist/index.js`, `dist/index.d.ts`
- Impact: Cannot test library as published package without running `pnpm run build` first. CI workflows test correctly but local development friction.
- Fix approach: Run `pnpm run build` or add git pre-commit hook to ensure build runs. Consider adding dist/ to .gitignore if not already present.

## Known Bugs

**None Detected:**
- No TODO, FIXME, HACK, or BUG comments in source code
- No open issues referenced in git history
- Test suite covers expected behavior comprehensively

## Security Considerations

**No DoS Protection:**
- Risk: Functions accept extreme values (Infinity, Number.MAX_VALUE) that could cause performance issues or incorrect results
- Files: `src/index.ts` (lines 50, 71, 101)
- Current mitigation: Math operations cap at 400 point difference (line 55) but no bounds on input ratings
- Recommendations: Add validation to reject non-finite numbers, ratings outside 0-4000 range. Validate age and games as non-negative integers.

**Runtime Type Safety:**
- Risk: TypeScript types provide no runtime protection. Library can receive incorrect types at runtime from JavaScript consumers or type casting.
- Files: `src/index.ts` (all exported functions)
- Current mitigation: None
- Recommendations: Add runtime validation as first step in all exported functions. Throw descriptive errors for type mismatches.

**No Rate Limiting:**
- Risk: Batch operations not yet implemented. When added (IMPROVEMENTS_PLAN.md Phase 5), could accept arbitrarily large arrays causing memory issues.
- Files: Future `src/batch.ts`
- Current mitigation: Not applicable (feature doesn't exist)
- Recommendations: When implementing batch operations, add array length limits and validate all inputs before processing.

## Performance Bottlenecks

**None Detected:**
- All operations are simple mathematical calculations (O(1) complexity)
- No loops, recursion, or complex algorithms
- `Math.pow` and `Math.min/max` calls are highly optimized
- Expected usage pattern (single game calculations) matches implementation

## Fragile Areas

**K-Factor Calculation Logic:**
- Files: `src/index.ts` (lines 71-90)
- Why fragile: Complex nested conditions with multiple branches based on game type, age, rating, games played, and historical peak rating. Easy to introduce logic errors when modifying FIDE rules.
- Safe modification: Add comprehensive unit tests for all K-factor transitions before changing. Use truth table testing for all condition combinations. Consider extracting to separate pure function.
- Test coverage: Basic tests exist in `src/__tests__/index.spec.ts` (lines 46-126) but no edge case testing for boundary values (exactly 30 games, exactly age 18, exactly rating 2300/2400).

**Rating Difference Capping:**
- Files: `src/index.ts` (lines 51-55)
- Why fragile: FIDE 400-point rule implementation uses Math.min/max with specific order. Easy to introduce off-by-one errors or incorrect inequality directions.
- Safe modification: Tests exist for extreme differences (line 17 of test file) but add property-based tests to verify capping behavior across all possible inputs.
- Test coverage: Limited to specific examples, no boundary testing at exactly 400 points difference.

**Rounding Behavior:**
- Files: `src/index.ts` (lines 139-142)
- Why fragile: Uses Math.round which has specific behavior at 0.5 boundaries. FIDE-compliant but could change if rules update.
- Safe modification: Tests verify rounding (lines 27-42 of test file) including FIDE calculator comparison. Any changes must verify against official FIDE calculator.
- Test coverage: Good coverage with specific examples and FIDE verification.

## Scaling Limits

**Not Applicable:**
- Pure calculation library with no state, database, or network operations
- Each calculation is independent and stateless
- No resource accumulation or memory leaks possible

## Dependencies at Risk

**Heavy TypeScript Ecosystem Reliance:**
- Risk: Multiple @typescript-eslint packages with frequent version updates (git history shows updates every few days)
- Impact: High maintenance burden, potential for breaking changes in linting rules
- Migration plan: Pin to compatible major versions. Consider adopting ESLint flat config more fully to reduce package count. Evaluate switching to Biome for faster, simpler tooling.

**Vitest Rapid Evolution:**
- Risk: Vitest is actively developed with frequent minor version updates
- Impact: Low - test API is stable, updates are mostly performance/bug fixes
- Migration plan: Continue current update strategy. If breaking changes occur, Jest is drop-in alternative.

**No Runtime Dependencies:**
- Risk: None - library has zero runtime dependencies, excellent for security and bundle size
- Impact: Positive security posture
- Migration plan: Maintain this advantage when adding features. Resist adding dependencies for utilities that can be implemented in ~20 lines.

## Missing Critical Features

**Input Validation:**
- Problem: No validation of rating bounds, result values, or optional parameters
- Blocks: Using library in production without wrapper validation, providing helpful error messages to end users
- Priority: High - documented in IMPROVEMENTS_PLAN.md Phase 2

**Type Exports:**
- Problem: TypeScript types not exported for library consumers
- Blocks: Type-safe consumption of library in TypeScript projects
- Priority: Medium - workaround is to redeclare types, but reduces developer experience

**Rating Floors:**
- Problem: FIDE rating floor rules (minimum 1000 for established players) not implemented
- Blocks: Accurate simulation of FIDE rating system
- Priority: Low - most use cases don't require floor enforcement

**Performance Rating Calculation:**
- Problem: Cannot calculate performance rating from tournament results
- Blocks: Tournament performance analysis use cases
- Priority: Low - niche feature, documented in IMPROVEMENTS_PLAN.md Phase 4

## Test Coverage Gaps

**No Edge Case Testing:**
- What's not tested: Boundary values (rating 0, 4000, exactly 30 games, exactly age 18, exactly 2300/2400 rating)
- Files: `src/__tests__/index.spec.ts`
- Risk: Logic errors at boundaries could go undetected
- Priority: Medium - existing tests cover common cases well, but production systems often hit edge cases

**No Validation Testing:**
- What's not tested: Invalid inputs (negative ratings, NaN, Infinity, invalid result values like 2 or -1)
- Files: No test file (validation doesn't exist yet)
- Risk: Library produces incorrect results with invalid inputs without warning
- Priority: High - blocks production usage without custom validation layer

**No Property-Based Testing:**
- What's not tested: Invariants like rating conservation (draw preserves total rating), K-factor monotonicity, probability sum to 1
- Files: Missing `src/__tests__/property-based.spec.ts`
- Risk: Subtle mathematical errors could exist that specific examples don't catch
- Priority: Low - mathematical logic is simple and well-tested with specific examples

**CI Coverage Reporting Missing:**
- What's not tested: Test coverage not measured or enforced in CI
- Files: `.github/workflows/test.yml` (line 34 runs tests but not coverage)
- Risk: Coverage could regress without detection
- Priority: Low - codebase is small and well-tested, but coverage reporting is best practice

**No Integration Testing:**
- What's not tested: Library usage as published package (import from dist/, type checking from published .d.ts files)
- Files: No integration test suite
- Risk: Build configuration errors could make library unusable despite passing unit tests
- Priority: Low - manual verification in IMPROVEMENTS_PLAN.md covers this, but automated checks would be better

---

*Concerns audit: 2026-01-31*
