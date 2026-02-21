# AGENTS.md

Agent guidance for the `@echecs/elo` repository — a TypeScript library
implementing the ELO Rating System following FIDE rules.

---

## Project Overview

Pure calculation library, no runtime dependencies. Exports five functions
(`expected`, `kFactor`, `delta`, `update`, `performance`) and six types
(`GameOptions`, `GameType`, `KFactorOptions`, `PlayerOptions`, `Result`,
`ResultAndOpponent`). All source lives in `src/index.ts`; tests in
`src/__tests__/index.spec.ts`.

---

## Commands

### Build

```bash
pnpm run build          # compile TypeScript → dist/ (tsconfig.build.json)
```

### Test

```bash
pnpm run test                          # run all tests once
pnpm run test:watch                    # watch mode
pnpm run test:coverage                 # with coverage report

# Run a single test file
pnpm run test src/__tests__/index.spec.ts

# Run a single test by name (substring match)
pnpm run test -- --reporter=verbose -t "kFactor"
```

### Lint & Format

```bash
pnpm run lint           # ESLint + tsc type-check (auto-fixes style issues)
pnpm run lint:ci        # strict — zero warnings allowed, no auto-fix
pnpm run lint:style     # ESLint only (auto-fixes)
pnpm run lint:types     # tsc --noEmit type-check only
pnpm run format         # Prettier (writes changes)
pnpm run format:ci      # Prettier check only (no writes)
```

### Full pre-PR check

```bash
pnpm lint && pnpm test && pnpm build
```

---

## TypeScript

- **Strict mode** is fully enabled: `strict`, `noUncheckedIndexedAccess`,
  `noImplicitOverride`.
- Target: `ESNext`; module system: `NodeNext` with NodeNext resolution.
- All imports of types must use `import type { ... }` (enforced by
  `@typescript-eslint/consistent-type-imports`).
- All exported functions must have explicit return types
  (`@typescript-eslint/explicit-module-boundary-types`).
- Avoid non-null assertions (`!`); use proper narrowing instead
  (`@typescript-eslint/no-non-null-assertion` is a warning).
- Use `interface` for object shapes and `type` for unions/aliases — consistent
  with existing code (`Result`, `GameType`, `KFactorOptions`, `PlayerOptions`).
- Always include the `.js` extension on relative imports — NodeNext resolution
  requires it even for `.ts` source files.

---

## Code Style

### Formatting (Prettier)

- **Single quotes** for strings.
- **Trailing commas** everywhere (`all`).
- `quoteProps: 'consistent'` — quote all object keys or none within an object.
- `proseWrap: 'always'` — wrap markdown prose at print width.
- Prettier runs automatically via lint-staged on every commit.

### ESLint rules of note

- `eqeqeq` — always use `===`/`!==`.
- `curly: 'all'` — always use braces for control flow bodies, even single lines.
- `sort-keys` — object literal keys and interface fields must be sorted
  alphabetically in source files. Disabled in test files.
- `sort-imports` — named import specifiers must be sorted within each import
  statement. Declaration-level ordering is handled by `import-x/order`.
- `no-console` — disallowed in source (warning); permitted in tests.
- `no-async-promise-executor` — warning; avoid async functions inside
  `new Promise(...)`.
- **`eslint-plugin-unicorn`** (recommended) is enabled — it enforces a broad set
  of modern JS/TS idioms (e.g. prefer `Array.from`, avoid `Array.forEach`,
  prefer `globalThis`). Run `pnpm lint:style` to see and auto-fix violations.
- **`@vitest/eslint-plugin`** (recommended) is enabled in test files — enforces
  correct Vitest usage (e.g. no `.only` left in, proper async handling).

### Import ordering (`import-x/order`)

Groups, separated by a blank line, in this order:

1. Built-in + external packages
2. Internal (`@/…` path aliases)
3. Parent and sibling relative imports
4. Type-only imports

Within each group, imports are sorted case-insensitively in ascending order.

Example:

```ts
import { describe, expect, it } from 'vitest';

import { delta, expected, kFactor, update } from '../index.js';
```

---

## Naming Conventions

- **Functions**: camelCase (`kFactor`, `update`, `delta`, `expected`,
  `performance`).
- **Types / Interfaces**: PascalCase (`Result`, `GameType`, `KFactorOptions`,
  `PlayerOptions`, `GameOptions`, `ResultAndOpponent`).
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants (`MAX_DIFF`,
  `DP_TABLE`).
- **Variables / Parameters**: camelCase; use descriptive names, not single
  letters, except for well-understood mathematical shorthands (`a`, `b` for
  player ratings, `k` for K-factor, `p` for probability).
- **Test `describe` labels**: match the exported name exactly or a short prose
  description; `it` labels use a brief declarative phrase (e.g.
  `'returns 40 for a new player'`).

---

## Testing

- Framework: **Vitest** (configured via `package.json` scripts).
- Test files live in `src/__tests__/` with the `.spec.ts` suffix.
- Use `describe` blocks to group related cases; use `it` (not `test`) inside
  them.
- Prefer `expect(x).toBe(y)` for exact equality; use `toBeCloseTo` for
  floating-point comparisons.
- `sort-keys` and `no-console` are relaxed in test files — no need to sort keys
  in test data objects.
- Reference FIDE's online calculator when adding new rule-based tests:
  https://ratings.fide.com/calc.phtml?page=change

---

## Architecture Notes

- `expected(a, b)` — win probability for player A; clamps rating diff to ±400
  (FIDE §8.3.1).
- `kFactor(options)` — returns `10 | 20 | 40`. Decision order:
  1. `gameType === 'blitz' || 'rapid'` → 20
  2. `gamesPlayed <= 30` or `(age < 18 && rating < 2300)` → 40
  3. `rating >= 2400 || everHigher2400` → 10
  4. Otherwise → 20
- `delta(actual, expected, k)` — `k * (actual − expected)`.
- `update(a, b, resultOrOptions)` — accepts bare numbers or `PlayerOptions`
  objects for `a`/`b`, and a bare `Result` (0 | 0.5 | 1) or `GameOptions` object
  as the third argument. Results are rounded to the nearest integer.
- `performance(games)` — FIDE §8.2.3 performance rating via `DP_TABLE` lookup;
  throws `RangeError` for an empty array or out-of-range result values.
- The library has **no runtime dependencies**; keep it that way.

---

## Publishing

The package is published as `@echecs/elo`. A GitHub Actions workflow publishes
automatically when the `version` field in `package.json` is bumped on `main`. Do
not manually publish. Always update `CHANGELOG.md` alongside any version bump.
Bump patch for fixes, minor for new features, major for breaking changes.
