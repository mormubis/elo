# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Source files: `*.ts` (TypeScript, no JSX/TSX)
- Test files: `*.spec.ts` (using `.spec` suffix, not `.test`)
- Config files: `*.config.mjs` (ESM format with .mjs extension)
- All lowercase with dots for suffixes

**Functions:**
- camelCase for all function names
- Descriptive verb-based names: `expected()`, `update()`, `kFactor()`
- Parameters use camelCase: `everHigher2400`, `isBlitz`, `isRapid`

**Variables:**
- camelCase for all variables
- UPPER_CASE for module-level constants: `MAX_DIFF`
- Array destructuring with single-letter or abbreviated names: `[oddsA, oddsB]`, `[kA, kB]`

**Types:**
- PascalCase for interfaces and types
- Suffix "Options" for configuration objects: `KFactorOptions`, `UpdateOptions`
- No "I" prefix for interfaces

## Code Style

**Formatting:**
- Prettier v3.5.3
- Single quotes (`'`)
- Trailing commas (`all`)
- Consistent quote props
- Prose wrap: always (for markdown)

**Linting:**
- ESLint v9.23.0 with flat config format (`eslint.config.mjs`)
- typescript-eslint strict + stylistic configs
- eslint-plugin-import-x for import management
- Zero warnings policy in CI (`--max-warnings 0`)
- Key rules enforced:
  - `sort-keys: error` - Object keys must be alphabetically sorted
  - `sort-imports: error` - Named imports must be sorted (ignores declaration order)
  - `no-console: warn` - Console statements warned
  - `@typescript-eslint/consistent-type-imports: error` - Use `import type` for types
  - `@typescript-eslint/no-non-null-assertion: warn` - Non-null assertions warned

## Import Organization

**Order:**
1. External packages (builtin + external)
2. Internal modules (with `@/**` path alias)
3. Parent/sibling imports
4. Type imports (separate group)

**Newlines:**
- Always add newlines between import groups

**Sorting:**
- Alphabetical order (case insensitive, ascending)
- Named imports sorted within each import statement

**Pattern Example:**
```typescript
import { describe, expect, it } from 'vitest';

import { expected, update } from '../index.js';

import type { SomeType } from './types.js';
```

**Extensions:**
- Use `.js` extension for relative imports (even for TypeScript files)
- This is for ESM compatibility with NodeNext module resolution

## Error Handling

**Patterns:**
- No explicit error handling in current codebase
- Pure calculation functions that don't throw
- Input validation handled implicitly through TypeScript types
- No try-catch blocks used in the library code

## Logging

**Framework:** None (console only, warned by linter)

**Patterns:**
- No logging in library code
- This is a pure calculation library with no side effects
- Console usage discouraged (`no-console: warn`)

## Comments

**When to Comment:**
- JSDoc for all exported functions with @param and @returns
- Inline comments for complex business logic
- Reference external documentation with `@see` tags
- Explain the "why" not the "what"

**JSDoc/TSDoc:**
- Required for all public API functions
- Format:
```typescript
/**
 * Brief description of function purpose.
 *
 * @param paramName - Description of parameter.
 * @param anotherParam - Description with default. Defaults to value.
 * @returns Description of return value.
 */
```
- Include default values in parameter descriptions
- Add `@see` links to external references (FIDE handbook)
- Inline code references when explaining implementation details

**Inline Comments:**
- Used to explain FIDE rules: "Section 8.3.1"
- Placed above the code they explain
- Complete sentences with proper punctuation

## Function Design

**Size:** Functions are small and focused (10-50 lines typical)

**Parameters:**
- Use options objects for functions with many optional parameters
- Provide sensible defaults using destructuring: `{ age = 18, games = 32 }`
- Accept union types for flexible APIs: `resultOrOptions: 0 | 0.5 | 1 | UpdateOptions`
- Explicit return type annotations for clarity

**Return Values:**
- Use tuples for multiple return values: `[number, number]`
- Explicit literal union types for constrained returns: `10 | 20 | 40`
- Calculations rounded to integers where appropriate

## Module Design

**Exports:**
- Named exports only (no default exports)
- Export statement at end of file
- Inline `export` syntax: `export { delta, expected, kFactor, update };`

**Barrel Files:**
- Not applicable (single-file library)

**Structure:**
- Interfaces first
- Constants second
- Helper functions in dependency order
- Main API function last
- Export statement at end

## TypeScript Strictness

**Compiler Options:**
- `strict: true` - All strict checks enabled
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noImplicitOverride: true` - Explicit override keyword required
- `isolatedModules: true` - Each file must be independently transpilable
- `skipLibCheck: true` - Skip .d.ts file checking for performance

**Module System:**
- `module: "NodeNext"` - Full ESM support
- `moduleDetection: "force"` - Treat all files as modules
- Source maps generated for debugging

## Special Patterns

**Type Guards:**
- Use typeof for runtime type checking: `typeof resultOrOptions === 'number'`

**Nullish Coalescing:**
- Use `??` for optional value chains: `options.kA ?? options.k ?? kFactor(...)`
- Preferred over `||` to handle 0 and false correctly

**Math Operations:**
- Use `Math.min(Math.max(...))` pattern for clamping values
- Round with `Math.round()` for final rating calculations
- Use `Math.pow(10, x)` for exponential calculations

---

*Convention analysis: 2026-01-31*
