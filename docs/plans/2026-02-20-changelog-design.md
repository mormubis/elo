# CHANGELOG Implementation Design

**Date:** 2026-02-20 **Project:** @echecs/elo **Status:** Approved

## Overview

This design document outlines the creation and maintenance of a comprehensive
CHANGELOG for the @echecs/elo library. The CHANGELOG will document all releases
from v1.0.0 to present, serve as the source of truth for user-facing release
notes, and feed into GitHub Releases.

## Goals

1. **Provide users** with a clear, comprehensive record of what changed in each
   release
2. **Track contributors** and give credit for each release
3. **Maintain single source of truth** — markdown CHANGELOG feeds GitHub
   Releases
4. **Enable future releases** to be documented quickly and consistently

## Approach

### Comprehensive Git-Based Reconstruction

Rather than relying on memory or spotty records, extract all commits between
version tags to create a complete historical record. This ensures accuracy and
captures all contributors.

## Design

### CHANGELOG.md Format

**Location:** `/Users/mormubis/workspace/echecs/elo/CHANGELOG.md` (root of
project)

**Format:** Keep a Changelog standard with semantic versioning

**Structure for each version:**

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New feature description (@contributor-name) - commit SHA or #PR

### Changed

- Behavior change description (@contributor-name) - #PR or commit SHA

### Fixed

- Bug fix description (@contributor-name) - #PR or #Issue

### Deprecated

- Deprecated feature (if applicable)

### Security

- Security fixes (if applicable)
```

### Version History Scope

**Versions to document:** v1.0.0 through v1.0.7 (current)

**For each version:**

- Use git tags to identify release dates
- Extract commits between consecutive tags
- Group commits by semantic type:
  - `feat:` → Added
  - `fix:` → Fixed
  - `chore:` → (typically omitted unless significant)
  - `docs:` → (typically omitted unless documentation improvements)
  - `perf:` → Changed (performance improvements)

**For each commit entry:**

- Include commit SHA (linked to GitHub: `github.com/mormubis/elo/commit/<SHA>`)
- Include PR number if available (linked to GitHub PR)
- Include contributor GitHub username (for attribution)
- Write human-readable description (not just copy commit message)

### Detailed Entries Example

```markdown
## [1.0.7] - 2026-02-20

### Added

- Pre-commit hooks with husky and lint-staged to enforce code quality before
  commits (@mormubis) - #TBD
- TypeDoc integration for auto-generating API documentation from JSDoc comments
  (@mormubis) - #TBD
- `pnpm run docs` script to generate HTML API documentation (@mormubis) - #TBD

### Fixed

- Format output for TypeDoc generation (@mormubis) - b48ede0

### Changed

- Improved development tooling configuration for better developer experience
  (@mormubis) - d68de0e

## [1.0.6] - 2026-02-19

### Changed

- Exported type definitions for better TypeScript integration (@mormubis) -
  07a5f89
```

### GitHub Releases

**Creation process:**

1. After CHANGELOG.md is finalized, create GitHub Release for each version
2. Use the CHANGELOG section as the release notes body
3. Tag: `v1.0.0`, `v1.0.1`, etc. (match version numbers)
4. Release name: `v1.0.0` or descriptive name (e.g., "Initial Release")

**Automation:** Manual creation via GitHub UI or `gh release create` command

**Link:** User can see releases at `github.com/mormubis/elo/releases`

### Maintenance Process

**For future releases:**

1. Before publishing a new version:
   - Identify all commits since last release
   - Group by category (Added/Changed/Fixed)
   - Create CHANGELOG entry with new version number and today's date
   - Update package.json version

2. After publishing:
   - Create GitHub Release with matching CHANGELOG section
   - Tag the release commit with version tag

3. Commit CHANGELOG updates:
   - Commit message: `chore: update CHANGELOG for v1.0.X`

## File Structure

```
project-root/
├── CHANGELOG.md          # New file, manually maintained
├── package.json          # Contains current version
└── docs/plans/
    └── 2026-02-20-changelog-design.md
```

## Success Criteria

✅ **CHANGELOG.md exists** with all releases v1.0.0 through v1.0.7 documented

✅ **Each entry includes:**

- Version number and date
- Added/Changed/Fixed/Deprecated sections
- Commit SHAs and PR numbers
- Contributor names

✅ **GitHub Releases created** for all documented versions

✅ **Future releases** will be documented consistently following this pattern

## Implementation Approach

1. Extract git history for each version using `git log` between tags
2. Manually write human-readable descriptions (not auto-generated commit
   messages)
3. Include contributor and commit/PR references for traceability
4. Create GitHub Releases from finalized CHANGELOG entries
5. Document the process in CLAUDE.md for future maintainers

## Testing & Validation

- Verify CHANGELOG.md is valid markdown
- Verify all version numbers match git tags
- Verify all links (GitHub commit/PR/contributor) are functional
- Verify GitHub Releases are created and visible
