---
title: "Plan: Scoring Strategies for Settlement Ranking"
status: "Complete"
created: "2026-01-29"
completed: "2026-01-29"
---

# Implementation Plan: Scoring Strategies (Feature 003)

## Overview

This document outlines the technical design and implementation strategy for pluggable scoring strategies in the settlement ranking CLI.

## Technical Context

**Language**: TypeScript 5.6 (Bun runtime)
**Framework**: Commander.js for CLI
**Architecture**: Domain-driven design (src/domain/, src/io/, src/utils/, src/cli/)

## System Design

### Architecture: Strategy Pattern

The system will use the Strategy pattern for scoring:

```typescript
// Type definitions in src/domain/types.ts

type ScoringStrategyName = "industrial" | "agriculture" | "tritium";

interface ScoringStrategy {
  name: ScoringStrategyName;
  shouldInclude: (system: StarSystem) => boolean;
  score: (system: StarSystem) => ScoreResult;
}

interface ScoreResult {
  total: number;
  breakdown: Record<string, ScoringBreakdown>;
}

interface ScoringBreakdown {
  count: number;
  points: number;
}
```

### Module Organization

1. **src/domain/scoring.ts** (extended):
   - `computeIndustrialScore(system)` - Extract current scoring algorithm to dedicated function
   - `computeAgricultureScore(system)` - Alias/wrapper to industrial for MVP
   - `computeTritiumScore(system)` - New tritium-based scoring
   - `computeScore(system, strategy)` - Route to appropriate scorer based on strategy name

2. **src/cli/index.ts** (modified):
   - Add `--scoring <strategy>` option (default: "industrial")
   - Validate strategy selection before processing
   - Apply early tritium filtering during read phase
   - Route to appropriate scoring function
   - Update verbose output to show strategy name

3. **src/domain/types.ts** (modified):
   - Add `ScoringStrategyName` type
   - Extend `ScoreResult` interface if needed

### Data Model: Icy Ring/Belt Detection

**Ring/Belt classification** (from Elite Dangerous data model):
- Rings/belts may be stored in `rings[]` or `belts[]` array attribute (attribute name varies)
- Each ring/belt has `ringClass` field: "Rocky", "Icy", "Metal-Rich", "Metallic", etc.
- Each ring/belt has `reserveLevel` field: "Pristine", "Major", "Common", "Low", "Depleted"
- **Case sensitivity**: ringClass matching should be case-insensitive ("Icy", "icy", "ICY" all match)

**Tritium scoring logic**:
```
For each system:
  icy_ring_count = 0
  pristine_icy_ring_count = 0
  
  For each planet:
    For each ring/belt in (planet.rings OR planet.belts):
      If ring.ringClass.toLowerCase() == "icy":
        If ring.reserveLevel == "Pristine":
          pristine_icy_ring_count += 1
        Else:
          icy_ring_count += 1
  
  If icy_ring_count + pristine_icy_ring_count == 0:
    // Filter out: do not include in results
  Else:
    score = (icy_ring_count * 5) + (pristine_icy_ring_count * 10)
```

### CLI Integration

**Current behavior** (before):
```
bun run src/cli/index.ts --input galaxy.json --format json
→ Uses industrial scoring (implicit)
```

**New behavior**:
```
bun run src/cli/index.ts --input galaxy.json --format json
→ Uses industrial scoring (explicit default)

bun run src/cli/index.ts --input galaxy.json --scoring agriculture --format json
→ Uses agriculture scoring

bun run src/cli/index.ts --input galaxy.json --scoring tritium --format json
→ Uses tritium scoring, filters to systems with ≥1 icy ring
```

### Filtering Strategy

- **Industrial & Agriculture**: No special filtering (all populated systems included)
- **Tritium**: Systems with 0 icy rings are filtered out **during the read phase** for memory efficiency
  - Approach: Apply quadrant-like filtering in JSONL/JSON readers before adding systems to memory
  - Rationale: Tritium systems with 0 icy rings will never appear in results, so early filtering reduces memory footprint
  - Implementation: Check icy ring count in normalizeSystem() or readSystems() function
  - **Visibility (User Decision Q3 - Option C)**: Filtering count shown only in verbose mode

### Verbose Output Extension

Normal format (quiet/default):
```
Summary: strategy=sphere, bounds=..., scoring=industrial, broken lines=0, ...
```

Verbose format (`--verbose` flag only):
```
Summary: strategy=sphere, bounds=..., scoring=tritium, filtered_no_ice=12345, broken lines=0, ...
```

