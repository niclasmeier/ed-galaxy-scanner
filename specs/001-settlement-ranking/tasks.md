---

description: "Task list for Settlement Candidate Ranking CLI"

---

# Tasks: Settlement Candidate Ranking CLI

**Input**: Design documents from `/specs/001-settlement-ranking/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for scoring/distance/order and a golden CLI test are REQUIRED.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create project structure per plan in src/ and tests/
- [x] T002 Initialize Bun + TypeScript config with strict mode and add `commander` dependency
- [x] T004 [P] Configure linting and formatting tools; enforce in CI or task runner
- [x] T003 [P] Add basic CLI entry file stub in src/cli/index.ts with `--input`, `--max-dist-sol`, `--format`, `--continue-on-error`
- [x] T003a [P] Add `--use-quadrants` CLI option with comma-separated quadrant names (NW, NE, SW, SE) or "all"; default SW

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T005 Define domain types in src/domain/types.ts aligned to [specs/001-settlement-ranking/data-model.md](specs/001-settlement-ranking/data-model.md)
- [x] T005a [P] Add quadrant constants (SAGITTARIUS_A, quadrant definitions) in src/domain/types.ts or dedicated quadrant utility
- [x] T006 [P] Implement distance utility in src/utils/distance.ts (Euclidean distance, Sol distance)
- [x] T006a [P] Implement quadrant determination utility in src/utils/quadrant.ts or src/domain/quadrant.ts
- [x] T007 [P] Implement JSONL reader in src/io/jsonl.ts with line parsing, line numbers, and error handling
- [x] T007a [P] Extend JSONL reader to apply quadrant filtering during read (discard non-matching systems early)
- [x] T008 [P] Implement JSON array reader in src/io/jsonl.ts (or separate module) for single-list JSON input
- [x] T008a [P] Extend JSON array reader to apply quadrant filtering during read
- [x] T009 Implement cube index in src/domain/settlement.ts (50 LY cube keys, on-demand cube creation, systems list, populated flag, and list of cubes with ≥1 system)
- [x] T010 Implement output formatter in src/io/output.ts for JSON and text output
- [x] T011 Implement performance guardrails: warn and offer reduced-scope option when limits exceeded
- [x] T011a [P] Update verbose summary to report quadrant filtering statistics (systems discarded)

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Generate ranked settlement candidates (Priority: P1) 🎯 MVP

**Goal**: Produce a deterministic, sorted list of settlement candidates from valid input

**Independent Test**: Run CLI on a fixed fixture and verify deterministic sorted output

### Tests (write first)

- [x] T012 [P] [US1] Unit tests for scoring rules in tests/unit/scoring.test.ts
- [x] T013 [P] [US1] Unit tests for cube indexing and 15 LY filtering in tests/unit/settlement.test.ts
- [x] T014 [P] [US1] Unit tests for ordering and tie-breakers in tests/unit/settlement.test.ts
- [x] T015 [P] [US1] Golden CLI test with fixture in tests/integration/cli.golden.test.ts

### Implementation

- [x] T016 [P] [US1] Implement scoring in src/domain/scoring.ts (stars, neutron, planets, gas giants, landable, water, terraformable, HMC)
- [x] T017 [US1] Implement candidate search using cube index in src/domain/settlement.ts
  - filter by max distance to Sol
  - split populated vs empty
  - build cube buckets (50 LY) on demand
  - maintain list of cubes with at least one system and mark cubes with populated systems
  - scan populated cubes and their 26 neighbors for empty candidates
  - include candidates within 15 LY
- [x] T018 [US1] Wire CLI flow in src/cli/index.ts: read input, run algorithm, output results, handle errors

**Checkpoint**: User Story 1 complete and independently testable

---

## Phase 4: User Story 2 - Limit search to a Sol distance (Priority: P2)

**Goal**: Exclude systems beyond `--max-dist-sol`

**Independent Test**: Run with two distances and assert subset/superset ordering

### Tests

- [x] T019 [P] [US2] Unit tests for Sol distance filtering in tests/unit/distance.test.ts
- [x] T020 [US2] Integration test asserting max-distance filter in tests/integration/cli.golden.test.ts

### Implementation

- [x] T021 [US2] Apply Sol-distance filter before indexing in src/domain/settlement.ts
- [x] T022 [US2] Document default and validation for `--max-dist-sol` in src/cli/index.ts help text

**Checkpoint**: User Story 2 complete and independently testable

---

## Phase 5: User Story 3 - Score breakdown transparency (Priority: P3)

**Goal**: Output score breakdown alongside totals

**Independent Test**: Fixture with known bodies yields expected breakdown

### Tests

- [x] T023 [P] [US3] Unit tests for score breakdown format in tests/unit/scoring.test.ts
- [x] T024 [US3] Integration test validating breakdown in tests/integration/cli.golden.test.ts

### Implementation

- [x] T025 [US3] Include breakdown in output model in src/io/output.ts
- [x] T026 [US3] Ensure CLI uses breakdown for JSON and text formats in src/cli/index.ts

**Checkpoint**: User Story 3 complete and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T027 [P] Update quickstart and help examples for JSONL vs JSON array input
- [x] T028 [P] Validate error messages for missing/unreadable file, invalid JSON lines, missing Sol
- [x] T029 Run `bun test` and verify performance on sample dataset
- [x] T030 Document simple output format (system name, nearest populated system name, total score)
- [x] T031 Implement simple output format with nearest populated system name
- [x] T032 Add `--limit` parameter (default 20) to cap result count
- [x] T033 Add `--verbose` flag for progress dots and summary output
- [x] T034 Rename cube terminology to quadrant in docs
- [x] T035 Update simple format to markdown table with columns for name, nearest, distance to Sol, score, number of stars, number of bodies, number of stations
- [x] T036 Filter Fleet Carriers from station lists early
- [x] T037 [P] Add quadrant validation: reject invalid quadrant names with clear error messages
- [x] T038 [P] Document --use-quadrants flag in help text with examples (NW, NE, SW, SE, all)
- [x] T039 [P] Add quadrant examples to quickstart.md
- [x] T040 [P] Test quadrant filtering with multi-quadrant queries (e.g., "SW,SE" or "all")
- [x] T041 [P] Add gzip input support when filename ends with .gz
- [x] T042 [P] Add tests for gzip input handling (valid gzip JSONL and JSON array)
- [x] T043 [P] Document gzip input usage and error behavior in quickstart/help
- [x] T044 [P] Update verbose output to show live read stats (systems read, populated, quadrant-discarded, other filters) instead of dots
- [x] T045 [P] Add tests for verbose live stats output formatting
- [x] T046 [P] Format verbose live stats counts with thousands separators
- [x] T047 [P] Add tests for thousands separator formatting in verbose stats

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → User stories in priority order (P1 → P2 → P3) → Polish
- Tests must be written and fail before implementation for each user story
