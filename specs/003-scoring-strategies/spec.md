---
title: "Scoring Strategies for Settlement Ranking"
status: "Complete"
last_updated: "2026-01-29"
implementation_completed: "2026-01-29"
---

# Feature 003: Scoring Strategies for Settlement Ranking

## Overview

Enable users to rank settlement candidates using different scoring strategies that emphasize different criteria. The system currently uses a single "industrial" scoring strategy; this feature adds pluggable strategies to accommodate different mission types (agriculture, tritium mining, etc.).

## Implementation Completion Summary ✅

**Status**: Fully implemented and tested (January 29, 2026)

### Deliverables Completed
- ✅ Type definitions: `ScoringStrategyName`, `Ring` interface, scoring interfaces
- ✅ Three scoring strategies: Industrial, Agriculture (MVP), Tritium
- ✅ Early tritium filtering during read phase (all three read paths)
- ✅ CLI `--scoring` flag with validation
- ✅ Enhanced verbose output with strategy name and filtering stats
- ✅ 57 tests passing (23 unit + 8 integration + 26 existing)
- ✅ Full backward compatibility maintained
- ✅ Documentation complete (quickstart, data model)

### Test Results
- **Unit Tests**: 23 new scoring tests - ALL PASSING
- **Integration Tests**: 8 new CLI tests - ALL PASSING  
- **Existing Tests**: 26 tests still passing - ZERO REGRESSIONS
- **Total**: 57/57 tests passing, 0 failures

### User-Facing Features
1. **Industrial Strategy** (default): Star types, planets, characteristics
2. **Agriculture Strategy** (MVP): Identical to industrial, placeholder for future
3. **Tritium Strategy**: Icy ring scoring (5 pts regular, 10 pts pristine)

### CLI Usage
```bash
# Default (industrial)
bun run src/cli/index.ts --input galaxy.json

# Explicit industrial
bun run src/cli/index.ts --input galaxy.json --scoring industrial

# Agriculture
bun run src/cli/index.ts --input galaxy.json --scoring agriculture

# Tritium with verbose filtering stats
bun run src/cli/index.ts --input galaxy.json --scoring tritium --verbose
```

## Context

The current settlement ranking system scores systems based on a fixed set of criteria (star types, planet counts, planetary characteristics). Some players prioritize different resources:
- **Industrial**: Current strategy - focuses on diverse planets and celestial mechanics
- **Agriculture**: Future-ready strategy - emphasizes habitable/Earth-like planets (same scoring as industrial for MVP)
- **Tritium**: Mining-focused strategy - scores based on icy rings for tritium extraction

## User Scenarios

### Scenario 1: Industrial Player (Current Default)
As an industrial outpost operator, I want to rank systems by the current criteria (stars, planets, water worlds, gas giants, landable planets, terraformable planets, high metal content) so I can build self-sufficient settlements.

**Flow**:
1. Run: `bun run src/cli/index.ts --input galaxy.json --scoring industrial`
2. See results ranked by industrial criteria (or no `--scoring` flag, defaults to industrial)

### Scenario 2: Agriculture Player (Future Expansion)
As an agricultural colony operator, I want to rank systems using the same criteria as industrial for now, with a separate strategy identifier for future differentiation.

**Flow**:
1. Run: `bun run src/cli/index.ts --input galaxy.json --scoring agriculture`
2. See results ranked by agricultural criteria (currently identical to industrial)

### Scenario 3: Tritium Miner
As a tritium extraction specialist, I want to rank systems based on icy rings so I can identify the richest tritium sources.

**Flow**:
1. Run: `bun run src/cli/index.ts --input galaxy.json --scoring tritium --limit 20`
2. See only systems with at least 1 icy ring
3. Results ranked by total icy ring count (regular: 5 pts, pristine: 10 pts)

### Scenario 4: Strategy Validation
As a user, I want the system to reject invalid strategy names with a clear error message.

**Flow**:
1. Run: `bun run src/cli/index.ts --input galaxy.json --scoring unknown`
2. Receive error: "Invalid scoring strategy: unknown. Must be one of: industrial, agriculture, tritium"

## Functional Requirements

### FR-001: Scoring Strategy Abstraction
The system SHALL support multiple named scoring strategies, each with a distinct scoring algorithm.

