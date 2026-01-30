---
description: "Task list for Bunx Execution Support"
---

# Tasks: Bunx Execution Support

**Input**: Design documents from `/specs/005-bunx-execution/`
**Prerequisites**: plan.md, spec.md

**Tests**: Integration tests for bunx execution REQUIRED. Local Bun execution test REQUIRED.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Package Configuration (Foundational)

- [x] T001 [P] Update `package.json`:
  - Add `"name": "settlement-planner"`
  - Add `"description": "Elite Dangerous settlement ranking and analysis CLI"`
  - Add `"bin": { "settlement-planner": "./src/cli/index.ts" }`
  - Add `"keywords"` for npm discoverability (e.g., ["elite-dangerous", "settlement", "ranking", "cli"])

- [x] T002 [P] Add npm scripts to `package.json`:
  - `"postinstall": "chmod +x src/cli/index.ts"` - Ensure entry point is executable after install
  - `"test": "bun test"` - Run tests
  - `"typecheck": "tsc --noEmit"` - Type check without emitting output

**Checkpoint**: Package metadata configured correctly

---

## Phase 2: Build & Shebang Setup (Blocking)

- [x] T003 [P] Add shebang to `src/cli/index.ts`:
  - Insert `#!/usr/bin/env bun` as the very first line (before imports)
  - Verify Bun executes the file directly
  - Test: Confirm `src/cli/index.ts` starts with `#!/usr/bin/env bun`

- [x] T004 [P] Verify entry point execution:
  - Ensure `src/cli/index.ts` is executable
  - Run `bun run src/cli/index.ts --help` and verify output

- [x] T005 [P] Configure permissions enforcement:
  - Test: `ls -la src/cli/index.ts` confirms executable bit
  - Ensure `postinstall` script applies `chmod +x src/cli/index.ts`
  - Document manual chmod fallback in README

- [x] T006 [P] If a build output is introduced later, ensure `dist/` is ignored in `.gitignore`

**Checkpoint**: Build process produces executable entry point with shebang

---

## Phase 3: Local Testing (Validation)

- [x] T007 [P] Test direct Bun execution:
  - Run: `bun run src/cli/index.ts --help`
  - Verify help text displays correctly
  - Run: `bun run src/cli/index.ts --input galaxy.json --format json`
  - Verify output is valid JSON and no errors
  - Verify exit code 0 on success

- [x] T008 [P] Test error handling:
  - Run: `bun run src/cli/index.ts --input nonexistent.json`
  - Verify error message is clear
  - Verify exit code is non-zero (e.g., 1)

- [x] T009 [P] Test stdin/stdout piping:
  - Create test fixture with valid JSON input
  - Run: `cat test_fixture.json | bun run src/cli/index.ts --format json | head -5`
  - Verify pipe works and output is valid

**Checkpoint**: Direct Bun execution works correctly

---

## Phase 4: Bunx Testing (Integration)

- [x] T010 [P] Set up local npm testing environment:
  - Option A: Use `npm link` to test local package
  - Option B: Publish to local npm registry for testing
  - **Recommended**: Use `npm link` for development testing

- [x] T011 [P] Test bunx execution with `npm link`:
  - Run: `npm link` in project root
  - Run: `bunx settlement-planner --help`
  - Verify help text displays
  - Run: `bunx settlement-planner --input galaxy.json`
  - Verify results are correct and match direct Bun execution

- [x] T012 [P] Test all CLI flags via bunx:
  - Test: `bunx settlement-planner --input galaxy.json --format json`
  - Test: `bunx settlement-planner --input galaxy.json --scoring tritium --limit 20`
  - Test: `bunx settlement-planner --input galaxy.json --sort score-desc,dsol-asc --verbose`
  - Test: `bunx settlement-planner --use-quadrants NW,NE`
  - Test: `bunx settlement-planner --selection-strategy cube --cube-from "0/0/0" --cube-to Colonia`
  - Verify all flags work identically to direct execution

