# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.0.1] - 2023-01-07

### Fixed

- Remove any additional unused space (Adrian de la Rosa) - 6a44031

## [1.0.2] - 2023-01-08

### Changed

- Bump dependencies (Adrian de la Rosa) - 96f54db

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

## [1.0.4] - 2024-09-14

### Fixed

- Fix CI (Adrian de la Rosa) - 119a48a

## [1.0.5] - 2024-09-20

### Changed

- Bump dependencies (Adrian de la Rosa) - b4487ee
- Bump dependencies (Adrian de la Rosa) - 98da831

## [1.0.6] - 2024-09-20

### Changed

- Bump typescript-eslint from 8.5.0 to 8.6.0 (Adrian de la Rosa) - 990074d
- Bump dependencies (Adrian de la Rosa) - a1dfedf
- Bump dependencies (Adrian de la Rosa) - 248277b
- Format code (Adrian de la Rosa) - 72dfa88
- Format lock file (Adrian de la Rosa) - 421caf8

[1.0.0]: https://github.com/mormubis/elo/releases/tag/v1.0.0
[1.0.1]: https://github.com/mormubis/elo/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/mormubis/elo/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/mormubis/elo/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/mormubis/elo/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/mormubis/elo/compare/v1.0.4...v1.0.5
[1.0.6]: https://github.com/mormubis/elo/compare/v1.0.5...v1.0.6