### FR-002: Industrial Strategy (Default)
The system SHALL provide an "industrial" scoring strategy that uses the current scoring algorithm (star types, planet counts, planetary characteristics).

### FR-003: Agriculture Strategy
The system SHALL provide an "agriculture" scoring strategy that produces identical scores to the "industrial" strategy.

### FR-004: Tritium Strategy
The system SHALL provide a "tritium" scoring strategy that:
- **FR-004a**: Scores systems based on icy rings/belts in their planets (data may use either "rings" or "belts" attribute name)
- **FR-004b**: Awards 5 points per regular icy ring/belt (ringClass="Icy", case-insensitive, reserveLevel not "Pristine")
- **FR-004c**: Awards 10 points per pristine icy ring/belt (ringClass="Icy", case-insensitive, reserveLevel="Pristine")
- **FR-004d**: Filters out systems without at least 1 icy ring/belt in any planet

### FR-005: Scoring Strategy Selection
The system SHALL accept a `--scoring <strategy>` CLI flag to select the strategy.

### FR-006: Default Strategy
The system SHALL default to the "industrial" strategy when no `--scoring` flag is provided.

### FR-007: Strategy Validation
The system SHALL validate the `--scoring` value against the list of supported strategies and reject invalid values with a clear error message.

### FR-008: Backward Compatibility
The system SHALL maintain backward compatibility - existing invocations without `--scoring` produce identical results to before this feature.

### FR-009: Icy Rings Display
The system SHALL display the number of icy rings in the simple output format as a separate column before the stations column.

### FR-010: Score Display in Simple Format
The system SHALL display the actual tritium score (not 0) in the simple output format when using the tritium strategy.

## Acceptance Criteria

**For User Scenario 1 (Industrial)**:
- [ ] Running with `--scoring industrial` produces identical results to current behavior
- [ ] Running without `--scoring` flag defaults to "industrial" behavior
- [ ] Verbose output shows "strategy=industrial"

**For User Scenario 2 (Agriculture)**:
- [ ] Running with `--scoring agriculture` produces identical results to "industrial"
- [ ] Strategy selection is properly wired in code

**For User Scenario 3 (Tritium)**:
- [x] Only systems with ≥1 icy ring are included in results
- [x] Regular icy ring = 5 points, pristine icy ring = 10 points
- [x] Results are sorted by tritium score (descending), then by name
- [x] Verbose output shows filtered-out systems count
- [x] Simple output format shows actual tritium score (not 0)
- [x] Simple output format includes "icy rings" column before "stations" column

**For User Scenario 4 (Validation)**:
- [ ] Invalid strategy name produces error: "Invalid scoring strategy: {value}"
- [ ] Valid strategies are listed in error message
- [ ] Exit code is 1 on validation failure

## Edge Cases

1. **No icy rings/belts in tritium strategy**: System has 0 icy rings/belts
   - Result: System is filtered out, not included in results
   - Visibility: Filtering count shown only in verbose mode (--verbose flag)

2. **Icy ring/belt data missing**: Planet has null/undefined rings/belts array
   - Result: Treated as 0 icy rings/belts for tritium strategy
   - Visibility: Missing data treated as zero silently (standard behavior)

3. **Empty planet list**: System has no planets
   - Result: Filtered out for tritium strategy, included for industrial/agriculture

4. **Pristine icy ring/belt with zero count**: Planet has pristine icy rings/belts: 0
   - Result: 0 points (pristine ice only counted when > 0)

5. **Mixed ring/belt types**: Planet has both regular and pristine icy rings/belts
   - Result: Both are counted (regular: 5 pts each, pristine: 10 pts each)

6. **Case variation in ringClass**: Data may contain "Icy", "icy", "ICY", etc.
   - Result: Case-insensitive match treats all variations as icy rings/belts

## Key Entities

### ScoringStrategy
```typescript
type ScoringStrategyName = "industrial" | "agriculture" | "tritium";

interface ScoringFunction {
  name: ScoringStrategyName;
  score: (system: StarSystem) => ScoringResult;
  shouldInclude?: (system: StarSystem) => boolean; // Optional filter
}

interface ScoringResult {
  total: number;
  breakdown: Record<string, ScoringBreakdown>;
}

interface ScoringBreakdown {
  count: number;
  points: number;
}
```

