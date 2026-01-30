# Feature Specification: Space Selection Strategies

**Feature Branch**: `001-selection-strategies`  
**Created**: 2026-01-29  
**Status**: Draft  
**Input**: User description: "Add a new spec to introduce different strategies for system selection. Instead in a sphere around Sol an alternate strategy could be a cube where the two edge points can be supplied via command line (default to Sol and Colonia) case-insensit"

## Clarifications

### Session 2026-01-29

- Q: How should the CLI behave when an endpoint name matches multiple systems case-insensitively? → A: Fail with a non-zero exit code and a clear error message.
- Q: Should `--max-dist-sol` apply when the cube strategy is selected? → A: Ignore `--max-dist-sol` when cube strategy is selected.
- Q: What should happen if both sphere and cube parameters are provided? → A: Treat it as an error (non-zero exit code).
- Q: What if `--cube-from` or `--cube-to` is provided without `--selection-strategy`? → A: Default to cube strategy.
- Q: What is the default for `--cube-to` when omitted? → A: Default `--cube-to` to Sol.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Select systems by cube bounds (Priority: P1)

As a user running the ranking tool, I want to select systems using a cube bounded by two named systems so I can analyze a specific rectangular region rather than a sphere.

**Why this priority**: This enables an alternate selection strategy that changes which systems are considered, which is the core of the requested feature.

**Independent Test**: Can be fully tested by running the tool with the cube strategy and two endpoint names and verifying the selected systems fall within the cube bounds.

**Acceptance Scenarios**:

1. **Given** a dataset containing the two endpoint system names, **When** I select the cube strategy and provide those names, **Then** only systems inside the cube bounded by those endpoints are eligible for ranking.
2. **Given** endpoint names that differ only by case, **When** I run the cube strategy, **Then** the system names are matched case-insensitively.

---

### User Story 2 - Use default endpoints (Priority: P2)

As a user, I want both cube and area strategies to default to Sol when I do not provide endpoints, so I can get meaningful output without extra parameters.

**Why this priority**: Defaults reduce friction and provide an immediate useful region for cube and area strategies.

**Independent Test**: Can be tested by running cube/area strategies with no endpoints and verifying Sol/Colonia constants are used.

**Acceptance Scenarios**:

1. **Given** no endpoints are provided, **When** I select the cube strategy, **Then** Sol (0/0/0) and Colonia (-9530.5/-910.28125/19808.125) coordinates are used for bounds without system lookup.
2. **Given** no endpoints are provided, **When** I select the area strategy, **Then** Sol (0/0/0) and Colonia (-9530.5/-910.28125/19808.125) coordinates are used for bounds without system lookup.
3. **Given** I provide `--cube-from "0/0/0"`, **When** I run the tool, **Then** the coordinate is parsed and used directly without system name lookup.

---

### User Story 3 - Select systems by area bounds (Priority: P2)

As a user analyzing a specific 2D region, I want to select systems using an area bounded by two endpoint systems (ignoring Z coordinate) so I can focus on the galactic plane without worrying about vertical distribution.

**Why this priority**: Provides an alternative to 3D cube selection for 2D galactic plane analysis, equally important to cube selection.

**Independent Test**: Can be tested by running the tool with the area strategy and two endpoint names and verifying the selected systems fall within the area bounds (X-Y only).

**Acceptance Scenarios**:

1. **Given** a dataset with two endpoint systems, **When** I select the area strategy with those endpoints, **Then** only systems inside the area bounded by those endpoints are eligible (considering only X and Y coordinates).
2. **Given** endpoint names that differ only by case, **When** I run the area strategy, **Then** the system names are matched case-insensitively.

---

### User Story 4 - Keep existing sphere selection (Priority: P3)

As a user who prefers the existing behavior, I want the default selection strategy to remain a sphere around Sol so my current workflows continue to work.

**Why this priority**: Preserves backward compatibility while introducing new strategies.

**Independent Test**: Can be tested by running the tool without specifying a strategy and verifying the selection is based on a sphere around Sol.

**Acceptance Scenarios**:

