# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**None:**
- This is a pure calculation library with no external API integrations
- No HTTP clients or API SDKs detected
- All computation is local/synchronous

## Data Storage

**Databases:**
- None - Stateless library

**File Storage:**
- None - No file I/O operations

**Caching:**
- None - Pure functions with no memoization

## Authentication & Identity

**Auth Provider:**
- Not applicable - Library provides calculations only

## Monitoring & Observability

**Error Tracking:**
- None - Library consumers responsible for error handling

**Logs:**
- No logging framework
- Pure functions with deterministic outputs

## CI/CD & Deployment

**Hosting:**
- NPM Registry (registry.npmjs.org)
- Published under `@echecs` scope

**CI Pipeline:**
- GitHub Actions
- Workflows location: `.github/workflows/`
  - `release.yml` - Automated NPM publishing on version bump
  - `test.yml` - Test execution
  - `lint.yml` - Linting checks
  - `format.yml` - Code formatting checks
  - `auto-merge.yml` - Automated dependency merges

**Deployment Process:**
- Triggered on push to `main` branch
- Version change detection via EndBug/version-check@v2
- Automated publishing with provenance (`pnpm publish --access public --provenance`)
- Requires `NPM_TOKEN` secret

## Environment Configuration

**Required env vars:**
- None for library consumers
- CI only: `NPM_TOKEN` (for publishing)
- CI only: `NODE_AUTH_TOKEN` (set from NPM_TOKEN)

**Secrets location:**
- GitHub Secrets (for CI/CD)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Package Distribution

**Registry:**
- NPM (https://registry.npmjs.org)
- Package name: `@echecs/elo`
- Access: Public
- Provenance: Enabled (supply chain security)

**Version Management:**
- Manual version bumps in `package.json`
- Automated release on version change detection

---

*Integration audit: 2026-01-31*