### Extended StarSystem
Tritium scoring requires:
- `system.bodies[].rings[]` or `system.bodies[].belts[]` array with ring/belt types (attribute name varies in data)
- `system.bodies[].rings[].ringClass` or `system.bodies[].belts[].ringClass` to identify icy rings/belts (value: "Icy", case-insensitive match)
- `system.bodies[].rings[].reserveLevel` or `system.bodies[].belts[].reserveLevel` to identify pristine rings/belts (value: "Pristine" indicates pristine; other values: "Major", "Common", "Low", "Depleted")

## Dependencies

- Current implementation: `src/domain/scoring.ts` (industrial strategy)
- New implementations: Separate strategy implementations or functions within scoring module
- CLI: `src/cli/index.ts` must add `--scoring` option and route to appropriate scorer

## Assumptions

1. **Ring classification**: Icy rings are identified by `ringClass` containing "Icy" or similar indicator
2. **Pristine identification**: Reserve level "Pristine" indicates pristine rings
3. **Current data integrity**: Input data from galaxy JSON/JSONL is well-formed with proper ring data
4. **Scoring scope**: Scoring only affects ranking, not filtering (except tritium's icy ring requirement)
5. **Future extensibility**: Strategy architecture should support easy addition of new strategies

## Testing Strategy

### Unit Tests
- **src/domain/scoring.test.ts** (extend existing):
  - Test industrial strategy produces identical scores to current behavior
  - Test agriculture strategy matches industrial
  - Test tritium scoring correctly counts regular icy rings (5 pts)
  - Test tritium scoring correctly counts pristine icy rings (10 pts)
  - Test tritium filter excludes systems with 0 icy rings
  - Test edge cases (null icy rings, no planets, mixed ring types)

### Integration Tests
- **tests/integration/cli.golden.test.ts** (extend):
  - Test CLI with `--scoring industrial` (default)
  - Test CLI with `--scoring agriculture`
  - Test CLI with `--scoring tritium`
  - Test CLI with invalid strategy name (error case)
  - Test verbose output shows strategy selection

### Fixtures
- Use existing galaxy fixtures; ensure some systems have icy rings for tritium tests

## Success Metrics

1. **All unit tests pass** for new scoring strategies
2. **All integration tests pass** for CLI flag and strategy routing
3. **Backward compatibility**: No change to results when `--scoring` not provided
4. **Tritium filtering**: Verified that only systems with ≥1 icy ring are returned
5. **Scoring correctness**: Verified point calculations match specification
6. **Error handling**: Invalid strategies rejected with clear error message

## Clarifications

### Session 2026-01-29: All Decisions Implemented ✅

**Q1: When should tritium strategy filtering occur?**
- Decision: Early filtering during read phase (Option A) ✅
- Rationale: Memory efficiency for large datasets
- Implementation: Filtering applied in all three read paths (stdin, JSON array, JSONL file)

**Q2: How should industrial strategy be refactored?**
- Decision: Extract to computeIndustrialScore() (Option A) ✅
- Rationale: Clean separation of concerns, strategy pattern
- Implementation: `computeIndustrialScore()` extracted; router dispatches via `computeScore(system, strategy)`

**Q3: Should tritium filtering stats be visible?**
- Decision: Show filtering stats only in verbose mode (Option C) ✅
- Rationale: Keep default output clean, allow inspection with `--verbose`
- Implementation: `filtered_no_ice=N` shown only when tritium strategy + verbose mode

## Open Questions

- **Q1**: How are icy rings identified in the input data? (Currently assumed `ringClass` contains "Icy")
  - **Resolution**: Validated in research.md - ringClass field contains "Icy" for icy rings

- **Q2**: What should happen if ring data is incomplete or missing?
  - **Resolution**: Assume 0 icy rings; systems silently filtered in tritium mode

- **Q3**: Should agriculture strategy have different criteria in the future?
  - **Resolution**: No - MVP uses identical scoring. Future feature can diverge.

## Notes

This feature establishes the foundation for extensible scoring strategies. Future enhancements could include:
- **Science strategy**: Scores based on discovery/exploration potential
- **Combat strategy**: Scores based on system resources for military logistics
- **Tourism strategy**: Scores based on exotic or rare celestial features
- **Custom strategies**: User-provided scoring functions

The architecture should support these extensions without major refactoring.