- [x] T013 [P] Test bunx error handling:
  - Run: `bunx settlement-planner --scoring invalid` (invalid strategy)
  - Verify error is reported and exit code is non-zero
  - Run: `bunx settlement-planner --help | grep "scoring"`
  - Verify help text includes strategy options

- [x] T014 [P] Test stdin/stdout piping via bunx:
  - Run: `cat test_fixture.json | bunx settlement-planner --format json | jq .`
  - Verify piping works and output is valid

- [ ] T015 [P] Test bunx from GitHub repository (optional):
  - If repository is public, test: `bunx github.com/owner/settlement-planner@main --help`
  - Verify GitHub URL resolution works

**Checkpoint**: Bunx execution works for all CLI features

---

## Phase 5: Documentation (User-Facing)

- [x] T016 [P] Update README.md:
  - Add section: "Installation via bunx"
  - Document: `bunx settlement-planner --help`
  - Add example: `bunx settlement-planner --input galaxy.json`
  - Add section: "Using bunx vs. local installation"
  - Clarify Bun requirement

- [x] T017 [P] Create quickstart examples for bunx:
  - Example 1: `bunx settlement-planner --input galaxy.json`
  - Example 2: `bunx settlement-planner --input galaxy.json --scoring tritium --limit 20`
  - Example 3: `cat galaxy.json | bunx settlement-planner --format json`
  - Add to `specs/005-bunx-execution/quickstart.md`

- [x] T018 [P] Add troubleshooting guide to README:
  - "Command not found: bunx" → Install Bun
  - "Permission denied" → Manual `chmod +x` if needed

- [x] T019 [P] Update CLI help text in src/cli/index.ts:
  - Add note: "For bunx usage: bunx settlement-planner [options]"
  - Ensure all examples in help text are clear and accurate

**Checkpoint**: Documentation complete and user-ready

---

## Phase 6: Publishing Setup (Distribution)

- [x] T020 [P] Prepare for npm publishing:
  - Ensure `package.json` has `"repository"` field pointing to GitHub
  - Ensure `"license"` field is set (e.g., MIT)
  - Ensure `"author"` field is set (or maintainers)
  - Add `.npmignore` or update `.gitignore` to exclude test files, specs, etc. from npm package
  - Verify `"main"` and `"bin"` fields are correct

- [x] T021 [P] Create npm publishing CI/CD step:
  - Add GitHub Actions workflow (e.g., `.github/workflows/publish.yml`)
  - Trigger on release tag (e.g., `v*`)
  - Run: `npm run build`, `npm run test`, `npm publish`
  - Document npm registry authentication (credentials/tokens)

- [x] T022 [P] Document release process:
  - Document semantic versioning for releases
  - Document how to tag and create releases on GitHub
  - Document npm access requirements and credential setup

**Checkpoint**: Publishing infrastructure ready

---

## Verification Checklist

Before marking feature complete, verify:

- [ ] All 22 tasks completed
- [ ] `package.json` has correct `bin`, `name`, and metadata fields
- [ ] Entry point includes Bun shebang and is executable
- [ ] Direct Bun execution works: `bun run src/cli/index.ts --help`
- [ ] Bunx execution works: `bunx settlement-planner --help` (after `npm link`)
- [ ] All CLI flags work via bunx
- [ ] stdin/stdout piping works via bunx
- [ ] Error handling and exit codes are correct
- [ ] Help text and documentation are accurate
- [ ] README includes bunx usage instructions
- [ ] Publishing infrastructure is in place

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
- Cannot test bunx (Phase 4) until build setup complete (Phase 2)
- Cannot document (Phase 5) until testing validates behavior (Phase 3-4)
- Cannot publish (Phase 6) until all phases complete and tested

---

## Notes

- The shebang is critical; test explicitly with `bun run src/cli/index.ts` and `bunx settlement-planner`
- `npm link` is useful for local testing before publishing to npm
- After publishing to npm, real-world `bunx` test: `bunx settlement-planner --help`
- Keep `dist/` directory in `.gitignore` if a build output is introduced later
- Semantic versioning and releases should follow npm best practices
- Consider adding GitHub releases with changelog for user visibility

