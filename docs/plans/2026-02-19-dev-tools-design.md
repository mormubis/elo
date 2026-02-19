# Development Tools Upgrade Design

**Date:** 2026-02-19
**Project:** @echecs/elo
**Status:** Approved

## Overview

This design document outlines the enhancement of the @echecs/elo development tooling to improve developer experience and enforce best practices. The existing CI/CD workflows are already in place and functional. This upgrade focuses on adding pre-commit hooks and API documentation generation.

## Current State

**Existing Infrastructure:**
- Lint, test, build, and publish workflows already running on every commit
- TypeScript 5.8.2 with strict mode enabled
- ESLint with flat config (modern setup)
- Prettier for code formatting
- Vitest for testing
- pnpm as the package manager

**Gaps:**
- No pre-commit hooks to catch issues before commits
- No auto-generated API documentation
- Developers must rely on CI feedback rather than local validation

## Proposed Changes

### Phase 1: Pre-commit Hooks & Documentation Generation

#### 1. Pre-commit Hooks (husky + lint-staged)

**Add dependencies:**
- `husky` — Git hooks management framework
- `lint-staged` — Run linters/formatters on staged files only

**Configure hooks:**
- Create `.husky/pre-commit` hook that runs `lint-staged`
- Configure `lint-staged` in `package.json` to:
  - Format files with Prettier
  - Lint TypeScript files with ESLint
  - Type-check with TypeScript compiler

**Benefits:**
- Catches formatting and linting issues locally before commits
- Faster feedback loop (no need to wait for CI)
- Prevents broken code from entering the repository
- Improves code quality consistency

**Example `.husky/pre-commit` behavior:**
```
Staged files → Format → Lint → Type-check → Commit
```

#### 2. TypeDoc Integration

**Add dependency:**
- `typedoc` — Generates API documentation from JSDoc/TSDoc comments

**Configure:**
- Create `typedoc.json` configuration file
- Add `pnpm run docs` script to generate documentation
- Output directory: `docs/api/`

**Documentation setup:**
- Automatically extract documentation from JSDoc comments in source code
- Generate HTML documentation site
- Include type definitions and usage examples
- Keep docs in sync with code without manual updates

**Benefits:**
- Auto-generated, always accurate API documentation
- Professional documentation for library users
- Can be published with releases or deployed to GitHub Pages
- Reduces manual documentation maintenance

## Architecture

### Directory Structure

```
.husky/
  └── pre-commit          # Pre-commit hook configuration
docs/
  ├── api/                # Generated TypeDoc output
  └── plans/              # Design documents
package.json             # lint-staged config + docs script
typedoc.json            # TypeDoc configuration
```

### Configuration Files

**`typedoc.json`:**
```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "declaration": true,
  "readme": "README.md"
}
```

**`package.json` (lint-staged config):**
```json
{
  "lint-staged": {
    "**/*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "**/*.json": ["prettier --write"]
  }
}
```

## Implementation Details

### Pre-commit Hook Workflow

1. User runs `git commit`
2. Husky intercepts and runs `.husky/pre-commit`
3. lint-staged identifies staged files
4. Prettier formats staged files
5. ESLint lints and fixes issues
6. TypeScript type-checks the project
7. If all pass, commit proceeds; otherwise, user fixes and tries again

### Documentation Generation

- Run `pnpm run docs` to generate API documentation
- Output stored in `docs/api/` (added to `.gitignore`)
- Can be triggered locally or in CI workflows
- Provides searchable, navigable API reference

## Success Criteria

✅ **Pre-commit hooks:**
- Developers see linting/formatting feedback before pushing to CI
- No broken code commits reach the repository
- Setup is transparent and doesn't slow down commits noticeably

✅ **Documentation:**
- API documentation can be generated with a single command
- Documentation is automatically derived from JSDoc comments
- Documentation is accessible and searchable

## Rollout Plan

1. Install dependencies (`husky`, `lint-staged`, `typedoc`)
2. Configure and test pre-commit hooks locally
3. Configure and test TypeDoc locally
4. Commit all configuration files
5. Document setup in README if needed

## Testing

- Run `pnpm run docs` to verify TypeDoc output
- Commit a file with intentional linting issues to verify pre-commit hook blocks it
- Fix issues and verify commit succeeds

## Future Considerations

- Publishing generated docs to GitHub Pages or similar
- Integrating TypeDoc output generation into CI/CD pipeline
- Adding custom TypeDoc themes or branding
- Expanding documentation with guides and examples
