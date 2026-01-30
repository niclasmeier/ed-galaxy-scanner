# Research: Space Selection Strategies

## Decision 1: Strategy configuration via CLI options
- **Decision**: Add a single `--selection-strategy` option with values `sphere` (default) and `cube`, plus cube endpoints as `--cube-from` and `--cube-to` (default Sol and Colonia when omitted).
- **Rationale**: A single strategy flag is explicit, easy to document, and preserves backwards compatibility by defaulting to sphere.
- **Alternatives considered**:
  - Separate `--sphere`/`--cube` boolean flags (ambiguous when both provided).
  - Inferring strategy from presence of cube endpoints (less explicit and harder to validate).

## Decision 2: Case-insensitive endpoint matching strategy
- **Decision**: Build a lowercase name index once, mapping each normalized name to a list of matching systems; resolve endpoints by lookup and error if 0 or >1 matches.
- **Rationale**: Single-pass indexing is efficient for large datasets and makes ambiguity detection explicit.
- **Alternatives considered**:
  - Linear scan each time (simpler but slower on large datasets).
  - Normalizing and using first match (would hide ambiguity).

## Decision 3: Cube bounds and filtering order
- **Decision**: For cube strategy, compute axis-aligned bounds from the two endpoints and filter systems within bounds before applying existing eligibility and scoring rules.
- **Rationale**: Selection strategy defines the working set; keeping it early maintains predictable behavior.
- **Alternatives considered**:
  - Apply cube filtering after eligibility (might allow systems outside the requested region to influence eligibility).

## Decision 4: Handling `--max-dist-sol` in cube strategy
- **Decision**: Ignore `--max-dist-sol` when cube strategy is selected, as specified.
- **Rationale**: Avoids mixing two spatial constraints that could surprise users.
- **Alternatives considered**:
  - Intersect cube with max distance (unexpected for users expecting cube-only).

## Decision 5: Missing coordinates handling
- **Decision**: Exclude systems with missing required coordinate data from selection and count them in a skip metric.
- **Rationale**: Ensures data validation without disrupting the run when only some records are malformed.
- **Alternatives considered**:
  - Hard-fail on any missing coordinates (too strict for large datasets).
