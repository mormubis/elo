# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code (`src/`)

**Secondary:**
- JavaScript (ESM) - Configuration files (`*.config.mjs`)

## Runtime

**Environment:**
- Node.js (latest version, as specified in CI)

**Package Manager:**
- pnpm (latest version)
- Lockfile: `pnpm-lock.yaml` present (lockfileVersion: 9.0)

## Frameworks

**Core:**
- None - Pure TypeScript library with no runtime dependencies

**Testing:**
- Vitest ^4.0.1 - Test framework and runner

**Build/Dev:**
- TypeScript Compiler (tsc) 5.9.3 - Build tool
- ESLint 9.39.2 - Static analysis
- Prettier 3.8.1 - Code formatting

## Key Dependencies

**Critical:**
- Zero runtime dependencies - Pure calculation library

**Development Infrastructure:**
- `@typescript-eslint/parser` ^8.28.0 - TypeScript linting
- `typescript-eslint` ^8.28.0 - TypeScript ESLint integration
- `eslint-plugin-import-x` ^4.9.3 - Import/export validation
- `eslint-config-prettier` ^10.1.1 - ESLint/Prettier integration
- `eslint-import-resolver-typescript` ^4.2.5 - TypeScript module resolution for ESLint

## Configuration

**Environment:**
- No environment variables required
- No external service configuration
- Pure calculation library with no I/O

**Build:**
- `tsconfig.json` - Development TypeScript configuration
- `tsconfig.build.json` - Production build configuration (excludes tests)
- `eslint.config.mjs` - ESLint flat config with strict + stylistic rules
- `prettier.config.mjs` - Code formatting rules
- `lint-staged.config.mjs` - Pre-commit hook configuration

## Platform Requirements

**Development:**
- Node.js (latest stable)
- pnpm package manager
- TypeScript 5.8.2+ compatible environment

**Production:**
- Published to NPM as `@echecs/elo` scoped package
- Module type: ESM (type: "module" in `package.json`)
- Exports: `dist/index.js` (main), `dist/index.d.ts` (types)
- Target: ESNext with NodeNext module resolution

---

*Stack analysis: 2026-01-31*
