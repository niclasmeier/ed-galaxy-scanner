---
title: "Plan: Sorting Strategies for Settlement Ranking Results"
status: "Draft"
created: "2026-01-29"
---

# Implementation Plan: Sorting Strategies (Feature 004)

## Overview

This document outlines the technical design and implementation strategy for flexible sorting strategies in the settlement ranking CLI.

## Technical Context

**Language**: TypeScript 5.6 (Bun runtime)
**Framework**: Commander.js for CLI
**Architecture**: Domain-driven design (src/domain/, src/io/, src/cli/)

## System Design

### Architecture: Strategy Pattern for Sorting

The system will use composable sort criteria:

```typescript
// Type definitions in src/domain/types.ts

type SortField = "score" | "dsol";
type SortDirection = "asc" | "desc";

interface SortCriterion {
  field: SortField;
  direction: SortDirection;
}

type SortSpec = SortCriterion[];

// Default sort specification
const DEFAULT_SORT_SPEC: SortSpec = [
  { field: "score", direction: "desc" },
  { field: "dsol", direction: "asc" }
];
```

### Module Organization

1. **src/domain/types.ts** (extended):
   - Add `SortField`, `SortDirection`, `SortCriterion`, `SortSpec` types

2. **src/domain/sorting.ts** (new):
   - `parseSortSpec(input: string): SortSpec` - Parse `--sort` flag value into structured spec
   - `validateSortSpec(spec: SortSpec): boolean` - Validate sort criteria and directions
   - `applySortSpec(candidates: SettlementCandidate[], spec: SortSpec): SettlementCandidate[]` - Apply sorting

3. **src/cli/index.ts** (modified):
   - Add `--sort <spec>` option with default value
   - Parse and validate sort specification
   - Pass sort spec to sorting function

### Parsing Logic

**Input format**: `criterion[-direction][,criterion[-direction]...]`

Examples:
- `score-desc` → `[{ field: "score", direction: "desc" }]`
- `dsol-asc` → `[{ field: "dsol", direction: "asc" }]`
- `score-desc,dsol-asc` → `[{ field: "score", direction: "desc" }, { field: "dsol", direction: "asc" }]`
- `score` → `[{ field: "score", direction: "desc" }]` (default direction)
- `dsol` → `[{ field: "dsol", direction: "asc" }]` (default direction)

**Default directions** (if no `-asc`/`-desc` suffix):
- `score`: defaults to `-desc`
- `dsol`: defaults to `-asc`

### Sorting Algorithm

```typescript
function applySortSpec(
  candidates: SettlementCandidate[],
  spec: SortSpec
): SettlementCandidate[] {
  return [...candidates].sort((a, b) => {
    for (const criterion of spec) {
      let comparison = 0;
      
      if (criterion.field === "score") {
        comparison = a.totalScore - b.totalScore;
      } else if (criterion.field === "dsol") {
        comparison = a.distanceToSol - b.distanceToSol;
      }
      
      // Apply direction (negate for descending)
      if (criterion.direction === "desc") {
        comparison = -comparison;
      }
      
      // If not equal, return result; otherwise continue to next criterion
      if (comparison !== 0) {
        return comparison;
      }
    }
    
    return 0; // All criteria equal
  });
}
```

### CLI Integration

**Current behavior** (implicit):
```
bun run src/cli/index.ts --input galaxy.json
→ Results sorted by score (desc), then by name (implicit)
```

**New behavior**:
```
bun run src/cli/index.ts --input galaxy.json
→ Results sorted by score (desc), then by distance to Sol (asc) [default]

bun run src/cli/index.ts --input galaxy.json --sort dsol-asc
→ Results sorted by distance to Sol (asc)

bun run src/cli/index.ts --input galaxy.json --sort score-desc,dsol-asc
→ Results sorted by score (desc), then by distance to Sol (asc)
```

## Implementation Strategy

### Phase 1: Type Definitions & Parsing
- [ ] Define `SortField`, `SortDirection`, `SortCriterion`, `SortSpec` types in types.ts
- [ ] Implement `parseSortSpec()` function in src/domain/sorting.ts
- [ ] Implement `validateSortSpec()` function

### Phase 2: Sorting Implementation
- [ ] Implement `applySortSpec()` function with multi-level sorting
- [ ] Refactor existing `sortCandidates()` function or create new sort module
- [ ] Handle edge cases (empty list, all equal, etc.)

### Phase 3: CLI Integration
- [ ] Add `--sort <spec>` option to CLI with default value
- [ ] Parse and validate sort specification from CLI
- [ ] Apply sort spec to candidates before output
- [ ] Update help text with examples

### Phase 4: Testing
- [ ] Unit tests for sort parsing (parseSortSpec)
- [ ] Unit tests for sort validation (validateSortSpec)
- [ ] Unit tests for sort application (applySortSpec) - single and multiple criteria
- [ ] Unit tests for edge cases and tie-breaking
- [ ] Integration tests for CLI flag
- [ ] Integration tests for invalid specifications

### Phase 5: Documentation
- [ ] Update CLI help text with `--sort` examples
- [ ] Add quickstart examples for common sort orders
- [ ] Document sort criteria and default behavior

## File Dependencies

```
src/domain/types.ts
  ↓ (defines sort types)
src/domain/sorting.ts (new)
  ↓ (implements sort functions)
src/cli/index.ts
  ↓ (uses sorting functions)
tests/unit/sorting.test.ts
  ↓ (tests all strategies)
tests/integration/cli.sort.test.ts
  ↓ (tests CLI flag integration)
```

## Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Sort spec parsing becomes complex | Keep parser simple, use regex or clear string splitting |
| Breaking change to current sorting | Default spec matches current behavior |
| Performance impact on large datasets | Sorting is O(n log n), acceptable for ranked results |
| Ambiguous sort spec format | Clear documentation and validation errors |

## Success Criteria

1. ✅ All unit tests pass for sort parsing, validation, and application
2. ✅ All integration tests pass for CLI flag and error handling
3. ✅ Default behavior (`score-desc,dsol-asc`) matches/improves current results
4. ✅ Multiple sort criteria work correctly with tie-breaking
5. ✅ Invalid specifications produce clear error messages
6. ✅ Help text documents all supported criteria and format

## Timeline Estimate

- Phase 1: 2 tasks (types + parsing/validation)
- Phase 2: 3 tasks (sorting implementation + refactoring)
- Phase 3: 3 tasks (CLI integration)
- Phase 4: 5 tasks (testing)
- Phase 5: 2 tasks (documentation)

**Total**: ~15 tasks, estimated 1 sprint

## Notes

- This feature uses the Strategy pattern for extensible sorting
- Future enhancements can add new sort criteria (`bodies`, `stations`, `icyRings`, `name`, etc.)
- Sorting is applied after all filtering and scoring, at output stage
- No changes to data model; uses existing fields only
