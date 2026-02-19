# Development Tools Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pre-commit hooks (husky + lint-staged) and API documentation generation (TypeDoc) to improve developer experience and enforce code quality standards.

**Architecture:** Install and configure two separate tools: (1) husky/lint-staged to intercept commits and run formatting/linting locally before code reaches the repository, (2) TypeDoc to auto-generate API documentation from JSDoc comments. Both are standard, minimal-footprint tools that integrate cleanly with the existing pnpm/ESLint/Prettier setup.

**Tech Stack:** husky (git hooks), lint-staged (staged file linting), TypeDoc (API docs generation), pnpm (package manager)

---

## Task 1: Install husky, lint-staged, and TypeDoc

**Files:**
- Modify: `package.json` (dependencies will be added automatically)

**Step 1: Install husky and lint-staged as dev dependencies**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
pnpm add -D husky lint-staged
```

Expected output: Both packages appear in `devDependencies` section.

**Step 2: Install TypeDoc as dev dependency**

Run:
```bash
pnpm add -D typedoc
```

Expected output: typedoc appears in `devDependencies` section.

**Step 3: Verify installation**

Run:
```bash
pnpm list husky lint-staged typedoc
```

Expected output: All three packages listed with versions.

**Step 4: Commit dependency changes**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
git add package.json pnpm-lock.yaml
git commit -m "chore: add husky, lint-staged, and typedoc"
```

Expected: Clean commit with package files updated.

---

## Task 2: Initialize husky and configure pre-commit hook

**Files:**
- Create: `.husky/pre-commit`
- Create: `.husky/.gitignore`
- Modify: `package.json` (add lint-staged config)

**Step 1: Initialize husky**

Run:
```bash
pnpm husky install
```

Expected output: husky directory structure created with sample hooks.

**Step 2: Add lint-staged configuration to package.json**

Read `package.json` first, then add this configuration in the root level (after "scripts" section):

```json
{
  ...existing config...,
  "scripts": {
    ...existing scripts...
  },
  "lint-staged": {
    "**/*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "**/*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

**Step 3: Create pre-commit hook**

Create file `/Users/mormubis/workspace/echecs/elo/.husky/pre-commit` with content:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

Make it executable:
```bash
chmod +x /Users/mormubis/workspace/echecs/elo/.husky/pre-commit
```

**Step 4: Create .husky/.gitignore to ignore husky internals**

Create file `/Users/mormubis/workspace/echecs/elo/.husky/.gitignore` with content:

```
_
```

**Step 5: Verify hook structure**

Run:
```bash
ls -la /Users/mormubis/workspace/echecs/elo/.husky/
```

Expected output: Shows `pre-commit` and `.gitignore` files.

**Step 6: Test the hook manually (dry run)**

Run:
```bash
pnpm lint-staged --dry-run
```

Expected output: Shows which files would be processed (likely empty if nothing staged).

**Step 7: Commit husky configuration**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
git add .husky/ package.json
git commit -m "chore: configure husky and lint-staged pre-commit hooks"
```

Expected: Clean commit with hook and config files.

---

## Task 3: Configure and verify TypeDoc

**Files:**
- Create: `typedoc.json`
- Create: `docs/api/.gitkeep`

**Step 1: Create typedoc.json configuration**

Create file `/Users/mormubis/workspace/echecs/elo/typedoc.json` with content:

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "readme": "README.md",
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": false,
  "includeVersion": true,
  "sort": ["source-order"]
}
```

**Step 2: Create docs/api directory with .gitkeep**

Run:
```bash
mkdir -p /Users/mormubis/workspace/echecs/elo/docs/api
touch /Users/mormubis/workspace/echecs/elo/docs/api/.gitkeep
```

**Step 3: Add docs script to package.json**

Read current `package.json`, then add to the "scripts" section:

```json
{
  "scripts": {
    ...existing scripts...,
    "docs": "typedoc"
  }
}
```

**Step 4: Test TypeDoc generation**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
pnpm run docs
```

