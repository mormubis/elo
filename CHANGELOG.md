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

[1.0.0]: https://github.com/mormubis/elo/releases/tag/v1.0.0