**Decision**: For tritium strategy:
- Default: No filtering stats shown (clean output)
- With `--verbose`: Show `filtered_no_ice=N` count for awareness
- Rationale: Keeps default output clean while allowing inspection when needed

## Implementation Strategy

### Phase 1: Type Definitions & Refactoring
- [ ] Define `ScoringStrategyName` type in types.ts
- [ ] Update `ScoreResult` interface if needed
- [ ] Extract current `computeScore()` to `computeIndustrialScore()`
- [ ] Create scoring function signatures

### Phase 2: Scoring Implementation
- [ ] Implement `computeIndustrialScore()` - copy of current logic
- [ ] Implement `computeAgricultureScore()` - wrapper to industrial
- [ ] Implement `computeTritiumScore()` - icy ring counting logic
- [ ] Implement strategy router `computeScore(system, strategy)`
- [ ] Create filter function `shouldIncludeInTritium(system)`

### Phase 3: CLI Integration
- [ ] Add `--scoring` option to CLI
- [ ] Parse and validate strategy selection
- [ ] Route to appropriate scorer in main function
- [ ] Update candidate filtering logic to apply tritium filter
- [ ] Update verbose output to show strategy name and filtering stats

### Phase 4: Testing
- [ ] Unit tests for industrial score (verify backward compatibility)
- [ ] Unit tests for agriculture score (matches industrial)
- [ ] Unit tests for tritium score (icy ring counting)
- [ ] Unit tests for icy ring filtering
- [ ] Integration tests for CLI flag
- [ ] Integration tests for invalid strategy error

### Phase 5: Documentation
- [ ] Update CLI help text for `--scoring` option
- [ ] Add examples to quickstart.md
- [ ] Update tasks.md with completion status

### Phase 6: Output Format Enhancements
- [x] Add `icyRings` count to output candidate type
- [x] Calculate icy rings count for each system
- [x] Update simple format table to include "icy rings" column (before "stations")
- [x] Fix tritium score display in simple format (ensure actual scores shown)
- [x] Update integration tests for new output format

## File Dependencies

```
src/domain/types.ts
  ↓ (defines ScoringStrategyName)
src/domain/scoring.ts
  ↓ (implements scoring functions)
src/cli/index.ts
  ↓ (uses scoring functions)
tests/unit/scoring.test.ts
  ↓ (tests all strategies)
tests/integration/cli.golden.test.ts
  ↓ (tests CLI flag integration)
```

## Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Icy ring data format differs from assumption | Exploration task to validate data format early |
| Changing scoring breaks backward compatibility | Ensure industrial strategy produces identical results to current behavior |
| Performance impact of tritium filtering | Consider early filtering during read phase if needed |
| New filtering adds complexity to CLI | Keep filtering logic isolated; use simple helper functions |

## Success Criteria

1. ✅ All unit tests pass for all three strategies
2. ✅ Backward compatibility verified (industrial = current behavior)
3. ✅ Tritium strategy filters and scores correctly
4. ✅ CLI accepts `--scoring` flag and routes correctly
5. ✅ Invalid strategy names produce clear error messages
6. ✅ Integration tests verify end-to-end CLI behavior

## Timeline Estimate

- Phase 1: 1 task (type definitions)
- Phase 2: 6 tasks (scoring implementations)
- Phase 3: 5 tasks (CLI integration)
- Phase 4: 6 tasks (testing)
- Phase 5: 3 tasks (documentation)

**Total**: ~21 tasks, estimated 1-2 sprints

## Output Format Considerations

### Simple Format Table Columns
For tritium strategy, the simple format should display:
```
| name | nearest | score | stars | bodies | icy rings | stations |
```

**Key Requirements**:
1. "icy rings" column shows total count of icy rings/belts (regular + pristine)
2. "score" column shows actual tritium score (5 pts per regular, 10 pts per pristine)
3. Column order: icy rings before stations
4. Icy rings/belts count calculated from `system.bodies[].rings[]` or `system.bodies[].belts[]` where `ringClass.toLowerCase() === "icy"`

## Notes

- This design prioritizes clarity and extensibility over micro-optimizations
- Future enhancements can add new strategies without changing core architecture
- Tritium filtering can be optimized to early-phase if performance analysis shows need
- Consider adding `--scoring-preset` in future to combine scoring + default flags
- Output format should clearly show strategy-specific metrics (e.g., icy rings for tritium)