1. **Given** no strategy is specified, **When** I run the tool, **Then** it uses the spherical selection around Sol.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Endpoint system name is not found in the input dataset.
- Endpoint name matches multiple systems case-insensitively.
- Both endpoints resolve to the same system or coordinates (degenerate cube or area).
- Cube/area selection yields zero systems.
- Dataset contains systems with missing X, Y, or Z coordinates.
- User specifies both sphere and cube/area parameters simultaneously.
- Two systems have identical X-Y coordinates but differ in Z (area boundary edge case).
- Invalid coordinate format provided (e.g., "x/y" missing Z, non-numeric values).
- Coordinate string with whitespace (e.g., "0.0 / 1.0 / 2.0" vs "0.0/1.0/2.0").

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST support at least three space selection strategies: spherical (around Sol), cubic (bounded by two endpoint systems in 3D space), and area (bounded by two endpoint systems on the X-Y plane, ignoring Z coordinate).
- **FR-002**: System MUST allow users to choose the space selection strategy via command-line options.
- **FR-003**: For the cube strategy, users MUST be able to supply two endpoints as either system names (case-insensitive) or coordinates in the format "x/y/z" (e.g., "-9530.5/-910.28125/19808.125").
- **FR-003a**: For the area strategy, users MUST be able to supply two endpoints as either system names (case-insensitive) or coordinates in the format "x/y/z" (e.g., "-9530.5/-910.28125/19808.125"). Area selection considers only X and Y coordinates, ignoring Z.
- **FR-004**: If cube endpoints are not supplied, the system MUST default `--cube-from` to Sol (0/0/0) and `--cube-to` to Colonia (-9530.5/-910.28125/19808.125) using hardcoded coordinate constants (no system lookup required).
- **FR-004a**: If area endpoints are not supplied, the system MUST default `--area-from` to Sol (0/0/0) and `--area-to` to Colonia (-9530.5/-910.28125/19808.125) using hardcoded coordinate constants (no system lookup required).
- **FR-005**: The cube bounds MUST be defined by the minimum and maximum coordinates of the two endpoint systems (axis-aligned bounds).
- **FR-005a**: The area bounds MUST be defined by the minimum and maximum X and Y coordinates of the two endpoint systems, ignoring Z coordinate (axis-aligned bounds on X-Y plane).
- **FR-006**: If an endpoint name is not found or is ambiguous, the system MUST present a clear error, stop the run, and return a non-zero exit code.
- **FR-006a**: This error handling applies to both cube and area strategy endpoint resolution.
- **FR-007**: The default behavior with no space selection strategy specified MUST remain the spherical selection around Sol.
- **FR-008**: The system MUST exclude any system missing required coordinate data from selection and report how many were skipped.
- **FR-009**: When the cube strategy is selected, the system MUST ignore `--max-dist-sol` during selection.
- **FR-009a**: When the area strategy is selected, the system MUST ignore `--max-dist-sol` and the Z coordinate during selection.
- **FR-010**: If both sphere and cube/area parameters are provided, the system MUST return a non-zero exit code and a clear error message.
- **FR-011**: If `--cube-from` or `--cube-to` is provided without `--selection-strategy`, the system MUST default to cube strategy.
- **FR-011a**: If `--area-from` or `--area-to` is provided without `--selection-strategy`, the system MUST default to area strategy.
- **FR-012**: When `--verbose` is enabled, the system MUST output the selected space selection strategy and the resulting selection bounds (min/max coordinates for cube, min/max X-Y coordinates for area, or radius for sphere) to console.
- **FR-013**: The system MUST parse coordinate strings in the format "x/y/z" (e.g., "-9530.5/-910.28125/19808.125") and use these coordinates directly without system name lookup.
- **FR-014**: The system MUST define constants for Sol (0/0/0) and Colonia (-9530.5/-910.28125/19808.125) to use as defaults when cube/area endpoints are not provided.

### Key Entities

- **Space Selection Strategy**: The user-chosen method for selecting systems (spherical or cubic).
- **Selection Bounds**: The spatial limits derived from the chosen strategy, including the two endpoint systems for the cube.
- **Endpoint Match**: The case-insensitive resolved system record used as a cube corner.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: In acceptance tests, 100% of systems included by the cube strategy have coordinates within the bounds derived from the two endpoints.
- **SC-002**: Case-insensitive endpoint matching succeeds for 100% of test cases that differ only by letter casing.
- **SC-003**: When cube endpoints are omitted, 100% of runs use Sol and Colonia as defaults.
- **SC-004**: The spherical strategy produces identical results to the current behavior in at least 20 regression test cases.

## Assumptions

- The input dataset contains unique system names that can be matched case-insensitively.
- Sol and Colonia exist in the dataset used for default cube endpoints.

## Dependencies

- Availability of system coordinate data in the input dataset.
