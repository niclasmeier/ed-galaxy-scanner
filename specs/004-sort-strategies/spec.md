---
title: "Sorting Strategies for Settlement Ranking Results"
status: "Draft"
created: "2026-01-29"
---

# Feature 004: Sorting Strategies for Settlement Ranking Results

## Overview

Enable users to sort settlement candidates by multiple criteria with custom ordering. Currently, results are sorted by total score (descending) and then by system name (ascending). This feature adds pluggable sorting strategies that allow flexible, multi-level sorting by score, distance to Sol, or other metrics.

## Context

The current settlement ranking system always sorts by:
1. Total score (descending)
2. System name (ascending) - implicit tie-breaker

Some users may want to prioritize different criteria:
- **Distance**: Prefer systems closer to Sol (ascending)
- **Score**: Prefer higher scores (descending)
- **Multiple criteria**: Apply multiple sort rules in sequence (e.g., score desc, then distance asc for ties)

## User Scenarios & Testing

### Scenario 1: Default Sorting Behavior (Priority: P1)
As a user, I want results sorted by score descending then distance to Sol ascending by default, so I get the highest-scoring systems closest to Sol without specifying flags.

**Acceptance Scenarios**:
1. **Given** no `--sort` flag is provided, **When** I run the tool, **Then** results are ordered by score (descending), then by distance to Sol (ascending)
2. **Given** the default behavior, **When** two systems have identical scores, **Then** the closer system to Sol appears first

### Scenario 2: Custom Sort by Distance (Priority: P2)
As a user, I want to sort results primarily by distance to Sol, so I can prioritize proximity regardless of score.

**Acceptance Scenarios**:
1. **Given** I run with `--sort dsol-asc`, **When** results are returned, **Then** they are ordered by distance to Sol (ascending)
2. **Given** the dsol-asc sort, **When** two systems have the same distance, **Then** they maintain insertion order or use default tie-breaker

### Scenario 3: Multiple Sort Criteria (Priority: P2)
As a user, I want to sort by multiple criteria in sequence, so I can define complex ranking rules (e.g., score first, then distance as tie-breaker).

**Acceptance Scenarios**:
1. **Given** I run with `--sort score-desc,dsol-asc`, **When** results are returned, **Then** they are ordered first by score (descending), then by distance to Sol (ascending) for equal scores
2. **Given** multiple sort criteria, **When** one criterion produces ties, **Then** the next criterion in the list breaks the tie

### Scenario 4: Sort Direction Control (Priority: P2)
As a user, I want to control sort direction (ascending/descending) for each criterion, so I can customize ranking order precisely.

**Acceptance Scenarios**:
1. **Given** I run with `--sort score-asc`, **When** results are returned, **Then** they are ordered by score (ascending, lowest scores first)
2. **Given** I run with `--sort dsol-desc`, **When** results are returned, **Then** they are ordered by distance to Sol (descending, farthest first)

## Functional Requirements

### FR-001: Sort Flag Introduction
The system SHALL accept a `--sort` command-line flag to control result ordering.

### FR-002: Sort Criteria
The system SHALL support the following sort criteria:
- **FR-002a**: `score` - Sort by total settlement score
- **FR-002b**: `dsol` - Sort by distance to Sol (calculated distance, not max-dist-sol parameter)

### FR-003: Sort Direction
The system SHALL support sort direction specification:
- **FR-003a**: `-asc` suffix indicates ascending order (e.g., `score-asc`)
- **FR-003b**: `-desc` suffix indicates descending order (e.g., `score-desc`)
- **FR-003c**: Default direction for `score` is descending (highest scores first)
- **FR-003d**: Default direction for `dsol` is ascending (closest to Sol first)

### FR-004: Multiple Sort Criteria
The system SHALL support comma-separated list of sort criteria (e.g., `score-desc,dsol-asc`).

### FR-005: Tie-Breaking
When two results have equal values for the current sort criterion, the system SHALL apply the next sort criterion in the list.

### FR-006: Default Sorting
The system SHALL default to `score-desc,dsol-asc` when no `--sort` flag is provided (or flag is empty).

### FR-007: Sort Validation
The system SHALL validate sort criteria:
- **FR-007a**: Invalid sort criterion names are rejected with clear error
- **FR-007b**: Invalid sort directions (not `-asc` or `-desc`) are rejected with clear error
- **FR-007c**: Error message lists valid criteria and format

### FR-008: Stable Sorting
The system SHALL apply sort criteria in order with stable sorting, where equal values at one level are broken by the next criterion.

