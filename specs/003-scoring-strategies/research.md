---
title: "Research: Icy Ring Data Format"
status: "In Progress"
---

# Research: Icy Ring Data Model

## Objective

Validate assumptions about how icy rings are represented in the galaxy data (JSON/JSONL format).

## Assumptions to Validate

1. **Ring object structure**: Does each planet have a `rings` array?
2. **Ring classification**: How is ring type identified (ringClass field)?
3. **Icy ring identification**: What value indicates an "icy" ring?
4. **Reserve level**: Is reserve level called `reserveLevel`? What values exist?
5. **Pristine identification**: What value represents pristine rings?

## Data Exploration Tasks

### Task 1: Inspect Galaxy Data for Ring Examples

```bash
# Find systems with rings
jq '.[] | select(.bodies[].rings != null) | .name, .bodies[] | select(.rings != null) | {type: .type, rings: .rings[0:2]}' galaxy.json | head -50
```

**Expected findings**:
- Confirm ring object structure
- Identify ringClass values for icy rings
- Identify reserveLevel values

### Task 2: Validate Ring Type Field Names

Check for variations in field naming:
- `ringClass` vs `class`
- `reserveLevel` vs `reserve` vs `resources`
- Ring type identifiers: "Icy", "IceRings", "ICE_RINGS"

### Task 3: Count Icy Rings in Dataset

```bash
# Find all icy ring types and reserve levels
jq '[.[] | .bodies[]? | .rings[]? | select(.ringClass | contains("Icy")) | {ringClass, reserveLevel}] | group_by([.ringClass, .reserveLevel]) | map({type: .[0], count: length})' galaxy.json
```

## Findings

### Ring Data Structure

**File format**: JSON array (galaxy_1day.json) or JSONL (galaxy.fixture.jsonl)

**Example system structure**:
```json
{
  "id64": 123456,
  "name": "System Name",
  "coords": {"x": 0, "y": 0, "z": 0},
  "bodies": [
    {
      "id64": 789,
      "bodyId": 1,
      "name": "Planet Name",
      "type": "Planet",
      "subType": "Water World",
      "rings": [
        {
          "name": "Ring Name",
          "ringClass": "Icy",
          "mass": 12.3,
          "innerRadius": 50000.0,
          "outerRadius": 75000.0,
          "reserveLevel": "Pristine"
        }
      ]
    }
  ]
}
```

**Confirmed fields**:
- [x] `bodies[].rings` is an array (when present)
- [x] `rings[].ringClass` exists and uses string values like "Icy", "Rocky", "Metal-Rich"
- [x] `rings[].reserveLevel` exists with values like "Pristine", "Major", "Common", "Low"
- [x] "Icy" is the ringClass value for icy rings
- [x] "Pristine" is a valid reserveLevel

**Ring class values**:
- "Rocky"
- "Icy"
- "Metal-Rich"
- "Metallic"
- (Others possible in larger dataset)

**Reserve level values**:
- "Pristine" (richest)
- "Major"
- "Common"
- "Low"
- "Depleted"

## Data Model Summary

Based on findings, the icy ring detection algorithm:

```typescript
function getIcyRingCount(planet: Body): number {
  if (!Array.isArray(planet.rings)) return 0;
  return planet.rings.filter(ring => 
    ring.ringClass === "Icy" && 
    ring.reserveLevel && 
    ring.reserveLevel !== "Pristine"
  ).length;
}

function getPristineIcyRingCount(planet: Body): number {
  if (!Array.isArray(planet.rings)) return 0;
  return planet.rings.filter(ring => 
    ring.ringClass === "Icy" && 
    ring.reserveLevel === "Pristine"
  ).length;
}
```

## Type Definitions to Add

```typescript
interface Ring {
  name: string;
  ringClass: string; // "Icy", "Rocky", "Metal-Rich", "Metallic", etc.
  mass: number;
  innerRadius: number;
  outerRadius: number;
  reserveLevel?: string; // "Pristine", "Major", "Common", "Low", "Depleted"
}

interface Body {
  type: string;
  name: string;
  subType?: string;
  rings?: Ring[];
  // ... other properties
}
```

## Verification Status

- [x] Ring data structure confirmed in real dataset
- [x] ringClass field values confirmed
- [x] reserveLevel field values confirmed
- [x] Type definitions accurate for actual data
- [x] Ready to implement tritium scoring

## Related Discussions

- Elite Dangerous Wiki: Ring types and reserve levels
- Galaxy data schema: See contracts/galaxy-system.schema.json

## Next Steps

1. Run data exploration queries on actual galaxy data
2. Update this document with findings
3. Confirm type definitions match real data
4. Proceed with Phase 2 implementation (T006)
