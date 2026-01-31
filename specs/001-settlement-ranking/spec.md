# Feature Specification: Settlement Candidate Ranking CLI

**Feature Branch**: `001-settlement-ranking`  
**Created**: 2026-01-29  
**Status**: Draft  
**Input**: User description: "Build a CLI tool to extract an ordered list of planets suitable for settlement in Elite Dangerous, using galaxy.json lines (name, coords, allegiance, population, stations). Start from populated systems, find colonizable systems within 15LY of previously settled systems, score systems by star/planet types (1 per star, 2 per neutron, 5 per planet, 4 per gas giant, 7 per landable, 8 per water world, 9 per terraformable, 10 per high metal content), ignore systems without planets, order by points, and accept parameters for input file and --max-dist-sol (default 1000LY). Support quadrant filtering based on galactic position relative to Sagittarius A* at (25.21875/-20.90625/25899.96875) with --use-quadrants flag."

## Clarifications

### Session 2026-01-29

- Q: When performance limits are exceeded, how should the CLI respond? → A: Warn and continue; include a suggested --max-dist-sol value in the message.
- Q: At what threshold should the performance warning trigger? → A: Warn when selected systems exceed 200,000.
- Q: What should the exit behavior be when invalid records are encountered by default? → A: By default, invalid records are warnings and exit code stays 0; non-zero only if --continue-on-error is false.
- Q: How are the four galactic quadrants defined? → A: North-West (NW), North-East (NE), South-West (SW), South-East (SE) when viewed from above; division is based on X and Y coordinates relative to Sagittarius A* at (25.21875, -20.90625); Z coordinate is omitted for quadrant determination.
- Q: What is the coordinate of Sagittarius A*? → A: (25.21875, -20.90625, 25899.96875); the galactic center used as the origin for quadrant boundaries.
- Q: When should quadrant filtering happen? → A: During the read phase, discarding systems not in the requested quadrants immediately to reduce memory and processing load.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate ranked settlement candidates (Priority: P1)

As a player, I want a command to produce an ordered list of settlement candidates
from the galaxy data so I can quickly identify the best nearby targets.

**Why this priority**: This is the core value of the tool and enables all other
workflow choices.

**Independent Test**: Run the tool on a fixed sample file and verify it returns
a deterministic, sorted list of candidates with scores.

**Acceptance Scenarios**:

1. **Given** a valid galaxy data file, **When** I run the tool with defaults,
   **Then** I receive a list of candidates ordered by score and limited to
   systems that meet the settlement rules.
2. **Given** a limit value, **When** I run the tool with that limit,
   **Then** it returns no more than that many results.
2. **Given** a valid galaxy data file, **When** I request simple output,
  **Then** the output is a markdown table with columns for name, nearest, score,
  number of stars, number of bodies, and number of stations.
2. **Given** `--verbose` is set, **When** the file is read,
   **Then** the tool prints "Reading " followed by a dot for every 10,000
   systems read, and then prints a summary of broken lines, empty systems,
   populated systems, quadrants, and total results.
2. **Given** a galaxy data file where no eligible candidates exist, **When** I run
   the tool, **Then** it reports zero candidates without error.

---

### User Story 2 - Limit search to a Sol distance (Priority: P2)

As a player, I want to cap the search radius from Sol so I can focus on a local
region of space.

**Why this priority**: It keeps results relevant and reduces scope when desired.

**Independent Test**: Run the tool twice with different max distances and verify
the broader run includes all systems from the narrower run.

**Acceptance Scenarios**:

1. **Given** a max distance value, **When** I run the tool with that value,
   **Then** no candidate system beyond that distance appears in the results.

---

### User Story 3 - Understand why a system ranks highly (Priority: P3)

As a player, I want to see the score breakdown so I can trust the ranking.

**Why this priority**: Transparency helps validate results and supports decision-making.

**Independent Test**: Run the tool on a dataset with known body counts and confirm
the breakdown matches the scoring rules.

**Acceptance Scenarios**:

1. **Given** a candidate system, **When** the results are presented,
   **Then** the output shows how the total score was calculated.

---

### Edge Cases

- What happens when the input file is missing or unreadable?
- What happens when the input file ends with .gz but is not a valid gzip file?
- How does the tool handle a line that is not valid JSON? It skips the line, logs a warning, and continues processing.
- What happens when Sol is not present in the dataset?
- How are ties handled when multiple systems share the same score?
- What happens when no populated systems exist in the dataset?
- What happens when an invalid quadrant name is provided? The CLI MUST reject it with a clear error message.
- What happens when no systems exist in the requested quadrants? The CLI MUST report zero candidates without error.

## Testing Strategy & Tooling (Bun + TypeScript CLI)

### Recommended Test Layers

