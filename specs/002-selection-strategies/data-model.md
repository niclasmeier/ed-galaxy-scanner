# Data Model: Space Selection Strategies

## Entities

### SpaceSelectionStrategy
- **Fields**:
  - `mode`: `"sphere" | "cube"`
  - `maxDistSol` (number, optional): only used when `mode="sphere"`
  - `cubeFromName` (string, optional): endpoint name for cube lower/upper bounds
  - `cubeToName` (string, optional): endpoint name for cube lower/upper bounds
- **Validation Rules**:
  - `mode` must be one of `sphere` or `cube`.
  - When `mode="cube"`, endpoint names resolve case-insensitively and must map to exactly one system each.
  - When `mode="sphere"`, `maxDistSol` must be a positive finite number.

### SelectionBounds
- **Fields**:
  - `minX`, `minY`, `minZ` (number)
  - `maxX`, `maxY`, `maxZ` (number)
  - `source`: `"sphere" | "cube"`
- **Validation Rules**:
  - `min*` must be <= `max*`.
  - For `source="cube"`, bounds are derived from the two endpoint systems.

### EndpointMatch
- **Fields**:
  - `inputName` (string)
  - `normalizedName` (string)
  - `matchedSystems` (array of `StarSystem` references)
  - `status`: `"resolved" | "not_found" | "ambiguous"`
- **Validation Rules**:
  - `status="resolved"` only when exactly one system matches.

## Relationships

- **SpaceSelectionStrategy** defines or derives a **SelectionBounds**.
- **EndpointMatch** is used to resolve cube endpoints before computing **SelectionBounds**.

## State Transitions

- `unresolved` → `resolved` after successful case-insensitive lookup.
- `unresolved` → `not_found` if zero matches.
- `unresolved` → `ambiguous` if multiple matches.

## Notes

- `StarSystem` remains the existing domain entity; selection strategy operates before eligibility/scoring.
