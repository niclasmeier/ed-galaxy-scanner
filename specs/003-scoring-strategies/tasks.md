---
description: "Task list for Scoring Strategies feature"
---

# Tasks: Scoring Strategies for Settlement Ranking

**Input**: Design documents from `/specs/003-scoring-strategies/`
**Prerequisites**: plan.md, spec.md

**Tests**: Unit tests for all three scoring strategies REQUIRED. Integration tests for CLI flag REQUIRED.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Type Definitions (Setup)

- [x] T001 [P] Define `ScoringStrategyName` type in src/domain/types.ts as union: "industrial" | "agriculture" | "tritium"
- [x] T002 [P] Verify `ScoreResult` interface exists and includes `total` and `breakdown` fields
- [x] T003 [P] Add type documentation comments explaining each strategy's purpose

---

## Phase 2: Scoring Implementations (Foundational)

- [x] T004 [P] Extract current `computeScore()` logic from src/domain/scoring.ts to `computeIndustrialScore()`
- [x] T005 [P] Implement `computeAgricultureScore()` as wrapper to industrial (identical logic for MVP)
- [x] T006 [P] Implement icy ring/belt detection helper `getIcyRingCount()` and `getPristineIcyRingCount()` functions (check both rings and belts arrays, case-insensitive ringClass match for "Icy")
- [x] T007 [P] Implement `computeTritiumScore()` that counts icy rings/belts (5 pts regular, 10 pts pristine; ringClass="Icy" case-insensitive, reserveLevel="Pristine" for pristine)
- [x] T008 [P] Implement `shouldIncludeInTritium()` filter function (excludes systems with 0 icy rings/belts)
- [x] T009 [P] Update/create `computeScore(system, strategy)` router function

**Checkpoint**: Scoring logic complete and unit-tested

---

## Phase 3: CLI Integration

- [x] T010 [P] Add `--scoring <strategy>` option to CLI in src/cli/index.ts with default "industrial"
- [x] T011 [P] Add help text for `--scoring` option listing valid values: "industrial", "agriculture", "tritium"
- [x] T012 [P] Parse `--scoring` value from options and validate against allowed strategies
- [x] T013 [P] Add validation to reject invalid strategy names with error: "Invalid scoring strategy: {value}. Must be one of: industrial, agriculture, tritium"
- [x] T014 [P] Route candidate scoring to appropriate function based on `--scoring` selection
- [x] T015 [P] Apply tritium filtering in main function (filter eligible candidates to exclude 0-icy-ring systems)
- [x] T016 [P] Update verbose output to include `scoring={strategy}` in summary line

**Checkpoint**: CLI fully integrated with strategy selection

---

## Phase 4: Testing (Unit)

- [x] T017 [P] Write unit test: industrial strategy produces same score as current behavior
- [x] T018 [P] Write unit test: agriculture strategy matches industrial strategy exactly
- [x] T019 [P] Write unit test: tritium strategy counts regular icy rings/belts correctly (5 pts each, ringClass="Icy" case-insensitive)
- [x] T020 [P] Write unit test: tritium strategy counts pristine icy rings/belts correctly (10 pts each, reserveLevel="Pristine")
- [x] T021 [P] Write unit test: tritium filter excludes systems with 0 icy rings/belts
- [x] T022 [P] Write unit test: edge case - null/undefined rings/belts array treated as 0
- [x] T023 [P] Write unit test: edge case - system with no planets handled correctly
- [x] T024 [P] Write unit test: edge case - mixed ring/belt types (both regular and pristine, both rings and belts arrays)

**Checkpoint**: All unit tests pass

---

## Phase 5: Testing (Integration)

- [x] T025 [P] Write integration test: CLI with `--scoring industrial` (default behavior)
- [x] T026 [P] Write integration test: CLI with `--scoring agriculture` matches industrial
- [x] T027 [P] Write integration test: CLI with `--scoring tritium` filters and scores correctly
- [x] T028 [P] Write integration test: CLI with invalid strategy rejects with clear error message
- [x] T029 [P] Write integration test: Verbose output shows selected scoring strategy
- [x] T030 [P] Write integration test: Default (no `--scoring` flag) uses industrial strategy

**Checkpoint**: All integration tests pass, golden tests still pass

---

## Phase 6: Polish & Documentation

- [x] T031 [P] Add quickstart examples for `--scoring` flag (industrial, agriculture, tritium)
- [x] T032 [P] Document icy ring/belt data model assumptions in plan.md (rings vs belts attribute, case-insensitive matching, reserveLevel for pristine)
- [x] T033 [P] Update CLI help text with `--scoring` examples
- [x] T034 Update research.md with findings about icy ring/belt data format (rings vs belts attribute, case-insensitive ringClass, Pristine reserveLevel)
- [x] T035 Add note to spec.md: "All tests passing, feature ready for production"

**Checkpoint**: Documentation complete, feature ready for release

---

## Phase 7: Output Format Enhancements

- [x] T036 [P] Add `icyRings` field to SettlementCandidate output type
- [x] T037 [P] Calculate total icy rings/belts count for each system in candidate mapping (check both rings and belts arrays, case-insensitive "Icy" match)
- [x] T038 [P] Update simple format table to include "icy rings" column before "stations"
- [x] T039 [P] Ensure tritium scores display correctly in simple format (not hardcoded to 0)
- [x] T040 [P] Update integration tests to verify icy rings column in output
- [x] T041 [P] Update spec.md acceptance criteria to reflect output format changes

**Checkpoint**: Output format correctly displays icy rings and scores

---

## Verification Checklist

Before marking feature complete, verify:

- [x] All 35 tasks completed (all core + testing/documentation)
- [x] Phase 7 tasks (T036-T041) for output format enhancements
- [x] All unit tests pass (23 tests for scoring strategies)
- [x] All integration tests pass (9 tests for CLI integration)
- [x] Backward compatibility verified (industrial = current behavior)
- [x] Tritium filtering verified (systems with 0 ice excluded)
- [x] Error handling verified (invalid strategy rejected)
- [x] Help text documents all options and defaults
- [x] Quickstart.md has working examples
- [x] Simple output format displays icy rings column
- [x] Tritium scores display correctly (not 0)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
- Cannot start Phase 3 until Phase 2 complete (need scoring functions)
- Cannot start Phase 4 until Phase 2 complete (need implementation to test)
- Cannot start Phase 5 until Phase 3 complete (need CLI integration)
- Tests must pass before proceeding to documentation

---

## Notes

- Scoring logic and CLI integration are independent after Phase 2; can parallelize Phases 3-4 if needed
- Icy ring/belt data format should be validated early (recommend exploration task before T006)
- Data model notes: rings may be stored as "rings" or "belts" attribute; ringClass="Icy" (case-insensitive); reserveLevel="Pristine" for pristine
- Consider future enhancements documented in spec.md (science, combat, tourism strategies)
- After this feature, scoring strategies can be extended without modifying core CLI logic