## Acceptance Criteria

### Default Behavior
- [x] Running without `--sort` uses `score-desc,dsol-asc` ordering
- [x] Results are ordered first by score (highest first)
- [x] Results with equal score are ordered by distance to Sol (closest first)

### Single Criterion Sorting
- [ ] `--sort score-asc` orders by score ascending (lowest first)
- [ ] `--sort score-desc` orders by score descending (highest first)
- [ ] `--sort dsol-asc` orders by distance ascending (closest first)
- [ ] `--sort dsol-desc` orders by distance descending (farthest first)

### Multiple Criteria Sorting
- [ ] `--sort score-desc,dsol-asc` orders by score desc, then distance asc
- [ ] `--sort dsol-asc,score-desc` orders by distance asc, then score desc
- [ ] Multiple criteria produce correct tie-breaking results

### Validation & Errors
- [ ] Invalid sort criterion (e.g., `--sort invalid`) produces error with valid options listed
- [ ] Invalid direction (e.g., `--sort score-invalid`) produces error with valid directions listed
- [ ] Malformed flag (e.g., `--sort score,desc`) produces clear error message

## Edge Cases

1. **Single system**: Sort order is irrelevant; system is returned as-is
2. **Empty result set**: No sorting needed; empty output returned
3. **All systems have equal score**: Sorting falls through to next criterion (dsol)
4. **All systems have equal dsol**: If dsol is last criterion, original insertion order is preserved
5. **Whitespace in sort flag**: `score-desc , dsol-asc` with spaces should be handled gracefully
6. **Case sensitivity**: Sort criteria should be case-insensitive: `Score-DESC` = `score-desc`

## Key Entities

### SortDirection
```typescript
type SortDirection = "asc" | "desc";

interface SortCriterion {
  field: "score" | "dsol";
  direction: SortDirection;
}

type SortSpec = SortCriterion[];
```

### Defaults
```
Default: [
  { field: "score", direction: "desc" },
  { field: "dsol", direction: "asc" }
]
```

## Dependencies

- Existing `SettlementCandidate` type with `totalScore` and `distanceToSol` fields
- CLI infrastructure (Commander.js) for flag parsing
- `sortCandidates()` function in src/domain/settlement.ts (to be refactored)

## Assumptions

1. Distance to Sol is already calculated in `SettlementCandidate.distanceToSol`
2. Score values are numeric and comparable
3. System name (implicit tie-breaker) is no longer needed (removed in favor of explicit criteria list)

## Testing Strategy

### Unit Tests
- **src/domain/sorting.test.ts** (new):
  - Test parsing sort specification strings: `"score-desc"`, `"dsol-asc,score-desc"`, etc.
  - Test validation of sort criteria and directions
  - Test sorting with single criterion
  - Test sorting with multiple criteria (tie-breaking)
  - Test edge cases (empty list, duplicate criteria, etc.)
  - Test default sort spec generation

### Integration Tests
- **tests/integration/cli.sort.test.ts** (new):
  - Test CLI with `--sort score-asc`
  - Test CLI with `--sort dsol-asc`
  - Test CLI with `--sort score-desc,dsol-asc` (multiple criteria)
  - Test CLI with invalid sort criterion (error case)
  - Test CLI with invalid sort direction (error case)
  - Test default behavior (no `--sort` flag)
  - Test case-insensitive sort criteria

### Fixtures
- Use existing galaxy fixtures with varied scores and distances

## Success Criteria

1. ✅ All unit tests pass (sorting logic, validation, parsing)
2. ✅ All integration tests pass (CLI flag integration)
3. ✅ Default sort order (`score-desc,dsol-asc`) matches previous behavior for most cases
4. ✅ Multiple criteria sorting works correctly with tie-breaking
5. ✅ Invalid sort specifications produce clear error messages
6. ✅ Help text documents `--sort` flag with examples

## Open Questions

- Q: Should system name still be used as implicit final tie-breaker?
  - A: No, explicit sort criteria will handle all tie-breaking

- Q: Should we support sorting by system name explicitly in future?
  - A: Possible future enhancement, not in MVP

- Q: Are there other useful sort criteria (e.g., body count, station count)?
  - A: Yes, future enhancements can add `bodies`, `stations`, `icyRings` criteria

## Notes

This feature enables flexible result ordering while maintaining backward compatibility (default order matches current behavior). The architecture supports easy addition of new sort criteria in the future.
