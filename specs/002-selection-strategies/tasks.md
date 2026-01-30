---

description: "Task list for Space Selection Strategies"
---

# Tasks: Space Selection Strategies

**Input**: Design documents from `/specs/002-selection-strategies/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the spec; add only if needed during implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Add CLI options for `--selection-strategy`, `--cube-from`, and `--cube-to` in src/cli/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T002 [P] Add `SpaceSelectionStrategy` and `SelectionBounds` types in src/domain/types.ts
- [ ] T002a [P] Define Sol and Colonia coordinate constants in src/domain/selection.ts
- [x] T003 [P] Implement endpoint name normalization and index builder in src/domain/selection.ts
- [ ] T003a [P] Implement coordinate string parser for "x/y/z" format in src/domain/selection.ts
- [x] T004 Implement cube bounds calculation utilities in src/domain/selection.ts
- [x] T005 Implement strategy selection pipeline (sphere vs cube, ignore `--max-dist-sol` for cube) in src/domain/selection.ts
- [x] T006 Wire selection strategy filtering into read flow and track skipped missing-coordinates count in src/cli/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Select systems by cube bounds (Priority: P1) 🎯 MVP

**Goal**: Allow cube-based selection using two endpoint system names.

**Independent Test**: Run the CLI with `--selection-strategy cube --cube-from <name> --cube-to <name>` and verify only systems within bounds are eligible.

### Implementation for User Story 1

- [x] T007 [US1] Resolve cube endpoints case-insensitively and return errors on missing/ambiguous matches in src/domain/selection.ts
- [x] T008 [US1] Enforce non-zero exit with clear stderr error on endpoint resolution failure in src/cli/index.ts
- [x] T009 [US1] Apply cube bounds filtering to the selection pipeline output in src/domain/selection.ts
- [x] T010 [US1] Emit skipped missing-coordinate count in verbose summary output in src/cli/index.ts
- [ ] T010b [US1] Emit selected strategy type and selection bounds in verbose summary output in src/cli/index.ts

**Checkpoint**: User Story 1 should be functional and testable independently

---

## Phase 3b: User Story 3 - Select systems by area bounds (Priority: P2)

**Goal**: Allow area-based selection (2D rectangular on X-Y plane) using two endpoint system names.

**Independent Test**: Run the CLI with `--selection-strategy area --area-from <name> --area-to <name>` and verify only systems within the X-Y area bounds (ignoring Z) are eligible.

### Implementation for User Story 3

- [ ] T010c [US3] Resolve area endpoints (names or coordinates) case-insensitively and return errors on missing/ambiguous matches in src/domain/selection.ts
- [ ] T010ca [US3] Update endpoint resolution to parse "x/y/z" coordinate format and use directly without lookup
- [ ] T010d [US3] Implement area bounds filtering (X-Y only, no Z coordinate) in src/domain/selection.ts
- [ ] T010e [US3] Add `--selection-strategy area` option and `--area-from`, `--area-to` CLI options in src/cli/index.ts
- [ ] T010f [US3] Emit area selection bounds in verbose summary output in src/cli/index.ts

**Checkpoint**: User Story 3 should be functional and testable independently

---

## Phase 4: User Story 2 - Use default endpoints (Priority: P2)

**Goal**: Default cube and area endpoints to Sol/Colonia constants when omitted; infer cube/area strategy if their endpoints are provided; support coordinate format.

**Independent Test**: Run the CLI with `--selection-strategy cube` and verify defaults to Sol/Colonia; run with `--area-from "0/0/0"` and verify area strategy is inferred.

### Implementation for User Story 2

- [x] T011 [US2] Default `--cube-to` to Sol and infer cube strategy when `--cube-from`/`--cube-to` is provided in src/cli/index.ts
- [ ] T011a [US2] Default `--cube-from` to Sol constant and `--cube-to` to Colonia constant; use coordinates directly without system lookup in src/cli/index.ts
- [ ] T011b [US2] Default `--area-from` to Sol constant and `--area-to` to Colonia constant; use coordinates directly without system lookup in src/cli/index.ts
- [ ] T011c [US2] Infer area strategy when `--area-from`/`--area-to` is provided in src/cli/index.ts
- [x] T012 [US2] Update CLI help text to reflect cube defaults and inference in src/cli/index.ts
- [ ] T012a [US2] Update CLI help text to reflect area defaults and inference, and coordinate format in src/cli/index.ts

**Checkpoint**: User Story 2 should be functional and testable independently

---

## Phase 5: User Story 4 - Keep existing sphere selection (Priority: P3)

**Goal**: Preserve default spherical selection around Sol.

**Independent Test**: Run the CLI without specifying a strategy and confirm results match the current behavior.

### Implementation for User Story 4

- [x] T013 [US4] Ensure default strategy remains spherical and uses `--max-dist-sol` in src/domain/selection.ts

**Checkpoint**: User Story 4 should be functional and testable independently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T014 [P] Align quickstart examples with final CLI flags in specs/002-selection-strategies/quickstart.md
- [x] T015 [P] Align JSON schema contract with final CLI flag names in specs/002-selection-strategies/contracts/space-selection.schema.json
- [x] T016 Update plan references if file paths or option names changed in specs/002-selection-strategies/plan.md
- [ ] T010b [US1] Emit selected strategy type and selection bounds in verbose summary output in src/cli/index.ts
- [ ] T017 [P] Update all specification and documentation to note verbose output includes strategy and bounds
- [ ] T018 [P] Add area strategy examples to quickstart.md
- [ ] T019 [P] Update JSON schema contract to include area strategy options
- [ ] T020 [P] Document coordinate format ("x/y/z") in quickstart.md with examples
- [ ] T021 [P] Update contracts to show coordinate format alternative for endpoints

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only
- **User Story 2 (P2)**: Depends on Phase 2; no dependency on US1
- **User Story 3 (P2)**: Depends on Phase 2; no dependency on US1/US2
- **User Story 4 (P3)**: Depends on Phase 2; no dependency on US1/US2/US3

### Parallel Opportunities

- T002 and T003 can run in parallel
- T014 and T015 can run in parallel

---

## Parallel Example: User Story 1

- T007 [US1] Resolve cube endpoints case-insensitively and return errors on missing/ambiguous matches in src/domain/selection.ts
- T010 [US1] Emit skipped missing-coordinate count in verbose summary output in src/cli/index.ts

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate independently
3. Add User Story 2 → Validate independently
4. Add User Story 3 → Validate independently
5. Finish Polish tasks