- **Unit tests (fast, deterministic)**
  - Focus on pure functions: distance calculation, scoring, filtering rules, tie-breaking.
  - Use table-driven tests for scoring breakdowns and edge-case bodies.
  - Mock time/randomness if introduced (keep results deterministic).

- **Integration tests (CLI behavior)**
  - Spawn the CLI as a subprocess and assert:
    - exit code
    - stdout (primary output)
    - stderr (errors, warnings)
  - Use fixtures: small, deterministic line-delimited JSON inputs (e.g., `galaxy_small.json`).
  - Validate output formatting and ordering. Prefer snapshot or golden-file comparisons for full output.

- **End-to-end tests (optional)**
  - Run against a larger dataset to validate performance constraints and memory behavior.
  - Keep these minimal in CI; run on demand or nightly.

### Bun Test Runner Tooling Notes (from Bun docs)

- Use Bun’s built-in test runner (`bun test`) with `bun:test` APIs for TypeScript support.
- Snapshot testing is supported (`toMatchSnapshot`) and can be updated with `--update-snapshots`.
- CI reporting: JUnit XML supported via `--reporter=junit --reporter-outfile=...`.
- Concurrency controls: `--concurrent`, `--max-concurrency`, `test.serial` for stateful tests.
- Stability tools: `--randomize`/`--seed` to surface order dependencies, `--rerun-each` for flake detection.
- Timeouts: `--timeout` defaults to 5000ms; tighten for unit tests, relax for heavy integration cases.

### CLI Output Testing Best Practices

- **Use `Bun.spawnSync`/`Bun.spawn`** to run the CLI in tests and capture `stdout`/`stderr` and exit code.
- **Normalize output** in tests if needed (trim trailing whitespace, normalize line endings) to avoid OS-specific flakes.
- **Golden files / snapshots** for full output comparison; prefer explicit assertions for critical lines (e.g., top 5 results).
- **Deterministic ordering**: enforce tie-breaker rules in the implementation and assert them in tests.
- **Isolate test data**: keep fixtures immutable; avoid shared temp directories across concurrent tests.

### Suggested Coverage Targets

- Scoring rules: 100% coverage of all body-type scoring branches.
- Eligibility rules: 100% coverage of population, distance-to-Sol, and 15 LY constraints.
- CLI I/O: at least one integration test per primary flag and error case.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST accept a file path input and process either line-delimited
  JSON objects (JSONL) or a single JSON array of star systems.
- **FR-001a**: If the input file name ends with `.gz`, the system MUST transparently
  decompress the file and parse it as JSONL or a JSON array using the same rules as
  uncompressed input.
- **FR-002**: The system MUST classify systems as populated when population $> 0$
  and empty when population $\le 0$.
- **FR-003**: The system MUST allow a max distance to Sol parameter, defaulting
  to 1000 LY, and exclude systems beyond that distance.
- **FR-004**: The system MUST compute system distance using the coordinates in
  the input data.
- **FR-005**: The system MUST compute a deterministic value score per system using:
  1 point per star, 2 per neutron star, 5 per planet, 4 per gas giant,
  7 per landable planet, 8 per water world, 9 per terraformable world,
  and 10 per high metal content world.
- **FR-006**: The system MUST ignore systems with zero planets by assigning them
  a value of 0 and excluding them from ranked results.
- **FR-007**: The system MUST consider candidate systems that are within
  $\le 15\,\text{LY}$ of previously settled systems, where "previously settled"
  means only the initially populated systems (single-pass, no iterative expansion).
- **FR-007a**: The system MUST support a mode that bypasses the colonization
  eligibility check (no $\le 15\,\text{LY}$ requirement) and returns scored systems
  after basic filters (quadrants, max-distance-to-Sol, planet presence). This MUST
  be enabled via `--colonization-mode none` (default: `--colonization-mode standard`).
- **FR-007b**: When enabled, the system MUST require that eligible systems are
  reachable from Sol via a chain of systems where each hop is $\le 15\,\text{LY}$.
  This route constraint MUST be applied before returning candidates and MUST be
  enabled via `--require-sol-route`.
- **FR-008**: The system MUST define "suitable for settlement" as any empty
  system with at least one planet.
- **FR-009**: The system MUST output results ordered by total score descending and
  apply a deterministic tie-breaker (assumption: alphabetical by system name).
- **FR-010**: The system MUST output the ranked list as systems only, including
  total score and a score breakdown.
- **FR-010a**: The system MUST support a simple output format that includes the
  system name, nearest populated system name, distance to Sol (in LY), total score,
  number of stars, number of bodies, and number of stations, formatted as a markdown table.
- **FR-010b**: The system MUST support a `--limit` parameter that caps the
  number of returned results, defaulting to 20.
- **FR-010c**: The system MUST support a `--verbose` flag that prints "Reading "
  followed by a continuously updated inline stats readout (systems read, populated
  systems, discarded by quadrants, and discarded by other filters such as tritium).
  The CLI MUST still print a summary after reading with broken lines, empty systems,
  populated systems, quadrants, and total result count.
