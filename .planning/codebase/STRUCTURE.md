# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
@echecs/elo/
├── .github/            # GitHub Actions CI/CD workflows
├── .planning/          # Planning and documentation (GSD)
├── dist/               # Compiled output (generated, gitignored)
├── src/                # Source code
│   ├── __tests__/      # Test files
│   └── index.ts        # Main implementation
├── package.json        # NPM package manifest
├── tsconfig.json       # TypeScript config (dev, includes tests)
├── tsconfig.build.json # TypeScript config (production, excludes tests)
├── eslint.config.mjs   # ESLint configuration
├── prettier.config.mjs # Prettier configuration
├── CLAUDE.md           # Claude Code project instructions
└── README.md           # Package documentation
```

## Directory Purposes

**src/**
- Purpose: Source code for the library
- Contains: TypeScript implementation and test files
- Key files: `index.ts` (main implementation)

**src/__tests__/**
- Purpose: Test suite for the library
- Contains: Vitest test files
- Key files: `index.spec.ts` (test suite)

**dist/**
- Purpose: Compiled JavaScript and type definitions
- Contains: Transpiled JS files and .d.ts type declarations
- Generated: Yes (via `tsc --project tsconfig.build.json`)
- Committed: No (gitignored, published to NPM)

**.github/workflows/**
- Purpose: CI/CD automation
- Contains: GitHub Actions workflow YAML files
- Key files: `test.yml`, `lint.yml`, `format.yml`, `release.yml`, `auto-merge.yml`

**.planning/codebase/**
- Purpose: GSD codebase documentation
- Contains: Architecture and structure documentation
- Generated: Yes (by GSD map-codebase command)
- Committed: No (local planning artifacts)

## Key File Locations

**Entry Points:**
- `src/index.ts`: Main implementation and public API exports
- `dist/index.js`: Compiled JavaScript entry point (NPM main)
- `dist/index.d.ts`: TypeScript type definitions (NPM types)

**Configuration:**
- `package.json`: NPM package manifest, scripts, dependencies
- `tsconfig.json`: TypeScript compiler config for development
- `tsconfig.build.json`: TypeScript compiler config for production builds
- `eslint.config.mjs`: ESLint rules and plugins
- `prettier.config.mjs`: Prettier formatting rules

**Core Logic:**
- `src/index.ts`: Complete implementation (145 lines)
  - Interfaces: `KFactorOptions`, `UpdateOptions`
  - Functions: `expected`, `kFactor`, `delta`, `update`
  - Constants: `MAX_DIFF = 400`

**Testing:**
- `src/__tests__/index.spec.ts`: Complete test suite (126 lines)
  - Tests ELO calculation accuracy
  - Tests FIDE rule compliance

## Naming Conventions

**Files:**
- Implementation: `index.ts` (single-file library)
- Tests: `*.spec.ts` pattern
- Config files: `*.config.{mjs,json}` pattern

**Directories:**
- Test directory: `__tests__` (double underscore prefix)
- Hidden/config directories: `.github`, `.planning` (dot prefix)

**Functions:**
- camelCase: `expected`, `kFactor`, `delta`, `update`
- Descriptive names matching domain concepts

**Types:**
- PascalCase interfaces: `KFactorOptions`, `UpdateOptions`
- Suffix pattern: `Options` for configuration objects

**Constants:**
- UPPER_SNAKE_CASE: `MAX_DIFF`

## Where to Add New Code

**New Feature:**
- Primary code: `src/index.ts`
- Tests: `src/__tests__/index.spec.ts`
- Pattern: Add function to `src/index.ts`, export it, add tests

**New Component/Module:**
- Implementation: `src/index.ts` (keep single-file unless significant expansion)
- If expanding beyond single file: Create `src/[feature].ts` and import in `src/index.ts`

**Utilities:**
- Shared helpers: `src/index.ts` (currently no separate utils directory)
- Pattern: Add as internal function (not exported) unless needed by consumers

**Type Definitions:**
- Location: Top of `src/index.ts` before implementations
- Pattern: Interface definitions before function implementations

**Tests:**
- Location: `src/__tests__/index.spec.ts`
- Pattern: Group related tests in `describe` blocks
- Naming: Match function name or FIDE rule being tested

## Special Directories

**dist/**
- Purpose: TypeScript compilation output
- Generated: Yes (via `pnpm run build`)
- Committed: No (gitignored)
- Published: Yes (included in NPM package via "files" field)

**node_modules/**
- Purpose: Installed dependencies
- Generated: Yes (via `pnpm install`)
- Committed: No (gitignored)
- Pattern: Standard NPM/pnpm directory

**.github/workflows/**
- Purpose: CI/CD automation
- Generated: No (manually maintained)
- Committed: Yes
- Pattern: Separate workflow per concern (test, lint, format, release)

---

*Structure analysis: 2026-01-31*
