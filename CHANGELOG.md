# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-02-21

### Changed

- `update()` now accepts `PlayerOptions` objects for `a` and `b` parameters,
  allowing per-player options (`age`, `games`, `everHigher2400`, `k`) to be
  passed directly on each player argument
- Game-level options (`isBlitz`, `isRapid`, `result`) are now passed as a
  `GameOptions` object in the third argument

### Removed

- `UpdateOptions` type removed from public API; use `PlayerOptions` and
  `GameOptions` instead
- `kA`, `kB`, `k` (shared) fields removed from third argument; use `k` on each
  `PlayerOptions` object instead

### Migration

```ts
// Before
update(1400, 1600, { ageA: 17, gamesB: 5, kA: 40, result: 1 });

// After
update({ age: 17, k: 40, rating: 1400 }, { games: 5, rating: 1600 }, 1);
```

## [1.1.0] - 2026-02-21

### Added

- `performance(games: ResultAndOpponent[])` function implementing FIDE §8.2.3
  performance rating calculation
- `ResultAndOpponent` interface exported for use with `performance()`

## [1.0.8] - 2026-02-20

### Added

- SECURITY.md with private vulnerability disclosure process
- GitHub issue templates for bug reports and feature requests
- Pull request template with checklist
- GitHub Pages documentation deployment via TypeDoc
- Coverage reporting with Codecov
- GitHub Release creation on publish

### Changed

- Expanded test suite with direct tests for `delta()` and `kFactor()`, draw/loss
  result paths, `isRapid`, `everHigher2400B`, and K-factor overrides
- Added `homepage`, `bugs`, `engines`, and `exports` fields to `package.json`
- Fixed installation command in README (removed `--save-dev`)
- Added npm version, CI, coverage, and license badges to README
- Removed duplicate `lint-staged` config from `package.json`

### Fixed

- Added missing `@vitest/coverage-v8` dependency for coverage reporting

## [1.0.7] - 2026-02-20

### Added

- Pre-commit hooks with husky and lint-staged to enforce code quality before
  commits (Adrian de la Rosa) - d68de0e
- TypeDoc integration for auto-generating API documentation from JSDoc comments
  (Adrian de la Rosa) - 98ebef5
- `pnpm run docs` script to generate HTML API documentation (Adrian de la
  Rosa) - 98ebef5

### Fixed

- Format output for TypeDoc generation (Adrian de la Rosa) - b48ede0

## [1.0.6] - 2024-09-20

### Changed

- Bump typescript-eslint from 8.5.0 to 8.6.0 (Adrian de la Rosa) - 990074d
- Bump dependencies (Adrian de la Rosa) - a1dfedf
- Bump dependencies (Adrian de la Rosa) - 248277b
- Format code (Adrian de la Rosa) - 72dfa88
- Format lock file (Adrian de la Rosa) - 421caf8

## [1.0.5] - 2024-09-20

### Changed

- Bump dependencies (Adrian de la Rosa) - b4487ee
- Bump dependencies (Adrian de la Rosa) - 98da831

## [1.0.4] - 2024-09-14

### Fixed

- Fix CI (Adrian de la Rosa) - 119a48a

## [1.0.3] - 2024-09-14

### Changed

- Bump dependencies (Adrian de la Rosa) - 2c9f8bc
- Bumped ts-jest from 29.0.3 to 29.0.5 (Adrian de la Rosa) - 4b983b1
- Bumped @types/jest from 29.2.5 to 29.2.6 (Adrian de la Rosa) - 68963d0
- Bumped prettier from 2.8.1 to 2.8.7 (Adrian de la Rosa) - 3b3cd5d
- Bumped typescript from 4.9.4 to 5.0.3 (Adrian de la Rosa) - 3c616a4
- Bumped jest from 29.3.1 to 29.5.0 (Adrian de la Rosa) - 5609e56
- Bumped ts-jest from 29.0.5 to 29.1.0 (Adrian de la Rosa) - e9ff0c2
- Bumped typescript from 5.0.3 to 5.0.4 (Adrian de la Rosa) - 621dd81
- Bumped @types/jest from 29.5.0 to 29.5.1 (Adrian de la Rosa) - 35fc512
- Bumped prettier from 2.8.7 to 2.8.8 (Adrian de la Rosa) - fb15bbf

## [1.0.2] - 2023-01-08

### Changed

- Bump dependencies (Adrian de la Rosa) - 96f54db

## [1.0.1] - 2023-01-07

### Fixed

- Remove any additional unused space (Adrian de la Rosa) - 6a44031

## [1.0.0] - 2023-01-04

### Added

- Initial ELO rating system implementation following FIDE rules
- `expected(a, b)` function to calculate win probability based on rating
  difference
- `kFactor(options)` function to determine K-factor based on FIDE rules
- `delta(actual, expected, kFactor)` function to calculate rating change
- `update(a, b, result)` main function for orchestrating rating updates
- TypeScript strict mode with full type safety
- Comprehensive test coverage for all FIDE rules and edge cases
- ESLint and Prettier configuration for code quality
- GitHub Actions CI/CD workflow for automated testing
- NPM publishing automation

[Unreleased]: https://github.com/mormubis/elo/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/mormubis/elo/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/mormubis/elo/compare/v1.0.8...v1.1.0
[1.0.8]: https://github.com/mormubis/elo/compare/v1.0.7...v1.0.8
[1.0.0]: https://github.com/mormubis/elo/releases/tag/v1.0.0
[1.0.1]: https://github.com/mormubis/elo/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/mormubis/elo/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/mormubis/elo/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/mormubis/elo/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/mormubis/elo/compare/v1.0.4...v1.0.5
[1.0.6]: https://github.com/mormubis/elo/compare/v1.0.5...v1.0.6
[1.0.7]: https://github.com/mormubis/elo/compare/v1.0.6...v1.0.7