- **FR-010c1**: Live verbose statistics MUST format counts with a thousands separator.
- **FR-010d**: The system MUST remove Fleet Carriers from station lists early
  and exclude them from station counts.
- **FR-015**: When performance limits are exceeded (more than 200,000 selected systems), the CLI MUST warn and continue, and the warning MUST include a suggested `--max-dist-sol` value.
- **FR-016**: By default, invalid records MUST be reported as warnings to stderr without a non-zero exit code. If `--continue-on-error` is false, the CLI MUST return a non-zero exit code on invalid records. When invalid records are skipped, the CLI MUST report skipped record counts.
- **FR-017**: The system MUST support galactic quadrant filtering via `--use-quadrants` flag accepting a comma-separated list of quadrant names (NW, NE, SW, SE) or the value "all" for all quadrants. Default MUST be SW (South-West).
- **FR-017a**: The system MUST define quadrants based on X and Y coordinates relative to Sagittarius A* at (25.21875, -20.90625). The Z coordinate MUST be ignored for quadrant determination. NW: x < 25.21875 AND y > -20.90625; NE: x > 25.21875 AND y > -20.90625; SW: x < 25.21875 AND y < -20.90625; SE: x > 25.21875 AND y < -20.90625.
- **FR-017b**: Quadrant filtering MUST occur during the read phase (before indexing) to discard non-matching systems immediately and reduce memory footprint.
- **FR-018**: When `--verbose` is enabled, the system MUST report how many systems were discarded due to quadrant filtering.
- **FR-018a**: The live verbose readout MUST include counts for systems read, populated systems, and discarded by quadrants (and other read-phase filters when enabled).
- **FR-018b**: The live verbose readout MUST format all numeric counts with a thousands separator.
- **FR-011**: The system MUST filter systems beyond the max-distance-to-Sol threshold before indexing.
- **FR-012**: The system MUST partition systems into populated and empty lists before spatial indexing.
- **FR-013**: The system MUST index systems into 50 LY cubes (on-demand creation) and maintain a list of cubes containing at least one system, with a flag indicating whether the cube contains any populated systems.
- **FR-013**: The system MUST index systems into spatial buckets sized to the
  eligibility radius (default 15 LY) and maintain a list of buckets containing at
  least one system, with a flag indicating whether the bucket contains any populated systems.
- **FR-014**: The system MUST iterate populated buckets and compare populated systems
  against empty systems in the current bucket plus 26 adjacent buckets when evaluating
  15 LY eligibility.
- **FR-014a**: The system MUST deduplicate candidates and store the nearest populated
  system name and distance for deterministic output when multiple populated systems
  are within range.

### Key Entities *(include if feature involves data)*

- **Star System**: Name, coordinates, population status, allegiance, distance to Sol,
  and a summary of bodies used for scoring.
- **Celestial Body**: Body type (star/planet variants), landable flag, terraformable flag,
  used to compute system score.
- **Settlement Candidate**: A star system (or planet) that meets distance and eligibility
  rules and carries a total score plus a breakdown.

## Assumptions

- The dataset contains Sol with valid coordinates or the tool will report an error.
- Each system provides enough body metadata to count stars and planet types needed
  for scoring.
- Distance is computed from 3D coordinates using straight-line distance.
- If the input file ends with `.gz`, it is a valid gzip-compressed file.

## Algorithm Outline (authoritative)

1. Read systems from input.
2. Filter out systems beyond the max-distance-to-Sol threshold.
3. Split systems into populated (population $> 0$) and empty (population $\le 0$).
4. If `--require-sol-route` is enabled, build a reachability set from Sol using hops of
  $\le 15$ LY (grid/KD-tree neighbor lookup) and discard systems not reachable.
5. If `--colonization-mode none` is enabled, score eligible systems directly (empty
  systems with at least one planet) and skip steps 6–7.
6. Index systems into radius-sized buckets (created on demand). Maintain a list of
  buckets that contain at least one system and mark buckets that contain any populated system.
7. For each bucket with populated systems:
  - Build the candidate empty list from that bucket plus its 26 adjacent buckets.
  - For each populated system in the current bucket, measure distance to candidate empties.
  - If distance $\le 15$ LY, compute score, track nearest populated system, and
   deduplicate candidates deterministically.
8. After all buckets are processed, sort results by score (desc) then name (asc) and return.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate a ranked list from a valid file in a single command
  without manual post-processing.
- **SC-002**: Re-running the tool on the same input produces identical ordering in 100%
  of runs.
- **SC-003**: The tool returns results within 20 seconds for a 50,000-system dataset.
- **SC-004**: Acceptance tests demonstrate 100% compliance with the 15 LY rule and
  max-distance-to-Sol filter.
