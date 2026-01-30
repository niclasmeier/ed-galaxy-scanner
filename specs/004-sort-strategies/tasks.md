---
description: "Task list for Sorting Strategies feature"
---

# Tasks: Sorting Strategies for Settlement Ranking Results

**Input**: Design documents from `/specs/004-sort-strategies/`
**Prerequisites**: plan.md, spec.md

**Tests**: Unit tests for parsing, validation, and sorting. Integration tests for CLI flag REQUIRED.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Type Definitions & Parsing

- [x] T001 [P] Define `SortField` type as union: "score" | "dsol" in src/domain/types.ts
- [x] T002 [P] Define `SortDirection` type as union: "asc" | "desc" in src/domain/types.ts
- [x] T003 [P] Define `SortCriterion` interface with `field` and `direction` properties
- [x] T004 [P] Define `SortSpec` type as `SortCriterion[]` array
- [x] T005 [P] Implement `parseSortSpec(input: string): SortSpec` parser function in src/domain/sorting.ts
  - Parse format: `score-desc`, `dsol-asc`, `score-desc,dsol-asc`, etc.
  - Handle default directions: score→desc, dsol→asc
  - Handle whitespace trimming
  - Case-insensitive field names
- [x] T006 [P] Implement `validateSortSpec(spec: SortSpec): void` validation function
  - Throw error for invalid field names
  - Throw error for invalid direction values
  - Provide helpful error messages with valid options

**Checkpoint**: Sort spec types and parsing complete and unit-tested

---

## Phase 2: Sorting Implementation

- [x] T007 [P] Implement `applySortSpec(candidates: SettlementCandidate[], spec: SortSpec): SettlementCandidate[]` function
  - Sort by first criterion
  - Use next criterion as tie-breaker
  - Handle all criteria in sequence
  - Preserve original order for complete ties
- [x] T008 [P] Define DEFAULT_SORT_SPEC constant: `[{ field: "score", direction: "desc" }, { field: "dsol", direction: "asc" }]`
- [x] T009 [P] Refactor current `sortCandidates()` function or integrate with new sort spec logic
  - Consider keeping old function for backward compatibility or replacing entirely

**Checkpoint**: Sorting logic complete and unit-tested

---

## Phase 3: CLI Integration

- [x] T010 [P] Add `--sort <spec>` option to CLI in src/cli/index.ts with default "score-desc,dsol-asc"
- [x] T011 [P] Add help text for `--sort` option with examples:
  - Example 1: `--sort score-desc` (default score ordering)
  - Example 2: `--sort dsol-asc` (closest to Sol first)
  - Example 3: `--sort score-desc,dsol-asc` (score first, distance tie-breaker)
- [x] T012 [P] Parse and validate `--sort` value from CLI options
  - Call `parseSortSpec()` on input
  - Call `validateSortSpec()` to verify
  - Exit with clear error if validation fails
- [x] T013 [P] Apply sort spec to candidates before output
  - Call `applySortSpec(candidates, sortSpec)` instead of current `sortCandidates()`

**Checkpoint**: CLI fully integrated with sort spec selection

---

## Phase 4: Testing (Unit)

- [x] T014 [P] Write unit test: `parseSortSpec("score-desc")` produces correct structure
- [x] T015 [P] Write unit test: `parseSortSpec("dsol-asc,score-desc")` with multiple criteria
- [x] T016 [P] Write unit test: `parseSortSpec("score")` with default direction (desc)
- [x] T017 [P] Write unit test: `parseSortSpec("dsol")` with default direction (asc)
- [x] T018 [P] Write unit test: `parseSortSpec` handles whitespace in comma-separated list
- [x] T019 [P] Write unit test: `parseSortSpec` is case-insensitive for field names
- [x] T020 [P] Write unit test: `validateSortSpec` rejects invalid field names with error
- [x] T021 [P] Write unit test: `validateSortSpec` rejects invalid directions with error
- [x] T022 [P] Write unit test: `applySortSpec` sorts by score descending correctly
- [x] T023 [P] Write unit test: `applySortSpec` sorts by dsol ascending correctly
- [x] T024 [P] Write unit test: `applySortSpec` with multiple criteria uses first as primary, second as tie-breaker
- [x] T025 [P] Write unit test: `applySortSpec` with equal values at all levels preserves original order
- [x] T026 [P] Write unit test: edge case - empty candidate list
- [x] T027 [P] Write unit test: edge case - single candidate

**Checkpoint**: All unit tests pass

---

## Phase 5: Testing (Integration)

- [x] T028 [P] Write integration test: CLI with `--sort score-desc` (default behavior)
- [x] T029 [P] Write integration test: CLI with `--sort score-asc` (ascending score)
- [x] T030 [P] Write integration test: CLI with `--sort dsol-asc` (distance ascending)
- [x] T031 [P] Write integration test: CLI with `--sort dsol-desc` (distance descending)
- [x] T032 [P] Write integration test: CLI with `--sort score-desc,dsol-asc` (multiple criteria)
- [x] T033 [P] Write integration test: CLI without `--sort` uses default
- [x] T034 [P] Write integration test: CLI with invalid field name produces error with valid options
- [x] T035 [P] Write integration test: CLI with invalid direction produces error with valid directions
- [x] T036 [P] Write integration test: CLI with malformed sort spec (e.g., no field name) produces error
- [x] T037 [P] Write integration test: Verify golden output matches with default sort spec

**Checkpoint**: All integration tests pass, golden tests still pass

---

## Phase 6: Documentation & Polish

- [ ] T038 [P] Update CLI help text with `--sort` examples and valid criteria
- [ ] T039 [P] Add quickstart examples for common sort orders
- [ ] T040 [P] Update data model documentation if needed (reference SettlementCandidate fields used)

**Checkpoint**: Documentation complete, feature ready for release

---

## Verification Checklist

Before marking feature complete, verify:

- [ ] All 40 tasks completed (types, parsing, sorting, testing, documentation)
- [ ] All unit tests pass (parsing, validation, sorting)
- [ ] All integration tests pass (CLI flag, error handling)
- [ ] Default sort spec matches/improves current behavior
- [ ] Multiple sort criteria work correctly with tie-breaking
- [ ] Invalid specifications produce clear errors
- [ ] Help text documents all supported criteria and format
- [ ] Golden tests still pass with default sort order

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
- Cannot start Phase 2 until Phase 1 complete (need types and parser)
- Cannot start Phase 3 until Phase 2 complete (need sort implementation)
- Cannot start Phase 4 until Phase 2 complete (need sorting logic to test)
- Cannot start Phase 5 until Phase 3 complete (need CLI integration)
- Tests must pass before proceeding to documentation

---

## Notes

- Sort spec parsing should be simple and flexible (handle edge cases gracefully)
- Default directions make common cases easier: `--sort score` instead of `--sort score-desc`
- Multiple sort criteria provide powerful tie-breaking without explicit system name handling
- Future enhancements can add new sort criteria (`bodies`, `stations`, `icyRings`, `name`, etc.)
- Sorting is O(n log n) performance, acceptable for typical result sizes (10-1000 candidates)