Expected output: TypeDoc generates HTML documentation in `docs/api/` directory. You should see output like:
```
[14:32:18] Documentation generated at /Users/mormubis/workspace/echecs/elo/docs/api
```

**Step 5: Verify documentation output**

Run:
```bash
ls -la /Users/mormubis/workspace/echecs/elo/docs/api/
```

Expected output: See files like `index.html`, `modules.html`, etc. (actual generated docs).

**Step 6: Add docs directory to .gitignore**

Read `/Users/mormubis/workspace/echecs/elo/.gitignore`, then ensure this line exists:

```
docs/api/
```

If it doesn't exist, add it.

**Step 7: Commit TypeDoc configuration**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
git add typedoc.json docs/api/.gitkeep .gitignore package.json
git commit -m "chore: configure TypeDoc for API documentation generation"
```

Expected: Clean commit with TypeDoc config.

---

## Task 4: Test pre-commit hook with actual commit

**Files:**
- No files modified, just testing

**Step 1: Make a trivial change to test the hook**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
echo "// test" >> src/index.ts
```

**Step 2: Stage the change**

Run:
```bash
git add src/index.ts
```

**Step 3: Attempt to commit and observe hook in action**

Run:
```bash
git commit -m "test: verify pre-commit hook runs"
```

Expected output: Pre-commit hook runs lint-staged, formatting and linting occurs automatically. The commit should succeed because:
- Prettier formats the test comment
- ESLint checks it (may pass or fail, but non-blocking)
- TypeScript type-checks pass

**Step 4: Verify the hook made changes**

Run:
```bash
git diff HEAD
```

Expected: Shows the formatted test comment (may have minor formatting adjustments).

**Step 5: Reset to clean state**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
git reset HEAD~1
git checkout src/index.ts
```

This undoes the test commit.

**Step 6: Verify we're back to clean state**

Run:
```bash
git status
```

Expected: Working tree clean.

---

## Task 5: Verify full setup and clean up

**Files:**
- No new files, just verification

**Step 1: Run all linting checks locally**

Run:
```bash
cd /Users/mormubis/workspace/echecs/elo
pnpm run lint
```

Expected: All linting passes (no errors).

**Step 2: Run all tests locally**

Run:
```bash
pnpm run test
```

Expected: All tests pass.

**Step 3: Build the project**

Run:
```bash
pnpm run build
```

Expected: Build completes successfully.

**Step 4: Verify documentation generation again**

Run:
```bash
pnpm run docs
```

Expected: Documentation regenerates without errors.

**Step 5: View the generated documentation (optional but recommended)**

Run:
```bash
open /Users/mormubis/workspace/echecs/elo/docs/api/index.html
```

This opens the generated API docs in your browser. Verify it looks reasonable and shows your ELO functions.

**Step 6: Final status check**

Run:
```bash
git status
```

Expected: Working tree clean (only generated docs in `docs/api/` should be untracked, but ignored by git).

---

## Summary

After these 5 tasks complete:

✅ **husky + lint-staged** installed and configured to run Prettier + ESLint on staged files before each commit
✅ **TypeDoc** installed and configured to generate API documentation from JSDoc comments
✅ **Pre-commit hooks** block commits with formatting/linting issues, improving code quality
✅ **API documentation** can be generated with `pnpm run docs` command
✅ **All changes committed** to git with clear, descriptive commits

The developer experience is now improved: local feedback on formatting/linting before CI, and auto-generated API documentation for users of the library.

---

## Testing Checklist

- [ ] `pnpm run lint` passes
- [ ] `pnpm run test` passes
- [ ] `pnpm run build` succeeds
- [ ] `pnpm run docs` generates documentation
- [ ] Pre-commit hook blocks code with linting errors
- [ ] Pre-commit hook auto-fixes formatting issues
- [ ] Generated docs in `docs/api/` are readable and complete
